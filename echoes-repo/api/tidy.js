// Vercel serverless function: audio → transcript → tidied story with notes.
// Provider is chosen by which key is set in Vercel → Settings → Environment Variables:
//   DASHSCOPE_API_KEY  → Alibaba Model Studio (international): Qwen3-ASR-Flash (dialect-aware) + qwen-plus   ← preferred
//   OPENAI_API_KEY     → OpenAI: whisper-1 + gpt-4o-mini                                                     ← fallback
// Keys live only here; the browser never sees them. The front end always posts the same JSON regardless of provider.
// Request:  POST { audio: <base64>, mime, question, profile: { name, hometown, birth, places, dialects }, lang: 'zh'|'en' }
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
async function transcribeDashscope({ key, audio, mime, hint, lang }) {
  // Qwen3-ASR-Flash: audio goes inside a message as a data URI; the system text biases spelling of names, places, dialect words.
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const dash = process.env.DASHSCOPE_API_KEY, oai = process.env.OPENAI_API_KEY;
  if (!dash && !oai) return res.status(500).json({ error: 'No AI key yet. In Vercel → Settings → Environment Variables add DASHSCOPE_API_KEY (Alibaba Model Studio) or OPENAI_API_KEY, then Redeploy.' });
  try {
    const { audio, mime = 'audio/webm', question = '', profile = {}, lang = 'zh' } = req.body || {};
    if (!audio) return res.status(400).json({ error: 'no audio' });
    const hint = asrContext({ question, profile, lang });

    let transcript, provider;
    if (dash) {
      try { transcript = await transcribeDashscope({ key: dash, audio, mime, hint, lang }); provider = 'qwen3-asr-flash'; }
      catch (e) { if (!oai) throw e; transcript = await transcribeOpenai({ key: oai, audio, mime, hint, lang }); provider = 'whisper-1 (fallback: ' + e.message.slice(0, 80) + ')'; }
    } else { transcript = await transcribeOpenai({ key: oai, audio, mime, hint, lang }); provider = 'whisper-1'; }
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
