-- Echoes · 余音 — clean slate before launch
-- Run in Supabase → SQL Editor in THREE steps (select a step, then Run). Nothing is deleted by step 1.
--
-- What it does:
--   • deletes EVERY family and everything in it (storytellers, stories, invites, questions, reactions,
--     likes, memberships, billing rows) — except the sample family from migration 012;
--   • deletes CC's two test accounts (fengxycz@gmail.com and the 534809922@… account).
-- Helen's and her mother's ACCOUNTS stay (they can sign in and start fresh); their test families and stories go.
-- Want to keep a story? Export it first: Settings → Export as a PDF book.

-- ── STEP 1 · Look first ─────────────────────────────────────────────
select f.name as family,
       f.id   as family_id,
       (select string_agg(u.email, ', ') from public.family_members m join auth.users u on u.id = m.user_id where m.family_id = f.id) as members,
       (select count(*) from public.stories s where s.family_id = f.id) as stories,
       (f.id <> '0e0e0e0e-0000-4000-8000-000000000001') as will_delete
from public.families f
order by will_delete desc, f.created_at;

select email, (email = 'fengxycz@gmail.com' or email like '534809922@%') as account_will_be_deleted
from auth.users order by account_will_be_deleted desc, created_at;

-- ── STEP 2 · Delete (select from "begin" to "commit", then Run) ──────
begin;
delete from public.families where id <> '0e0e0e0e-0000-4000-8000-000000000001';
delete from public.community_activity where story_id not in (select id from public.stories);
delete from auth.users where email = 'fengxycz@gmail.com' or email like '534809922@%';
commit;

-- ── STEP 3 · Check ─────────────────────────────────────────────────
select (select count(*) from auth.users)          as accounts_left,
       (select count(*) from public.families)     as families_left,   -- 1 = the sample family
       (select count(*) from public.stories)      as stories_left,    -- 3 = the sample stories
       (select count(*) from public.family_billing) as billing_rows_left;

-- Recordings and photos of deleted families stay in Storage (Supabase does not delete files from SQL).
-- Storage → audio → delete the folders (named with the family_id values from step 1). Leaving them costs only space.
