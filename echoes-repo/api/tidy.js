// Vercel serverless function: audio → transcript → tidied story with notes.
// Provider is chosen by which key is set in Vercel → Settings → Environment Variables:
//   DASHSCOPE_API_KEY  → Alibaba Model Studio (international): Qwen3-ASR-Flash (dialect-aware) + qwen-plus   ← preferred
//   OPENAI_API_KEY     → OpenAI: whisper-1 + gpt-4o-mini                                                     ← fallback
// Keys live only here; the browser never sees them. The front end always posts the same JSON regardless of provider.
// Request:  POST { audioUrl: <https link to the recording>  — or —  audio: <base64, small clips only>, mime, durationSec, question, profile: { name, hometown, birth, places, dialects }, lang: 'zh'|'en' }
//   The browser uploads the recording to Supabase Storage first and sends a signed link, so no audio passes through this function
//   (Vercel caps request bodies at 4.5 MB → HTTP 413; base64 is only kept for the demo/no-database case).
//   Short clips (≤ 4.5 min) → qwen3-asr-flash, one call. Longer → qwen3-asr-flash-filetrans, which is asynchronous:
//   this returns 202 { taskId }, and the browser polls GET /api/tidy?task=<id>&… until it gets the story.
// Response: { title, text: { first: [...], raw: [...] }, terms: [{ id, word, kind, note, status:'pending' }], topics, people, era, place, transcript, provider }

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

// Model Studio (Singapore) keys are bound to a workspace, and each workspace has its own base URL:
//   https://<workspace-id>.ap-southeast-1.maas.aliyuncs.com
// The workspace id is shown in the console's API code sample / Workspace Management page (it is an identifier, not a secret).
// Override with the DASHSCOPE_BASE_URL env var if the workspace ever changes.
const DASH = (process.env.DASHSCOPE_BASE_URL || 'https://ws-362kz2csbr5yghzo.ap-southeast-1.maas.aliyuncs.com').replace(/\/$/, '');
const SYSTEM = `你是一位帮助家庭整理长辈口述历史的编辑。你会收到一段长辈回答某个问题的语音转写稿（可能有口头禅、重复、方言词）。
最重要的规则：你只能整理讲述者说过的话。绝对不能添加转写稿里没有的事实、细节、物件、人物或解释。"问题"只是背景——讲述者没有回答到的部分，留空，不要替他回答。转写稿很短就输出很短；一句话就是一段。
转写稿可能把方言词听成同音的别字（比如上海话"生煎包"被写成"桑荠包"）。遇到不像正常词的字，不要硬解释，而是保留原字，在 terms 里标出来，note 写"可能是 ×× 话的「××」，请家人确认"。
请做四件事，并只输出 JSON：
1. "title"：8–14 个字的故事标题，像书里的小节名，不要用"关于""我的"开头。标题也只能来自转写内容。
2. "paragraphs"：把转写整理成通顺的第一人称叙述，段落数按内容定（1–5 段）。只做：去掉口头禅和重复、补标点、按话题分段。保留讲述者的说话方式和用词，不要文艺加工。把你认为"不懂这个方言/年代的读者可能看不懂"的词在正文里用方括号标出来，例如 "要凭[粮票]买"。每个词只标第一次出现。
3. "terms"：对每个方括号里的词给出 {"word","kind","note"}。kind 是 方言 / 历史 / 物件 / 食物 / 地名 / 习俗 之一；note 是一句话解释，20 字以内。不确定就写你最可能的解释并注明"请家人确认"。
4. "topics"（1–3 个，如 童年、饮食、家人）、"people"（文中提到的称谓，如 母亲、外婆）、"era"（如 1940s，依据讲述者出生年和内容推断，推不出就留空）、"place"（故事发生地，一个词，转写没提就留空）。
如果转写是英文，所有输出也用英文；kind 用 dialect / history / object / food / place / custom。`;

const fmtOf = (mime) => mime.includes('mp4') || mime.includes('m4a') ? 'm4a' : mime.includes('mpeg') || mime.includes('mp3') ? 'mp3' : mime.includes('wav') ? 'wav' : mime.includes('ogg') ? 'ogg' : 'webm';


