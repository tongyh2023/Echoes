// POST /api/translate { storyId, to: 'en' | 'zh' }  → { title, paragraphs, terms, cached }
// Published stories: anyone. Unpublished: only members of that family (Authorization: Bearer <supabase token>).
// Translates a story that is PUBLISHED to the community, Chinese ↔ English. Anyone may ask (visitors read the
// community too), but only published stories are translated, and each translation is saved on the story
// (stories.translations, migration 010), so a story costs one AI call per language — later readers get the copy.
// If the family edits the story afterwards, the fingerprint changes and the next reader gets a fresh translation.
import { chatJson, sb } from './_ai.js';
import { caller } from './_billing.js';

const SYSTEM = {
  en: `You translate a family oral-history story from Chinese into natural English.
Rules: translate faithfully — add nothing, explain nothing, keep the storyteller's first-person voice and plain spoken style.
Words wrapped in square brackets are annotated terms: keep a pair of square brackets around the translated term, e.g. "[粮票]" → "[ration coupons]".
For each item in "terms", give the translated word exactly as it appears inside the brackets in your paragraphs, plus a translated note.
Keep the same number of paragraphs. Output JSON only: {"title": "...", "paragraphs": ["..."], "terms": [{"orig": "...", "word": "...", "kind": "...", "note": "..."}]}`,
  zh: `你把一段家族口述历史从英文翻译成自然的中文。
规则：忠实翻译，不添加、不解释，保留讲述者第一人称和口语的说话方式。
方括号里的词是带注释的词：翻译后的词也用方括号括起来，例如 "[ration coupons]" → "[粮票]"。
对 "terms" 里的每一项，给出你在正文方括号里使用的译词，以及翻译后的注释。
段落数保持不变。只输出 JSON：{"title": "...", "paragraphs": ["..."], "terms": [{"orig": "...", "word": "...", "kind": "...", "note": "..."}]}`,
};

// A cheap fingerprint of what was translated, so edits invalidate the cached copy.
const fingerprint = (s) => { const str = JSON.stringify([s.title, s.text?.first, (s.terms || []).map((t) => [t.word, t.note])]); let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return String(h); };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST' });
  try {
    const { storyId, to } = req.body || {};
    if (!/^[0-9a-f-]{36}$/i.test(String(storyId || '')) || !['en', 'zh'].includes(to)) return res.status(400).json({ error: 'storyId and to (en|zh) required' });
    const { url, secret, headers } = sb();
    if (!url || !secret) return res.status(500).json({ error: 'SUPABASE_SECRET_KEY is not set in Vercel' });
    const r = await fetch(`${url}/rest/v1/stories?select=id,family_id,title,text,terms,published,translations&id=eq.${storyId}`, { headers });
    const story = r.ok ? (await r.json())[0] : null;
    if (!story) return res.status(404).json({ error: 'no such story' });
    const family = !story.published && (await caller(req, story.family_id));
    if (!story.published && !family) return res.status(404).json({ error: 'not a published story' });

    // Readers outside the family only ever see confirmed notes; the family's own copy includes all of them.
    const terms = (story.terms || []).filter((t) => t && (story.published ? t.status === 'ok' : true));
    const src = fingerprint({ ...story, terms });
    const cached = story.translations?.[to];
    if (cached && cached.src === src) return res.status(200).json({ ...cached, cached: true });

    const out = await chatJson(SYSTEM[to], { title: story.title, paragraphs: story.text?.first || [], terms: terms.map((t) => ({ word: t.word, kind: t.kind, note: t.note })) });
    const result = {
      title: String(out.title || story.title || ''),
      paragraphs: Array.isArray(out.paragraphs) ? out.paragraphs.map(String) : [],
      terms: (Array.isArray(out.terms) ? out.terms : []).filter((t) => t && t.word).map((t, i) => ({ id: 'tr-' + i, word: String(t.word), orig: String(t.orig || ''), kind: String(t.kind || ''), note: String(t.note || ''), status: 'ok' })),
      src, at: new Date().toISOString(),
    };
    if (!result.paragraphs.length) return res.status(502).json({ error: 'translation came back empty' });
    // Save the copy (merge with other languages). A failed save still returns the translation.
    await fetch(`${url}/rest/v1/stories?id=eq.${storyId}`, { method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify({ translations: { ...(story.translations || {}), [to]: result } }) }).catch(() => {});
    return res.status(200).json({ ...result, cached: false });
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
}
