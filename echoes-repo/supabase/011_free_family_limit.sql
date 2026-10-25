-- Echoes · 余音 — migration 011 · free plan: you + 1 invited family member
-- Run once in Supabase → SQL Editor. Safe to run again (it shows the usual "destructive operation" warning).
-- A family without the Family plan can have at most 2 members. Families that already have more keep them —
-- only new joins are stopped. Paid families (monthly or lifetime) have no limit.
create or replace function public.join_family(invite_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  select family_id into fid from public.invites where code = invite_code and used_by is null;
  if fid is null then raise exception 'invalid or used invite code'; end if;
  if not exists (select 1 from public.family_members where family_id = fid and user_id = auth.uid())
     and not exists (select 1 from public.family_billing b where b.family_id = fid and b.plan = 'family')
     and (select count(*) from public.family_members where family_id = fid) >= 2 then
    raise exception 'family is full on the free plan';
  end if;
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