// ---- context for the speech model ------------------------------------------
// Qwen3-ASR reads the system text as "what this recording is probably about": a real sentence plus likely words
// steers it toward the right spelling of dialect terms (上海话 "生煎包" otherwise comes out as a sound-alike).
const DIALECT_WORDS = {
  上海话: '阿拉、侬、伊、姆妈、阿爸、爷叔、娘舅、阿婆、弄堂、石库门、亭子间、生煎包、小笼包、馄饨、粢饭、大饼油条、葱油饼、咸菜、泡饭、煤球炉、老虎灶、黄鱼车、白相、结棍、作孃、吃力、一刚',
  吴语: '阿拉、侬、姆妈、弄堂、生煎包、馄饨、粢饭、泡饭、白相',
  粤语: '阿妈、阿爸、嫲嫲、阿公、茶楼、饮茶、虾饺、烧卖、肠粉、白粥、油炸鬼、骑楼、街市、返工、放工、靓、好犀利',
  四川话: '婆婆、幺儿、嬢嬢、老汉儿、坝坝、院坝、抄手、凉粉、豆花、回锅肉、巴适、安逸、摆龙门阵、要得',
  东北话: '咱、俺、嘎哈、唠嗑、整、贼、老鼻子、炕、大酱、酸菜、粘豆包、冻梨',
  闽南语: '阿嬷、阿公、厝、肉粽、蚵仔煎、面线糊、古早味、拜拜',
  客家话: '阿婆、阿公、围屋、擂茶、酿豆腐、客家话',
  兰州话: '咋价、么、尕、牛肉面、浆水、灶火、炕',
  南昌话: '恩、哩、年糕、米粉、瓦罐汤、藜蒿、木甑',
};
function asrContext({ question, profile, lang }) {
  const dialects = (profile.dialects || []).filter(Boolean);
  const words = dialects.flatMap((d) => Object.entries(DIALECT_WORDS).filter(([k]) => d.includes(k) || k.includes(d)).map(([, v]) => v));
  if (lang === 'en') return [`An elder${profile.hometown ? ' from ' + profile.hometown : ''} telling a family story. Question: ${question}.`].join(' ');
  return [
    `一位${profile.hometown ? profile.hometown + '的' : ''}长辈在讲家里的往事${dialects.length ? '，说的是' + dialects.join('、') + '，可能夹杂方言词' : ''}。`,
    question ? `话题：${question}。` : '',
    words.length ? `可能出现的词：${words.join('、')}。` : '',
    profile.name ? `讲述者：${profile.name}。` : '',
  ].filter(Boolean).join('');
}

// ---- speech to text --------------------------------------------------------
const MIME_BY_EXT = { mp3: 'audio/mpeg', m4a: 'audio/mp4', mp4: 'audio/mp4', wav: 'audio/wav', flac: 'audio/flac', ogg: 'audio/ogg', opus: 'audio/ogg', webm: 'audio/webm', aac: 'audio/aac' };
const extOf = (url) => (String(url).split('?')[0].match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase();
// Fetch the recording ourselves and hand the model bytes with an explicit media type. The storage link is only a way to
// get the file into this function without going through the 4.5 MB request limit.
async function fetchAudio(audioUrl) {
  const r = await fetch(audioUrl);
  if (!r.ok) throw new Error('could not download the recording (' + r.status + ')');
  const buf = Buffer.from(await r.arrayBuffer());
  const ct = (r.headers.get('content-type') || '').split(';')[0].trim();
  const mime = MIME_BY_EXT[extOf(audioUrl)] || (ct.startsWith('audio/') ? ct : 'audio/webm');
  return { audio: buf.toString('base64'), mime, bytes: buf.length };
}
async function transcribeDashscope({ key, audio, audioUrl, mime, hint, lang }) {
  // Qwen3-ASR-Flash: audio goes inside a message as a data URI; the system text biases spelling of names, places, dialect words.
  if (audioUrl) { const f = await fetchAudio(audioUrl); audio = f.audio; mime = f.mime; }
  if (mime === 'audio/x-m4a') mime = 'audio/mp4';
  const body = {
    model: 'qwen3-asr-flash',
    input: { messages: [{ role: 'system', content: [{ text: hint || '' }] }, { role: 'user', content: [{ audio: `data:${mime};base64,${audio}` }] }] },
    parameters: { asr_options: { enable_itn: true, ...(lang === 'zh' ? { language: 'zh' } : {}) } },
  };
  const r = await fetch(DASH + '/api/v1/services/aigc/multimodal-generation/generation', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('Qwen3-ASR: ' + (await r.text()).slice(0, 300));
  const j = await r.json();
  const c = j?.output?.choices?.[0]?.message?.content;
  const text = Array.isArray(c) ? c.map((x) => x.text || '').join('') : (c?.text || c || '');
  return String(text).trim();
}
async function transcribeOpenai({ key, audio, mime, hint, lang }) {
  const form = new FormData();
  form.append('file', new Blob([Buffer.from(audio, 'base64')], { type: mime }), 'take.' + fmtOf(mime));
  form.append('model', 'whisper-1');
  if (lang === 'zh') form.append('language', 'zh');
  if (hint) form.append('prompt', hint);
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: 'Bearer ' + key }, body: form });
  if (!r.ok) throw new Error('Whisper: ' + (await r.text()).slice(0, 300));
  return ((await r.json()).text || '').trim();
}


