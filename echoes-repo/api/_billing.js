// Shared helpers for the payment functions. Files starting with "_" are not deployed as endpoints.
// Environment variables (Vercel → Settings → Environment Variables):
//   BILLING_MODE            'stripe' to take payments, anything else (or unset) = waitlist
//   STRIPE_SECRET_KEY       sk_test_… / sk_live_…      (secret)
//   STRIPE_PRICE_ID         price_…                     (Family plan, monthly — recurring US$2.99/month)
//   STRIPE_PRICE_ID_LIFETIME price_…                    (Family plan, lifetime — one-time US$9.99; optional)
//   STRIPE_WEBHOOK_SECRET   whsec_…                     (secret)
//   SUPABASE_SECRET_KEY     sb_secret_… (or the legacy service_role key) — only the webhook uses it (secret)
//   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY          already set for the site
export const env = () => ({
  mode: process.env.BILLING_MODE === 'stripe' && process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID ? 'stripe' : 'waitlist',
  stripeKey: process.env.STRIPE_SECRET_KEY, priceId: process.env.STRIPE_PRICE_ID, lifetimePriceId: process.env.STRIPE_PRICE_ID_LIFETIME || null, webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  sbUrl: (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, ''),
  sbAnon: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  sbSecret: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
});

// Stripe's API takes form-encoded bodies with bracket keys: { a: { b: 1 } } → a[b]=1
const flatten = (obj, prefix = '', out = []) => {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') flatten(v, key, out); else out.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(v)));
  }
  return out;
};
export async function stripe(path, { method = 'GET', body } = {}) {
  const { stripeKey } = env();
  const r = await fetch('https://api.stripe.com/v1/' + path, {
    method, headers: { Authorization: 'Bearer ' + stripeKey, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: body ? flatten(body).join('&') : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Stripe: ' + (j?.error?.message || r.status));
  return j;
}

// Who is calling? The browser sends its Supabase access token; we ask Supabase who that is and
// whether they belong to the family they want to pay for (RLS answers with the caller's own rights).
export async function caller(req, familyId) {
  const { sbUrl, sbAnon } = env();
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const u = await fetch(sbUrl + '/auth/v1/user', { headers: { apikey: sbAnon, Authorization: 'Bearer ' + token } });
  if (!u.ok) return null;
  const user = await u.json();
  if (familyId) {
    const m = await fetch(`${sbUrl}/rest/v1/family_members?select=role&family_id=eq.${encodeURIComponent(familyId)}&user_id=eq.${user.id}`, { headers: { apikey: sbAnon, Authorization: 'Bearer ' + token } });
    const rows = m.ok ? await m.json() : [];
    if (!rows.length) return null;
  }
  return user;
}

// Server-side write to family_billing with the secret key (bypasses RLS on purpose; only the webhook calls this).
export async function saveBilling(row) {
  const { sbUrl, sbSecret } = env();
  const headers = { apikey: sbSecret, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' };
  if (/^eyJ/.test(sbSecret || '')) headers.Authorization = 'Bearer ' + sbSecret;   // legacy JWT keys also go in Authorization
  const r = await fetch(sbUrl + '/rest/v1/family_billing?on_conflict=family_id', { method: 'POST', headers, body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }) });
  if (!r.ok) throw new Error('Supabase: ' + (await r.text()).slice(0, 200));
}
export async function billingBySubscription(subId) {
  const { sbUrl, sbSecret } = env();
  const headers = { apikey: sbSecret }; if (/^eyJ/.test(sbSecret || '')) headers.Authorization = 'Bearer ' + sbSecret;
  const r = await fetch(`${sbUrl}/rest/v1/family_billing?select=family_id,stripe_customer_id&stripe_subscription_id=eq.${encodeURIComponent(subId)}`, { headers });
  return r.ok ? (await r.json())[0] || null : null;
}
export async function billingRow(familyId) {
  const { sbUrl, sbSecret } = env();
  const headers = { apikey: sbSecret }; if (/^eyJ/.test(sbSecret || '')) headers.Authorization = 'Bearer ' + sbSecret;
  const r = await fetch(`${sbUrl}/rest/v1/family_billing?select=*&family_id=eq.${encodeURIComponent(familyId)}`, { headers });
  return r.ok ? (await r.json())[0] || null : null;
}
export const origin = (req) => (req.headers['x-forwarded-proto'] ? req.headers['x-forwarded-proto'] + '://' : 'https://') + (req.headers['x-forwarded-host'] || req.headers.host);
