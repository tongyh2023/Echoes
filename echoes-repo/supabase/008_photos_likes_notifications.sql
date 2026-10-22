-- Echoes · 余音 — migration 008 · community photos, likes only, notifications
-- Run once in Supabase → SQL Editor. Safe to run again.
--
-- 1. Photos on published stories. Story photos live in the private "audio" bucket under
--    <family>/media/<story>/<file>. Family members can already read them. This adds one rule:
--    anyone may read a photo whose story has been published to the community. Recordings
--    (<family>/<story>.webm) are NOT covered — audio stays family-only.
drop policy if exists "published media read" on storage.objects;
create policy "published media read" on storage.objects for select
  using (
    bucket_id = 'audio'
    and (storage.foldername(name))[2] = 'media'
    and exists (select 1 from public.stories s
                where s.id::text = (storage.foldername(name))[3] and s.published = true)
  );

-- 2. community_feed() now also returns the story's first photo (a storage path).
--    The return type changes, so the old function is dropped first.
drop function if exists public.community_feed();
create function public.community_feed()
returns table (
  id uuid, family_id uuid, title text, question text, text jsonb, terms jsonb,
  topics text[], people text[], era text, place text, lang text, created_at timestamptz,
  author text, author_sub text, author_avatar text, family_name text,
  likes int, liked boolean, photo text
)
language sql stable security definer set search_path = public as $$
  select s.id, s.family_id, s.title, s.question, s.text,
         (select coalesce(jsonb_agg(t), '[]'::jsonb) from jsonb_array_elements(s.terms) t where t->>'status' = 'ok') as terms,
         s.topics, s.people, s.era, s.place, s.lang, s.created_at,
         coalesce(st.name, f.name) as author,
         concat_ws(' · ', nullif(st.home, ''), nullif(st.profile->>'birth', '')) as author_sub,
         st.avatar_url as author_avatar,
         f.name as family_name,
         (select count(*)::int from public.community_activity a where a.story_id = s.id and a.kind = 'like') as likes,
         exists (select 1 from public.community_activity a where a.story_id = s.id and a.kind = 'like' and a.user_id = auth.uid()) as liked,
         (select m->>'path' from jsonb_array_elements(coalesce(s.extras->'media', '[]'::jsonb)) m
           where m->>'kind' = 'photo' and m->>'path' is not null limit 1) as photo
  from public.stories s
  left join public.storytellers st on st.id = s.storyteller_id
  left join public.families f on f.id = s.family_id
  where s.published = true
  order by s.created_at desc
  limit 200;
$$;
grant execute on function public.community_feed() to anon, authenticated;

-- 3. Notifications. "Someone liked our story" = a community like on any of my family's
--    stories, or a family member's reaction under one of them — never my own actions.
--    notif_seen_at on my profile marks what I have already looked at.
alter table public.profiles add column if not exists notif_seen_at timestamptz default now();

create or replace function public.my_notifications()
returns table (kind text, story_id uuid, story_title text, who text, emoji text, created_at timestamptz, unread boolean)
language sql stable security definer set search_path = public as $$
  with mine as (select s.id, s.title from public.stories s where public.is_family_member(s.family_id)),
       seen as (select coalesce((select notif_seen_at from public.profiles where id = auth.uid()), 'epoch'::timestamptz) as t)
  select * from (
    select 'like'::text, a.story_id, m.title, coalesce(p.name, '读者'), null::text, a.created_at, a.created_at > (select t from seen)
      from public.community_activity a join mine m on m.id = a.story_id left join public.profiles p on p.id = a.user_id
     where a.kind = 'like' and a.user_id <> auth.uid()
    union all
    select 'reaction'::text, r.story_id, m.title, coalesce(p.name, '家人'), r.emoji, r.created_at, r.created_at > (select t from seen)
      from public.story_reactions r join mine m on m.id = r.story_id left join public.profiles p on p.id = r.user_id
     where r.user_id <> auth.uid()
  ) x
  order by 6 desc
  limit 50;
$$;
grant execute on function public.my_notifications() to authenticated;
