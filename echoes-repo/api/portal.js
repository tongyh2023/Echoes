// POST /api/portal { familyId } (Authorization: Bearer <token>) → { url } of Stripe's customer portal,
// where the family can change the card, download receipts or cancel. Needs the portal switched on once in
// Stripe → Settings → Billing → Customer portal.
import { env, stripe, caller, origin, billingRow } from './_billing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    if (env().mode !== 'stripe') return res.status(409).json({ error: 'payments are not switched on yet' });
    const { familyId } = req.body || {};
    if (!(await caller(req, familyId))) return res.status(401).json({ error: 'sign in as a member of this family first' });
    const row = await billingRow(familyId);
    if (!row?.stripe_customer_id) return res.status(404).json({ error: 'no subscription for this family' });
    const s = await stripe('billing_portal/sessions', { method: 'POST', body: { customer: row.stripe_customer_id, return_url: origin(req) + '/settings' } });
    return res.status(200).json({ url: s.url });
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
}
