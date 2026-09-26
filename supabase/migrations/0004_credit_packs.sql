-- 0004_credit_packs.sql — M9.8 one-time AI Credit Packs (owner: run once in the SQL
-- editor, like 0001–0003).
--
-- ai_credit_packs  one row per purchased top-up (€2.90 → $3 / €5.90 → $7). Packs
--                   EXPIRE 6 months after purchase; ai-proxy drops expired rows
--                   from the budget and consumes the soonest-expiring packs
--                   FIRST (use-it-or-lose-it never strands short-lived money
--                   behind the $1 teaser or legacy credit). Inserted only by the
--                   paddle-webhook Edge Function (service role); clients can
--                   read their own rows. Spend itself stays in ai_usage — the
--                   pack row is never decremented.

create table if not exists public.ai_credit_packs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_usd_micros bigint not null check (amount_usd_micros > 0),
  expires_at timestamptz not null,
  source text not null default 'paddle',
  created_at timestamptz not null default now()
);

create index if not exists ai_credit_packs_user_expiry on public.ai_credit_packs (user_id, expires_at);

alter table public.ai_credit_packs enable row level security;

drop policy if exists "read own credit packs" on public.ai_credit_packs;
create policy "read own credit packs"
  on public.ai_credit_packs for select
  using (auth.uid() = user_id);