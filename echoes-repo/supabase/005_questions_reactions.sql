-- Echoes · 余音 — migration 005
-- Run once in Supabase → SQL Editor.
--
-- Two small family-level tables:
--   family_questions  the family's own questions: written from scratch, an edited
--                     library question, or a follow-up asked under a story.
--                     The first one in the list becomes "the next question to record".
--   story_reactions   the emoji a family member left under a story (one row per
--                     person × emoji × story, so toggling is an insert or a delete).

create table public.family_questions (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  text        text not null,
  source      text not null default 'own' check (source in ('own','edited','followup')),
  from_story  uuid references public.stories(id) on delete set null,  -- for follow-ups
  from_q      text,                                                     -- library question id, for edits
  from_title  text,
  created_by  uuid references public.profiles(id),   -- profiles.id = auth user id; lets the app read the asker's name
  created_at  timestamptz default now()
);
create index family_questions_family_idx on public.family_questions(family_id, created_at desc);

create table public.story_reactions (
  story_id    uuid not null references public.stories(id) on delete cascade,
  family_id   uuid not null references public.families(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  emoji       text not null,
  created_at  timestamptz default now(),
  primary key (story_id, user_id, emoji)
);

-- family_members was created pointing at auth.users; add a second link to profiles so
-- the member list can read each person's display name in one query.
alter table public.family_members
  add constraint family_members_profile_fk foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.family_questions enable row level security;
alter table public.story_reactions  enable row level security;

create policy "questions read"   on public.family_questions for select using (public.is_family_member(family_id));
create policy "questions insert" on public.family_questions for insert with check (public.is_family_member(family_id) and created_by = auth.uid());
create policy "questions update" on public.family_questions for update using (public.is_family_member(family_id));
create policy "questions delete" on public.family_questions for delete using (public.is_family_member(family_id));

create policy "reactions read"   on public.story_reactions for select using (public.is_family_member(family_id));
create policy "reactions insert" on public.story_reactions for insert with check (public.is_family_member(family_id) and user_id = auth.uid());
create policy "reactions delete" on public.story_reactions for delete using (user_id = auth.uid());
