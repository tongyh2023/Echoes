-- Echoes · 余音 — migration 003
-- Run once in Supabase → SQL Editor.
--
-- 1. invite_preview(code): what an invited person may see BEFORE joining —
--    the family name, the first storyteller, and how many stories exist.
--    The invites table itself is readable only by members (RLS), so this
--    function runs as the database owner (security definer) and returns
--    just those three harmless facts, nothing else.
create or replace function public.invite_preview(invite_code text)
returns table (family_name text, storyteller_name text, story_count int)
language sql stable security definer set search_path = public as $$
  select f.name,
         (select s.name from public.storytellers s where s.family_id = f.id order by s.created_at limit 1),
         (select count(*)::int from public.stories st where st.family_id = f.id)
  from public.invites i
  join public.families f on f.id = i.family_id
  where i.code = invite_code and i.used_by is null;
$$;

-- 2. A member may leave a family (or the owner may remove someone).
create policy "members delete" on public.family_members for delete
  using (user_id = auth.uid()
     or exists (select 1 from public.family_members m where m.family_id = family_members.family_id and m.user_id = auth.uid() and m.role = 'owner'));

-- 3. Owners may delete unused invite codes.
create policy "invites delete" on public.invites for delete
  using (public.is_family_member(family_id) and used_by is null);
