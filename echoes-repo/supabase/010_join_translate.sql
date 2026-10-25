-- Echoes · 余音 — migration 010 · joining a family cleanly + community translations
-- Run once in Supabase → SQL Editor. Safe to run again. (The "destructive operation" warning comes from
-- CREATE OR REPLACE / DELETE inside the function body — it is expected.)

-- 1. Joining with an invite code.
--    Problem: someone who had already started their own (empty) family and then joined a relative's family
--    ended up in two families, and the app could open the wrong one. Now joining also removes any family
--    where the person is the only member AND nothing has been recorded yet. A family with stories is never touched.
create or replace function public.join_family(invite_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  select family_id into fid from public.invites where code = invite_code and used_by is null;
  if fid is null then raise exception 'invalid or used invite code'; end if;
  delete from public.families f
   where f.id <> fid
     and exists (select 1 from public.family_members m where m.family_id = f.id and m.user_id = auth.uid())
     and not exists (select 1 from public.family_members m where m.family_id = f.id and m.user_id <> auth.uid())
     and not exists (select 1 from public.stories s where s.family_id = f.id);
  insert into public.family_members (family_id, user_id) values (fid, auth.uid())
    on conflict do nothing;
  update public.invites set used_by = auth.uid() where code = invite_code;
  return fid;
end;
$$;

-- 2. Translations of published stories (Chinese ↔ English), written only by the server (/api/translate)
--    and cached so each story is translated once per language: { "en": { title, paragraphs, terms, src }, "zh": … }
alter table public.stories add column if not exists translations jsonb not null default '{}'::jsonb;
