// Shared text-model helper for /api/polish and /api/translate. Files starting with "_" are not endpoints.
// Same provider choice as /api/tidy: Alibaba Model Studio (qwen-plus) when DASHSCOPE_API_KEY is set, else OpenAI.
const DASH = (process.env.DASHSCOPE_BASE_URL || 'https://ws-362kz2csbr5yghzo.ap-southeast-1.maas.aliyuncs.com').replace(/\/$/, '');

export function provider() {
  if (process.env.DASHSCOPE_API_KEY) return { url: DASH + '/compatible-mode/v1/chat/completions', key: process.env.DASHSCOPE_API_KEY, model: 'qwen-plus' };
  if (process.env.OPENAI_API_KEY) return { url: 'https://api.openai.com/v1/chat/completions', key: process.env.OPENAI_API_KEY, model: 'gpt-4o-mini' };
  return null;
}

// One JSON-in, JSON-out chat call.
export async function chatJson(system, user) {
  const p = provider(); if (!p) throw new Error('No AI key configured');
  const r = await fetch(p.url, { method: 'POST', headers: { Authorization: 'Bearer ' + p.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: p.model, temperature: 0.1, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(user) }] }) });
  if (!r.ok) throw new Error(p.model + ': ' + (await r.text()).slice(0, 300));
  const content = (await r.json()).choices?.[0]?.message?.content || '{}';
  try { return JSON.parse(content); } catch { return JSON.parse(content.replace(/^```json\s*|```$/g, '')); }
}

// Supabase REST with the server's secret key (bypasses RLS — callers must check permissions themselves).
export function sb() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = { apikey: secret, 'Content-Type': 'application/json' };
  if (/^eyJ/.test(secret || '')) headers.Authorization = 'Bearer ' + secret;   // legacy JWT keys also go in Authorization
  return { url, secret, headers };
}
