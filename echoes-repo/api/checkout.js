// GET  /api/checkout            → { mode: 'stripe' | 'waitlist', prices?: { monthly, lifetime } }   (amount in cents)
// POST /api/checkout { familyId, plan: 'monthly' | 'lifetime' } (Authorization: Bearer <supabase access token>)
//                               → { url } of a Stripe Checkout page
// Monthly = subscription that renews every month. Lifetime = one payment, never charged again.
// The card is typed on Stripe's page; this site never sees it.
import { env, stripe, caller, origin, billingRow } from './_billing.js';

const priceInfo = (p) => ({ id: p.id, amount: p.unit_amount, currency: p.currency, interval: p.recurring?.interval || null });

export default async function handler(req, res) {
  const { mode, priceId, lifetimePriceId } = env();
  try {
    if (req.method === 'GET') {
      if (mode !== 'stripe') return res.status(200).json({ mode });
      const [m, l] = await Promise.all([stripe('prices/' + priceId), lifetimePriceId ? stripe('prices/' + lifetimePriceId) : null]);
      return res.status(200).json({ mode, prices: { monthly: priceInfo(m), lifetime: l ? priceInfo(l) : null }, price: priceInfo(m) });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST' });
    if (mode !== 'stripe') return res.status(409).json({ error: 'payments are not switched on yet', mode });
    const { familyId, plan = 'monthly' } = req.body || {};
    if (plan === 'lifetime' && !lifetimePriceId) return res.status(409).json({ error: 'lifetime plan is not set up' });
    const user = await caller(req, familyId);
    if (!user) return res.status(401).json({ error: 'sign in as a member of this family first' });
    const current = await billingRow(familyId);
    if (current?.plan === 'family') return res.status(409).json({ error: 'this family already has the Family plan' });
    const site = origin(req);
    const meta = { family_id: familyId, user_id: user.id, plan };
    const common = {
      line_items: { 0: { price: plan === 'lifetime' ? lifetimePriceId : priceId, quantity: 1 } },
      success_url: site + '/settings?upgraded=1', cancel_url: site + '/upgrade?canceled=1',
      client_reference_id: familyId, customer_email: user.email, allow_promotion_codes: 'true', metadata: meta,
    };
    const session = await stripe('checkout/sessions', { method: 'POST', body: plan === 'lifetime'
      ? { ...common, mode: 'payment', customer_creation: 'always', payment_intent_data: { metadata: meta } }
      : { ...common, mode: 'subscription', subscription_data: { metadata: meta } } });
    return res.status(200).json({ url: session.url });
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
}
