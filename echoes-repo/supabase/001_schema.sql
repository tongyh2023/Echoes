-- ============================================================
--  Echoes · 余音 — database schema v1
--  Paste the whole file into Supabase → SQL Editor → Run.
--  Safe to run once on a fresh project.
-- ============================================================

-- 0. extensions ------------------------------------------------
create extension if not exists "pgcrypto";

-- 1. profiles: one row per account (mirrors auth.users) ---------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- 2. families: the unit everything belongs to -------------------
create table public.families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- 3. who is in which family ------------------------------------
create table public.family_members (
  family_id   uuid references public.families(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  role        text default 'member' check (role in ('owner','member')),
  joined_at   timestamptz default now(),
  primary key (family_id, user_id)
);

-- 4. storytellers: the elders being recorded (no account needed) -
create table public.storytellers (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  name        text not null,
  home        text,
  dialect     text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- 5. stories ----------------------------------------------------
create table public.stories (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null references public.families(id) on delete cascade,
  storyteller_id uuid references public.storytellers(id) on delete set null,
  author_id      uuid references auth.users(id),
  title          text,
  question       text,
  text           jsonb,                 -- { first: [...paragraphs], raw: [...] }
  terms          jsonb default '[]',    -- cultural notes [{word, kind, note, status}]
  topics         text[] default '{}',
  people         text[] default '{}',
  era            text,
  place          text,
  lang           text default 'zh',
  audio_path     text,                  -- path inside the "audio" bucket
  duration       int,
  published      boolean default false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index stories_family_idx on public.stories(family_id, created_at desc);
create index stories_published_idx on public.stories(published, created_at desc);

-- 6. invites: a code that lets someone join a family ------------
create table public.invites (
  code        text primary key,
  family_id   uuid not null references public.families(id) on delete cascade,
  created_by  uuid references auth.users(id),
  used_by     uuid,
  created_at  timestamptz default now()
);

-- ============================================================
--  Helper functions
-- ============================================================

-- Is the signed-in user a member of family f?
create or replace function public.is_family_member(f uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.family_members
    where family_id = f and user_id = auth.uid()
  );
$$;

-- Create a profile row automatically when someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Create a family and make the caller its owner (one call, no RLS gap)
create or replace function public.create_family(family_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  insert into public.families (name, created_by) values (family_name, auth.uid()) returning id into fid;
  insert into public.family_members (family_id, user_id, role) values (fid, auth.uid(), 'owner');
  return fid;
end;
$$;

-- Join a family with an invite code
create or replace function public.join_family(invite_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  select family_id into fid from public.invites where code = invite_code and used_by is null;
  if fid is null then raise exception 'invalid or used invite code'; end if;
  insert into public.family_members (family_id, user_id) values (fid, auth.uid())
    on conflict do nothing;
  update public.invites set used_by = auth.uid() where code = invite_code;
  return fid;
end;
$$;

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger stories_touch before update on public.stories
  for each row execute function public.touch_updated_at();

-- ============================================================
--  Row Level Security — who may see / change what
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.families       enable row level security;
alter table public.family_members enable row level security;
alter table public.storytellers   enable row level security;
alter table public.stories        enable row level security;
alter table public.invites        enable row level security;

-- profiles: names are public (shown on community posts); only you edit yours
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles update" on public.profiles for update using (auth.uid() = id);

-- families: members only
create policy "families read"   on public.families for select using (public.is_family_member(id));
create policy "families update" on public.families for update using (
  exists (select 1 from public.family_members m where m.family_id = id and m.user_id = auth.uid() and m.role = 'owner')
);

-- family_members: members can see who else is in the family
create policy "members read" on public.family_members for select using (public.is_family_member(family_id));

-- storytellers: members read and write
create policy "storytellers read"   on public.storytellers for select using (public.is_family_member(family_id));
create policy "storytellers write"  on public.storytellers for insert with check (public.is_family_member(family_id));
create policy "storytellers update" on public.storytellers for update using (public.is_family_member(family_id));

-- stories: family reads everything; the public reads only published ones
create policy "stories read family"    on public.stories for select using (public.is_family_member(family_id));
create policy "stories read published" on public.stories for select using (published = true);
create policy "stories insert" on public.stories for insert with check (public.is_family_member(family_id) and author_id = auth.uid());
create policy "stories update" on public.stories for update using (public.is_family_member(family_id));
create policy "stories delete" on public.stories for delete using (author_id = auth.uid());

-- invites: members create and see their family's codes
create policy "invites read"   on public.invites for select using (public.is_family_member(family_id));
create policy "invites insert" on public.invites for insert with check (public.is_family_member(family_id) and created_by = auth.uid());

-- ============================================================
--  Storage: private bucket for recordings
--  Files are stored as  <family_id>/<story_id>.webm
-- ============================================================
insert into storage.buckets (id, name, public) values ('audio', 'audio', false)
  on conflict (id) do nothing;

create policy "audio read"   on storage.objects for select
  using (bucket_id = 'audio' and public.is_family_member(((storage.foldername(name))[1])::uuid));
create policy "audio upload" on storage.objects for insert
  with check (bucket_id = 'audio' and public.is_family_member(((storage.foldername(name))[1])::uuid));
create policy "audio delete" on storage.objects for delete
  using (bucket_id = 'audio' and public.is_family_member(((storage.foldername(name))[1])::uuid));

-- done ✓
