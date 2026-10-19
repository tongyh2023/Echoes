-- Echoes · 余音 — migration 004
-- Run once in Supabase → SQL Editor.
-- Two small additions to the stories table:
--   question_id  which library question (or custom question) the story answers —
--                lets the question bank mark questions as "already answered"
--   extras       everything that doesn't deserve its own column yet
--                (photos/media list, which AI provider tidied it, draft flags…)
alter table public.stories
  add column if not exists question_id text,
  add column if not exists extras jsonb not null default '{}'::jsonb;