// ---- long recordings: asynchronous file transcription ---------------------
// qwen3-asr-flash (synchronous) stops at 10 MB / 5 minutes. Elders talk longer than that, so anything over LONG_SEC goes to
// qwen3-asr-flash-filetrans: submit the link, get a task id, poll until SUCCEEDED, then read the transcript JSON it points to.
const LONG_SEC = 270;
async function submitFiletrans({ key, audioUrl, lang, hint }) {
  const headers = { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'X-DashScope-Async': 'enable' };
  const base = { model: 'qwen3-asr-flash-filetrans', input: { file_url: audioUrl } };
  const params = { enable_itn: true, ...(lang === 'zh' ? { language: 'zh' } : {}) };
  // `corpus.text` (context words) appears in Alibaba's samples but not in the parameter table — try with it, fall back without.
  let r = await fetch(DASH + '/api/v1/services/audio/asr/transcription', { method: 'POST', headers, body: JSON.stringify({ ...base, parameters: { ...params, corpus: { text: hint || '' } } }) });
  if (!r.ok) r = await fetch(DASH + '/api/v1/services/audio/asr/transcription', { method: 'POST', headers, body: JSON.stringify({ ...base, parameters: params }) });
  if (!r.ok) throw new Error('Qwen3-ASR filetrans: ' + (await r.text()).slice(0, 300));
  const j = await r.json(); const id = j?.output?.task_id;
  if (!id) throw new Error('Qwen3-ASR filetrans: no task id');
  return id;
}
// → { done: false } while running, { done: true, transcript } when finished; throws when the task failed.
async function pollFiletrans({ key, taskId }) {
  const r = await fetch(DASH + '/api/v1/tasks/' + encodeURIComponent(taskId), { headers: { Authorization: 'Bearer ' + key } });
  if (!r.ok) throw new Error('Qwen3-ASR task: ' + (await r.text()).slice(0, 300));
  const j = await r.json(); const st = j?.output?.task_status;
  if (st === 'PENDING' || st === 'RUNNING') return { done: false };
  if (st !== 'SUCCEEDED') throw new Error('Qwen3-ASR task ' + st + ': ' + (j?.output?.message || ''));
  const url = j?.output?.result?.transcription_url; if (!url) throw new Error('Qwen3-ASR task: no transcription_url');
  const t = await fetch(url).then((x) => x.json());
  const text = (t?.transcripts || []).map((c) => c.text || '').join('\n');
  return { done: true, transcript: String(text).trim() };
}

// ---- tidy into a story (both providers speak the OpenAI chat format) --------
async function tidy({ url, key, model, transcript, question, profile }) {
  const user = `讲述者：${profile.name || ''}，${profile.birth ? profile.birth + ' 年生' : ''}，老家 ${profile.hometown || ''}，住过 ${(profile.places || []).join('、')}，方言 ${(profile.dialects || []).join('、') || '无'}。
问题：${question}
转写稿：
${transcript}`;
  const r = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, temperature: 0.1, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }] }) });
  if (!r.ok) throw new Error('tidy (' + model + '): ' + (await r.text()).slice(0, 300));
  const content = (await r.json()).choices?.[0]?.message?.content || '{}';
  try { return JSON.parse(content); } catch { return JSON.parse(content.replace(/^```json\s*|```$/g, '')); }
}

