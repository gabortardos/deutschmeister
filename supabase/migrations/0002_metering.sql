-- 0002_metering.sql — M8 platform-AI teaser (owner: run once in the SQL editor, like 0001).
--
-- ai_usage     append-only metered-usage log. Clients can READ their own rows only;
--              NO client insert/update policies → only the ai-proxy Edge Function
--              (service role, bypasses RLS) can write.
-- ai_entitlements  per-user budget envelope for M9 (plan, monthly allowance, credit).
--              Written by PSP webhooks later; the function reads it to compute the
--              remaining budget. Clients can read their own row.

create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null,
  model text not null default '',
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  chars integer not null default 0,
  cost_usd_micros bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_recent on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;

drop policy if exists "read own ai usage" on public.ai_usage;
create policy "read own ai usage"
  on public.ai_usage for select
  using (auth.uid() = user_id);

create table if not exists public.ai_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free',
  monthly_allowance_usd_micros bigint not null default 0,
  credit_usd_micros bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.ai_entitlements enable row level security;

drop policy if exists "read own entitlement" on public.ai_entitlements;
create policy "read own entitlement"
  on public.ai_entitlements for select
  using (auth.uid() = user_id);
