-- Echoes · 余音 — migration 009 · billing (Stripe) and the waitlist
-- Run once in Supabase → SQL Editor. Safe to run again.
--
-- family_billing: one row per family that has ever paid. Family members can READ it (so the site
-- knows the plan); nobody can write it from the browser. Only the server writes it, after Stripe
-- confirms a payment (api/stripe-webhook.js, using the secret key). That is what stops anyone from
-- giving themselves the Family plan.
create table if not exists public.family_billing (
  family_id              uuid primary key references public.families(id) on delete cascade,
  plan                   text not null default 'free' check (plan in ('free', 'family')),
  status                 text,              -- Stripe subscription status: active, past_due, canceled…
  stripe_customer_id     text,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  updated_at             timestamptz default now()
);
alter table public.family_billing enable row level security;
drop policy if exists "billing read" on public.family_billing;
create policy "billing read" on public.family_billing for select using (public.is_family_member(family_id));

-- waitlist: while BILLING_MODE = waitlist, the Upgrade button collects emails here instead of payments.
-- Signed-in people may add themselves; nobody can read the list from the browser (read it in Table Editor).
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  user_id    uuid references auth.users(id) on delete set null,
  family_id  uuid references public.families(id) on delete set null,
  created_at timestamptz default now()
);
alter table public.waitlist enable row level security;
drop policy if exists "waitlist join" on public.waitlist;
create policy "waitlist join" on public.waitlist for insert with check (user_id = auth.uid());
