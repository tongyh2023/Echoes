-- Echoes · 余音 — migration 007
-- Run once in Supabase → SQL Editor.
-- Members may delete a storyteller of their family (needed to remove the sample storyteller).
create policy "storytellers delete" on public.storytellers for delete
  using (public.is_family_member(family_id));
