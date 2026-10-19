-- Echoes · 余音 — migration 002
-- Run once in Supabase → SQL Editor. Adds a JSON column so a storyteller's whole
-- profile (relation, birth year, places lived, languages, dialects…) is stored as
-- one object, while name / home / dialect stay as readable columns.
alter table public.storytellers
  add column if not exists profile jsonb not null default '{}'::jsonb;