export default async function handler(req, res) {
  const dash = process.env.DASHSCOPE_API_KEY, oai = process.env.OPENAI_API_KEY;
  if (!dash && !oai) return res.status(500).json({ error: 'No AI key yet. In Vercel → Settings → Environment Variables add DASHSCOPE_API_KEY (Alibaba Model Studio) or OPENAI_API_KEY, then Redeploy.' });
  try {
    let transcript, provider, question, profile, lang;
    if (req.method === 'GET') {
      // Polling a long transcription. The browser sends back the story context it sent at submit time.
      const q = req.query || {};
      if (!q.task) return res.status(400).json({ error: 'no task' });
      const st = await pollFiletrans({ key: dash, taskId: String(q.task) });
      if (!st.done) return res.status(202).json({ taskId: q.task, status: 'running' });
      transcript = st.transcript; provider = 'qwen3-asr-flash-filetrans';
      question = String(q.question || ''); lang = String(q.lang || 'zh');
      try { profile = JSON.parse(String(q.profile || '{}')); } catch { profile = {}; }
    } else if (req.method === 'POST') {
      const b = req.body || {}; question = b.question || ''; profile = b.profile || {}; lang = b.lang || 'zh';
      const { audio, audioUrl, mime = 'audio/webm', durationSec = 0 } = b;
      if (!audio && !audioUrl) return res.status(400).json({ error: 'no audio' });
      const hint = asrContext({ question, profile, lang });
      if (dash && audioUrl && Number(durationSec) > LONG_SEC) {
        const taskId = await submitFiletrans({ key: dash, audioUrl, lang, hint });
        return res.status(202).json({ taskId, status: 'submitted' });
      }
      if (dash) {
        try { transcript = await transcribeDashscope({ key: dash, audio, audioUrl, mime, hint, lang }); provider = 'qwen3-asr-flash'; }
        catch (e) { if (!oai || !audio) throw e; transcript = await transcribeOpenai({ key: oai, audio, mime, hint, lang }); provider = 'whisper-1 (fallback: ' + e.message.slice(0, 80) + ')'; }
      } else {
        if (!audio) return res.status(400).json({ error: 'OpenAI fallback needs inline audio' });
        transcript = await transcribeOpenai({ key: oai, audio, mime, hint, lang }); provider = 'whisper-1';
      }
    } else return res.status(405).json({ error: 'GET or POST' });

    if (!transcript) return res.status(422).json({ error: 'empty transcript — nothing was heard in the recording' });

    const out = dash
      ? await tidy({ url: DASH + '/compatible-mode/v1/chat/completions', key: dash, model: 'qwen-plus', transcript, question, profile })
      : await tidy({ url: 'https://api.openai.com/v1/chat/completions', key: oai, model: 'gpt-4o-mini', transcript, question, profile });

    let paragraphs = Array.isArray(out.paragraphs) && out.paragraphs.length ? out.paragraphs.map(String) : [transcript];
    // Guard against invention: the tidied text may only remove filler, never add. If it grew well beyond what was said, keep the transcript itself.
    const said = transcript.replace(/\s/g, '').length, wrote = paragraphs.join('').replace(/[\[\]\s]/g, '').length;
    let guarded = false;
    if (wrote > said * 1.3 + 30) { paragraphs = [transcript]; out.terms = (out.terms || []).filter((t) => t && t.word && transcript.includes(String(t.word))); guarded = true; }
    const terms = (out.terms || []).filter((t) => t && t.word).map((t, i) => ({ id: 't-' + Date.now() + '-' + i, word: t.word, kind: t.kind || '注释', note: t.note || '', status: 'pending' }));
    return res.status(200).json({
      title: out.title || question.slice(0, 12), text: { first: paragraphs, raw: transcript.split(/(?<=[。！？.!?])\s*/).filter(Boolean) },
      terms, topics: out.topics || [], people: out.people || [], era: out.era || '', place: out.place || (profile.hometown || '').split(' ').pop(),
      transcript, provider: provider + ' + ' + (dash ? 'qwen-plus' : 'gpt-4o-mini') + (guarded ? ' (kept transcript as-is)' : ''),
    });
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
}
