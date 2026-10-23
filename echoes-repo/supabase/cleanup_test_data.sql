-- Echoes · 余音 — remove CC's test accounts before launch
-- Run in Supabase → SQL Editor in TWO steps. Nothing is deleted by step 1.
--
-- Test accounts: fengxycz@gmail.com and the 534809922@… account (both CC's).
-- Helen's own account and family are NOT touched.

-- ── STEP 1 · Look first ─────────────────────────────────────────────
-- Every account, its family and how many stories that family has.
-- Check that the rows marked will_delete = true are only test accounts.
select u.email,
       f.name  as family,
       f.id    as family_id,
       fm.role,
       (select count(*) from public.stories s where s.family_id = f.id) as stories,
       (u.email = 'fengxycz@gmail.com' or u.email like '534809922@%') as will_delete
from auth.users u
left join public.family_members fm on fm.user_id = u.id
left join public.families f on f.id = fm.family_id
order by will_delete desc, u.created_at;

-- ── STEP 2 · Delete (select from here to the end, then Run) ─────────
-- Families created by the test accounts go first; their storytellers, stories, invites,
-- questions, reactions, likes and memberships go with them (cascade). Then the accounts.
begin;

create temporary table _test_users on commit drop as
  select id from auth.users where email = 'fengxycz@gmail.com' or email like '534809922@%';

delete from public.families where created_by in (select id from _test_users);

-- leftovers in families that are NOT test families (normally none)
delete from public.community_activity where user_id in (select id from _test_users);
delete from public.story_reactions   where user_id in (select id from _test_users);
delete from public.family_questions  where created_by in (select id from _test_users);
delete from public.stories           where author_id in (select id from _test_users);
delete from public.invites           where created_by in (select id from _test_users);
update public.invites set used_by = null where used_by in (select id from _test_users);

-- the accounts themselves (profiles and memberships cascade)
delete from auth.users where id in (select id from _test_users);

commit;

-- ── STEP 3 · Check ─────────────────────────────────────────────────
select (select count(*) from auth.users) as accounts_left,
       (select count(*) from public.families) as families_left,
       (select count(*) from public.stories) as stories_left;

-- Recordings and photos of the deleted families stay in Storage (Supabase does not allow
-- deleting files from SQL). Storage → audio → delete the folders named with the family_id
-- values from step 1. Leaving them costs nothing but space.
