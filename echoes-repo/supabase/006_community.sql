-- Echoes · 余音 — migration 006 · community
-- Run once in Supabase → SQL Editor.
--
-- 1. community_activity — likes and comments on PUBLISHED stories, from anyone signed in.
--    One table for both: kind = 'like' (no text) or 'comment' (text). A person can like a
--    story once (partial unique index) and comment as often as they want.
create table public.community_activity (
  id          uuid primary key default gen_random_uuid(),
  story_id    uuid not null references public.stories(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('like','comment')),
  text        text,
  created_at  timestamptz default now()
);
create index community_activity_story_idx on public.community_activity(story_id, created_at);
create unique index community_activity_one_like on public.community_activity(story_id, user_id) where kind = 'like';

alter table public.community_activity enable row level security;
-- anyone signed in may read activity on a published story
create policy "activity read" on public.community_activity for select
  using (exists (select 1 from public.stories s where s.id = story_id and s.published = true));
-- you may add your own like/comment, only on a published story
create policy "activity insert" on public.community_activity for insert
  with check (user_id = auth.uid() and exists (select 1 from public.stories s where s.id = story_id and s.published = true));
-- you may remove your own
create policy "activity delete" on public.community_activity for delete using (user_id = auth.uid());

-- 2. community_feed() — everything the community page needs, in one call.
--    Storytellers are family-only under RLS, so a reader from another family could not
--    look up the author's name directly. This function runs as the database owner and
--    hands out only what a published story already reveals: title, text, confirmed notes,
--    the storyteller's first name and home, the family name, and like/comment counts.
create or replace function public.community_feed()
returns table (
  id uuid, family_id uuid, title text, question text, text jsonb, terms jsonb,
  topics text[], people text[], era text, place text, lang text, created_at timestamptz,
  author text, author_sub text, author_avatar text, family_name text,
  likes int, comments int, liked boolean
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
         (select count(*)::int from public.community_activity a where a.story_id = s.id and a.kind = 'comment') as comments,
         exists (select 1 from public.community_activity a where a.story_id = s.id and a.kind = 'like' and a.user_id = auth.uid()) as liked
  from public.stories s
  left join public.storytellers st on st.id = s.storyteller_id
  left join public.families f on f.id = s.family_id
  where s.published = true
  order by s.created_at desc
  limit 200;
$$;

-- 3. community_comments(story) — the comments under one published story, with names.
create or replace function public.community_comments(story uuid)
returns table (id uuid, who text, text text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.id, coalesce(p.name, '读者') as who, a.text, a.created_at
  from public.community_activity a
  join public.stories s on s.id = a.story_id and s.published = true
  left join public.profiles p on p.id = a.user_id
  where a.story_id = story and a.kind = 'comment'
  order by a.created_at;
$$;
