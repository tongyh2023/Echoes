// Vercel serverless function: audio → transcript → tidied story with notes.
// Provider is chosen by which key is set in Vercel → Settings → Environment Variables:
//   DASHSCOPE_API_KEY  → Alibaba Model Studio (international): Qwen3-ASR-Flash (dialect-aware) + qwen-plus   ← preferred
//   OPENAI_API_KEY     → OpenAI: whisper-1 + gpt-4o-mini                                                     ← fallback
// Keys live only here; the browser never sees them. The front end always posts the same JSON regardless of provider.
// Request:  POST { audio: <base64>, mime, question, profile: { name, hometown, birth, places, dialects }, lang: 'zh'|'en' }
// Response: { title, text: { first: [...], raw: [...] }, terms: [{ id, word, kind, note, status:'pending' }], topics, people, era, place, transcript, provider }

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

const DASH = 'https://dashscope-intl.aliyuncs.com';
const SYSTEM = `你是一位帮助家庭整理长辈口述历史的编辑。你会收到一段长辈回答某个问题的语音转写稿（可能有口头禅、重复、方言词）。
请做四件事，并只输出 JSON：
1. "title"：8–14 个字的故事标题，像书里的小节名，不要用"关于""我的"开头。
2. "paragraphs"：把转写整理成 2–5 段通顺的第一人称叙述。保留讲述者的说话方式和用词，不要文艺加工，不要补充没说过的事实。把你认为"不懂这个方言/年代的读者可能看不懂"的词在正文里用方括号标出来，例如 "要凭[粮票]买"。每个词只标第一次出现。
3. "terms"：对每个方括号里的词给出 {"word","kind","note"}。kind 是 方言 / 历史 / 物件 / 食物 / 地名 / 习俗 之一；note 是一句话解释，20 字以内。不确定就写你最可能的解释，家人会确认。
4. "topics"（1–3 个，如 童年、饮食、家人）、"people"（文中提到的称谓，如 母亲、外婆）、"era"（如 1940s，依据讲述者出生年和内容推断）、"place"（故事发生地，一个词）。
如果转写是英文，所有输出也用英文；kind 用 dialect / history / object / food / place / custom。`;

const fmtOf = (mime) => mime.includes('mp4') || mime.includes('m4a') ? 'm4a' : mime.includes('mpeg') || mime.includes('mp3') ? 'mp3' : mime.includes('wav') ? 'wav' : mime.includes('ogg') ? 'ogg' : 'webm';

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
    body: JSON.stringify({ model, temperature: 0.3, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }] }) });
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
    const hint = [question, profile.hometown, ...(profile.dialects || [])].filter(Boolean).join('，');

    let transcript, provider;
    if (dash) {
      try { transcript = await transcribeDashscope({ key: dash, audio, mime, hint, lang }); provider = 'qwen3-asr-flash'; }
      catch (e) { if (!oai) throw e; transcript = await transcribeOpenai({ key: oai, audio, mime, hint, lang }); provider = 'whisper-1 (fallback: ' + e.message.slice(0, 80) + ')'; }
    } else { transcript = await transcribeOpenai({ key: oai, audio, mime, hint, lang }); provider = 'whisper-1'; }
    if (!transcript) return res.status(422).json({ error: 'empty transcript — nothing was heard in the recording' });

    const out = dash
      ? await tidy({ url: DASH + '/compatible-mode/v1/chat/completions', key: dash, model: 'qwen-plus', transcript, question, profile })
      : await tidy({ url: 'https://api.openai.com/v1/chat/completions', key: oai, model: 'gpt-4o-mini', transcript, question, profile });

    const paragraphs = Array.isArray(out.paragraphs) && out.paragraphs.length ? out.paragraphs : [transcript];
    const terms = (out.terms || []).filter((t) => t && t.word).map((t, i) => ({ id: 't-' + Date.now() + '-' + i, word: t.word, kind: t.kind || '注释', note: t.note || '', status: 'pending' }));
    return res.status(200).json({
      title: out.title || question.slice(0, 12), text: { first: paragraphs, raw: transcript.split(/(?<=[。！？.!?])\s*/).filter(Boolean) },
      terms, topics: out.topics || [], people: out.people || [], era: out.era || '', place: out.place || (profile.hometown || '').split(' ').pop(),
      transcript, provider: provider + ' + ' + (dash ? 'qwen-plus' : 'gpt-4o-mini'),
    });
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
}
