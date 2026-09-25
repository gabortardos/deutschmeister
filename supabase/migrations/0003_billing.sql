-- 0003_billing.sql — M9 payments (owner: run once in the SQL editor, like 0001/0002).
--
-- ai_entitlements grows the subscription envelope: valid_until (period end; the
-- monthly allowance only counts while now < valid_until), tts_char_cap (per-plan
-- monthly HD-voice chars: free 20k taste, basic 0, plus 150k, pro 400k),
-- cancel_at_period_end, source ('paddle-sandbox' | 'paddle-live' | 'manual') and
-- paddle_customer_id (ctm_…, needed for customer-portal sessions).
--
-- billing_events: webhook audit + idempotency. RLS enabled with NO client
-- policies → only the service role (paddle-webhook Edge Function) can touch it.

alter table public.ai_entitlements
  add column if not exists valid_until timestamptz,
  add column if not exists source text not null default 'manual',
  add column if not exists tts_char_cap integer not null default 20000,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists paddle_customer_id text;

-- M9 free-tier shrink: platform HD voice becomes a ~20k chars/month taste
-- (M8 shipped 200k while it was free-configured); rows written by webhooks
-- always set an explicit cap, this default covers manual/free rows.
alter table public.ai_entitlements
  alter column tts_char_cap set default 20000;

create table if not exists public.billing_events (
  id bigint generated always as identity primary key,
  paddle_event_id text not null unique,
  event_type text not null default '',
  user_id uuid,
  source text not null default '',
  outcome text not null default '',
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists billing_events_user on public.billing_events (user_id, created_at desc);

alter table public.billing_events enable row level security;
-- Intentionally NO policies: deny-by-default for anon/authenticated.
