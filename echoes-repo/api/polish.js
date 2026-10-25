// POST /api/polish { paragraphs: [...], lang: 'zh' | 'en' }   (Authorization: Bearer <supabase access token>)
//   → { paragraphs: [...], changed: true|false }
// "Polish with AI" on the review page: makes the tidied story read more smoothly WITHOUT adding anything.
// Signed-in users only, so the endpoint can't be used as a free AI proxy.
import { caller } from './_billing.js';
import { chatJson } from './_ai.js';

const SYSTEM = `你是一位编辑，帮家人润色长辈口述故事的文字。
规则（必须遵守）：
1. 只能让文字更通顺：调整标点、删掉重复和口头禅、把断开的句子接顺。
2. 绝对不能添加任何原文没有的事实、细节、感受、评论或总结句。不要在段落结尾加感慨。
3. 保留讲述者的第一人称和说话方式、方言词和老词。
4. 方括号标记必须原样保留，例如 [粮票] 仍写成 [粮票]，位置可以随句子调整，但不能删除或改字。
5. 段落数保持不变，一一对应。
6. 原文是英文就用英文输出。
只输出 JSON：{"paragraphs": ["…", "…"]}`;

const marks = (s) => (String(s).match(/\[[^\]]+\]/g) || []);
const len = (arr) => arr.join('').replace(/[\[\]\s]/g, '').length;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST' });
  try {
    const user = await caller(req);
    if (!user) return res.status(401).json({ error: 'sign in first' });
    const { paragraphs, lang = 'zh' } = req.body || {};
    if (!Array.isArray(paragraphs) || !paragraphs.length) return res.status(400).json({ error: 'no text' });
    const input = paragraphs.map(String).slice(0, 20);
    if (len(input) > 8000) return res.status(413).json({ error: 'story too long to polish at once' });
    const out = await chatJson(SYSTEM, { lang, paragraphs: input });
    const result = Array.isArray(out.paragraphs) ? out.paragraphs.map(String) : [];
    // Guards: same number of paragraphs, no growth (nothing invented), every [marked] word still there.
    const ok = result.length === input.length
      && len(result) <= len(input) * 1.1 + 10
      && input.every((p, i) => marks(p).every((m) => result[i].includes(m)));
    if (!ok) return res.status(200).json({ paragraphs: input, changed: false });
    return res.status(200).json({ paragraphs: result, changed: result.join('\n') !== input.join('\n') });
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
}
