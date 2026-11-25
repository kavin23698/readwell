-- Readwell schema.
-- Sync model: ids are generated on the device (offline-first). Every row carries user_id, created_at,
-- updated_at (set by the client: last-write-wins), deleted_at (soft delete) and server_updated_at
-- (set by the server on every write; clients pull rows changed since their last pull).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------------------------
-- Shared trigger: last-write-wins + server change stamp
-- ---------------------------------------------------------------------------------------------
create or replace function public.rw_before_write()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    -- An older edit (by client clock) never overwrites a newer one.
    if new.updated_at < old.updated_at then
      return null;
    end if;
    new.created_at := old.created_at;
    new.user_id := old.user_id;
  end if;
  new.server_updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  goal_type text not null default 'minutes' check (goal_type in ('minutes', 'pages')),
  daily_goal integer not null default 15 check (daily_goal between 1 and 1440),
  reminder_time text not null default '20:30' check (reminder_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  reading_mode text not null default 'slide' check (reading_mode in ('slide', 'scroll')),
  translation_language text not null default 'hi',
  onboarding_completed boolean not null default false,
  notif_daily boolean not null default true,
  notif_streak boolean not null default true,
  notif_challenge boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  author text,
  format text not null check (format in ('epub', 'pdf', 'txt')),
  file_size bigint not null check (file_size > 0 and file_size <= 52428800),
  storage_path text,
  cover_path text,
  cover_seed integer not null default 0,
  total_pages integer,
  source_name text,
  finished_at timestamptz,
  last_opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now()
);

create table public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  location text not null,           -- EPUB CFI, PDF page number, or TXT character offset
  percent real not null default 0 check (percent between 0 and 100),
  page integer,
  chapter text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_id uuid references public.books (id) on delete set null,
  local_date date not null,         -- the device's local calendar day
  started_at timestamptz not null,
  ended_at timestamptz not null,
  seconds integer not null default 0 check (seconds >= 0),
  pages integer not null default 0 check (pages >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now()
);

create table public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  location text not null,           -- EPUB CFI range, PDF page+offsets, or TXT start:end
  text text not null default '',
  chapter text,
  page integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  highlight_id uuid references public.highlights (id) on delete set null,
  kind text not null default 'note' check (kind in ('note', 'meaning', 'translation')),
  location text,                    -- null = general note for the book
  quote text,
  body text not null default '',
  chapter text,
  page integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now()
);

create table public.want_to_read (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  author text,
  note text,
  position double precision not null default 0,
  added_to_library boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now()
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  period text not null check (period in ('week', 'month')),
  target_type text not null check (target_type in ('books', 'pages', 'minutes', 'goal_days')),
  target integer not null check (target > 0),
  starts_on date not null,
  ends_on date not null,
  status text not null default 'active' check (status in ('active', 'completed', 'missed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

-- ---------------------------------------------------------------------------------------------
-- Triggers, indexes, Row Level Security
-- ---------------------------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['profiles','books','reading_progress','reading_sessions','highlights','notes','want_to_read','challenges']
  loop
    execute format('create trigger rw_before_write before insert or update on public.%I for each row execute function public.rw_before_write()', t);
    execute format('create index %I on public.%I (user_id, server_updated_at)', t || '_sync_idx', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows: select" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "own rows: insert" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy "own rows: update" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy "own rows: delete" on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;

create index books_user_idx on public.books (user_id);
create index highlights_book_idx on public.highlights (book_id);
create index notes_book_idx on public.notes (book_id);
create index reading_sessions_user_date_idx on public.reading_sessions (user_id, local_date);

-- Profiles are created by the sign-up trigger; clients can't insert them for someone else.
-- (The insert policy above still requires user_id = auth.uid().)

-- ---------------------------------------------------------------------------------------------
-- Create a profile for every new user
-- ---------------------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------------------------
-- Storage: private "books" bucket, 50 MB per file, each user only under "<user_id>/"
-- ---------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('books', 'books', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

create policy "books: read own files" on storage.objects for select to authenticated
  using (bucket_id = 'books' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "books: upload own files" on storage.objects for insert to authenticated
  with check (bucket_id = 'books' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "books: update own files" on storage.objects for update to authenticated
  using (bucket_id = 'books' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "books: delete own files" on storage.objects for delete to authenticated
  using (bucket_id = 'books' and (storage.foldername(name))[1] = (select auth.uid())::text);
