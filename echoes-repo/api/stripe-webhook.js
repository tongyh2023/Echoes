// POST /api/stripe-webhook — Stripe calls this after something happens to a payment.
// We check the signature (proof the message really comes from Stripe), then record the family's plan.
// Events to enable in Stripe → Developers → Webhooks: checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted.
import crypto from 'node:crypto';
import { env, saveBilling, billingBySubscription } from './_billing.js';

export const config = { api: { bodyParser: false } };   // the signature is over the exact raw bytes

const rawBody = (req) => new Promise((ok, no) => { const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => ok(Buffer.concat(chunks))); req.on('error', no); });

export function verify(raw, header, secret, toleranceSec = 300) {
  const parts = Object.fromEntries(String(header || '').split(',').map((kv) => kv.split('=')).filter((x) => x.length === 2).map(([k, v]) => [k.trim(), v]));
  const sigs = String(header || '').split(',').filter((kv) => kv.startsWith('v1=')).map((kv) => kv.slice(3));
  if (!parts.t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > toleranceSec) return false;
  const expected = crypto.createHmac('sha256', secret).update(parts.t + '.' + raw.toString('utf8')).digest('hex');
  return sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

const PAID = new Set(['active', 'trialing', 'past_due']);   // past_due: Stripe is still retrying the card — keep access meanwhile

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { webhookSecret } = env();
  const raw = await rawBody(req);
  if (!webhookSecret || !verify(raw, req.headers['stripe-signature'], webhookSecret)) return res.status(400).json({ error: 'bad signature' });
  const event = JSON.parse(raw.toString('utf8'));
  const o = event.data?.object || {};
  try {
    if (event.type === 'checkout.session.completed' && o.mode === 'subscription') {
      const familyId = o.metadata?.family_id || o.client_reference_id;
      if (familyId) await saveBilling({ family_id: familyId, plan: 'family', status: 'active', stripe_customer_id: o.customer, stripe_subscription_id: o.subscription });
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const familyId = o.metadata?.family_id || (await billingBySubscription(o.id))?.family_id;
      const status = event.type === 'customer.subscription.deleted' ? 'canceled' : o.status;
      if (familyId) await saveBilling({ family_id: familyId, plan: PAID.has(status) ? 'family' : 'free', status, stripe_customer_id: o.customer, stripe_subscription_id: o.id,
        current_period_end: o.current_period_end ? new Date(o.current_period_end * 1000).toISOString() : (o.items?.data?.[0]?.current_period_end ? new Date(o.items.data[0].current_period_end * 1000).toISOString() : null) });
    }
    return res.status(200).json({ received: true });
  } catch (e) { console.error('[stripe-webhook]', e); return res.status(500).json({ error: String(e.message || e) }); }
}
