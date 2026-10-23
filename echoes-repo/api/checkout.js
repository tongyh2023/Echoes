// GET  /api/checkout            → { mode: 'stripe' | 'waitlist', price?: { amount, currency, interval } }
// POST /api/checkout { familyId } (Authorization: Bearer <supabase access token>)
//                               → { url } of a Stripe Checkout page for the Family plan
// The card is typed on Stripe's page; this site never sees it.
import { env, stripe, caller, origin } from './_billing.js';

export default async function handler(req, res) {
  const { mode, priceId } = env();
  try {
    if (req.method === 'GET') {
      if (mode !== 'stripe') return res.status(200).json({ mode });
      const p = await stripe('prices/' + priceId);
      return res.status(200).json({ mode, price: { amount: p.unit_amount, currency: p.currency, interval: p.recurring?.interval || null } });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST' });
    if (mode !== 'stripe') return res.status(409).json({ error: 'payments are not switched on yet', mode });
    const { familyId } = req.body || {};
    const user = await caller(req, familyId);
    if (!user) return res.status(401).json({ error: 'sign in as a member of this family first' });
    const site = origin(req);
    const session = await stripe('checkout/sessions', { method: 'POST', body: {
      mode: 'subscription',
      line_items: { 0: { price: priceId, quantity: 1 } },
      success_url: site + '/settings?upgraded=1',
      cancel_url: site + '/upgrade?canceled=1',
      client_reference_id: familyId,
      customer_email: user.email,
      allow_promotion_codes: 'true',
      metadata: { family_id: familyId, user_id: user.id },
      subscription_data: { metadata: { family_id: familyId, user_id: user.id } },
    } });
    return res.status(200).json({ url: session.url });
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
}
