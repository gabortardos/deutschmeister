-- DeutschMeister M7.2 — cloud sync tables (one-time setup; idempotent, safe to re-run).
-- One row per local entity: (user_id, id) primary key + updated_at (epoch ms, for
-- last-write-wins) + the full local row in a `data` jsonb payload.
-- Row-Level Security: a user can only ever SELECT/INSERT/UPDATE/DELETE their own rows.
-- Never give clients the service_role key — the anon key is safe ONLY because of RLS.

create table if not exists public.user_profiles (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  updated_at bigint not null,
  data jsonb not null,
  primary key (user_id, id)
);
alter table public.user_profiles enable row level security;
drop policy if exists "own rows only" on public.user_profiles;
create policy "own rows only" on public.user_profiles
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.app_settings (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  updated_at bigint not null,
  data jsonb not null,
  primary key (user_id, id)
);
alter table public.app_settings enable row level security;
drop policy if exists "own rows only" on public.app_settings;
create policy "own rows only" on public.app_settings
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.vocab_words (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  updated_at bigint not null,
  data jsonb not null,
  primary key (user_id, id)
);
alter table public.vocab_words enable row level security;
drop policy if exists "own rows only" on public.vocab_words;
create policy "own rows only" on public.vocab_words
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.vocab_cards (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  updated_at bigint not null,
  data jsonb not null,
  primary key (user_id, id)
);
alter table public.vocab_cards enable row level security;
drop policy if exists "own rows only" on public.vocab_cards;
create policy "own rows only" on public.vocab_cards
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.drill_items (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  updated_at bigint not null,
  data jsonb not null,
  primary key (user_id, id)
);
alter table public.drill_items enable row level security;
drop policy if exists "own rows only" on public.drill_items;
create policy "own rows only" on public.drill_items
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.drill_attempts (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  updated_at bigint not null,
  data jsonb not null,
  primary key (user_id, id)
);
alter table public.drill_attempts enable row level security;
drop policy if exists "own rows only" on public.drill_attempts;
create policy "own rows only" on public.drill_attempts
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.conversation_sessions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  updated_at bigint not null,
  data jsonb not null,
  primary key (user_id, id)
);
alter table public.conversation_sessions enable row level security;
drop policy if exists "own rows only" on public.conversation_sessions;
create policy "own rows only" on public.conversation_sessions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.conversation_turns (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  updated_at bigint not null,
  data jsonb not null,
  primary key (user_id, id)
);
alter table public.conversation_turns enable row level security;
drop policy if exists "own rows only" on public.conversation_turns;
create policy "own rows only" on public.conversation_turns
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.lesson_logs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  updated_at bigint not null,
  data jsonb not null,
  primary key (user_id, id)
);
alter table public.lesson_logs enable row level security;
drop policy if exists "own rows only" on public.lesson_logs;
create policy "own rows only" on public.lesson_logs
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.scenarios (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  updated_at bigint not null,
  data jsonb not null,
  primary key (user_id, id)
);
alter table public.scenarios enable row level security;
drop policy if exists "own rows only" on public.scenarios;
create policy "own rows only" on public.scenarios
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
