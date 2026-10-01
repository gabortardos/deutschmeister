# Owner Ops Runbook — one doc, click by click (M13.1, v2.33.0)

Everything the owner (Gábor) needs to operate the backend by hand. No code knowledge
required — each step names the exact dashboard, menu and value. The agent keeps this
file in sync; if reality and this doc disagree, trust reality and tell the agent.

## 0. Fixed facts

| Thing | Value |
| --- | --- |
| Supabase dashboard | https://supabase.com/dashboard → project **deutschmeister** |
| Paddle dashboard | https://vendors.paddle.com (sandbox: https://sandbox-vendors.paddle.com) |
| Live app | https://gabortardos.github.io/deutschmeister/ |
| z.ai (Coding Plan key + quota) | https://z.ai → Billing/Usage; coding-plan quota = prompts per rolling 5-hour window, SHARED by all platform users |
| Google Cloud TTS | https://console.cloud.google.com → APIs & Services → Cloud Text-to-Speech (quota: Neural2 1M chars/mo free, then $16/1M; Wavenet 4M free, then $4/1M) |

## 1. Supabase auth (one-time + whenever a login problem is reported)

1. **Google sign-in**: Dashboard → Authentication → Providers → Google → enable.
   Needs a Google Cloud OAuth client (ID + secret) with **both** redirect URLs from
   the provider page pasted into the Google console. If the Google button 400s →
   the redirect URLs don't match.
2. **Email confirmations**: Authentication → Emails → keep the default confirm-email
   flow ON (ai-proxy gates spending on verified email). Custom SMTP is OPTIONAL —
   the built-in sender works; add SMTP only if deliverability suffers.

## 2. Edge Functions inventory (re-paste = Dashboard → Edge Functions → pick → replace code)

| Function | Verify JWT | Secrets |
| --- | --- | --- |
| `ai-proxy` | **ON** | `ZAI_PLATFORM_KEY` (chat; wins if set) · `OPENAI_PLATFORM_KEY` (fallback chat) · `PLATFORM_TTS_KEY` (HD voice) |
| `paddle-checkout` | **ON** | `PADDLE_API_KEY` · `PADDLE_CLIENT_TOKEN` · `PADDLE_PRICE_MAP` |
| `paddle-webhook` | **OFF** (Paddle sends no Supabase JWT) | `PADDLE_WEBHOOK_SECRET` · `PADDLE_PRICE_MAP` · `PADDLE_ENV` (`sandbox`\|`live`) · `PADDLE_SANDBOX_TEST_USER` (one or more test-account uuids, comma-separated) |

`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — never set
them by hand, never paste the service key anywhere else.

## 3. Paddle products & price map

Create (Paddle → Catalog → Products; sandbox first): **Basic** (€3.99/mo + €29.99/yr),
**Plus** (€5.99/mo + €49.99/yr), **Supporter** (€11.99/yr), two one-time **credit
packs** (€2.90 → $3, €5.90 → $7), **Pro** (€9.99/mo + €89.99/yr — DORMANT until
M11.10b; do not link it publicly before then). Then build `PADDLE_PRICE_MAP`:

```json
{"pri_xxx":{"plan":"basic","kind":"subscription","interval":"month"}, "pri_yyy":{"plan":"basic","kind":"subscription","interval":"year"}, "pri_zzz":{"plan":"plus","kind":"subscription","interval":"month"}, "...":"...", "pri_pack1":{"kind":"credit","creditUsdMicros":3000000}, "pri_pack2":{"kind":"credit","creditUsdMicros":7000000}}
```

Paste the SAME JSON into `paddle-checkout` and `paddle-webhook` secrets. Also:
Checkout → Checkout settings → default payment link = app URL (else transaction-create
400s). Webhook destination → your `paddle-webhook` URL + copy its secret into
`PADDLE_WEBHOOK_SECRET`.

## 4. M13 allowance bump (ONE-TIME, after deploying v2.32.0)

The webhook writes allowances only on subscription events, so rows created before
the retune still carry $2/$3.5. After re-pasting **paddle-webhook** and **ai-proxy**,
run in SQL editor (Dashboard → SQL Editor):

```sql
update ai_entitlements set monthly_allowance_usd_micros = 10000000 where plan = 'basic';
update ai_entitlements set monthly_allowance_usd_micros = 20000000 where plan = 'plus';
update ai_entitlements set monthly_allowance_usd_micros = 40000000 where plan = 'pro';
```

Verify: sign in as the Plus test account → Settings → Account & Billing → the
"Managed AI budget" bar should show ≈ $21+ ($1 teaser + $20 allowance minus spend).

## 4b. Adding a second sandbox test account (M13.1)

The webhook's sandbox guard blocks events for anyone not on the allowlist. To add
`gardianofthedigitalworld@gmail.com` (or any extra tester):

1. Have the new account sign in to the app once (Google) — this creates its
   `auth.users` row.
2. Supabase → Authentication → Users → find the new user → copy its **UID** (uuid).
3. Edge Functions → `paddle-webhook` → Secrets → `PADDLE_SANDBOX_TEST_USER` → set to
   `<existing-owner-uuid>,<new-uid>` (comma-separated, no spaces needed).
4. No re-paste needed — secrets are read per request.

Which backend is live: Settings → AI Model shows the active model after the meter
refreshes — `glm-4.6` = z.ai (ZAI_PLATFORM_KEY set), `gpt-5-mini` = OpenAI fallback.
To switch: add/delete the `ZAI_PLATFORM_KEY` secret on `ai-proxy` and re-paste it.

## 4c. Sandbox purchase didn't flip the badge? (M13.3)

If a sandbox payment succeeded in Paddle but the app still shows the old plan: the
purchase event was processed while the webhook still had the OLD single-account
allowlist, so it was recorded in `billing_events` with outcome `sandbox-blocked` —
and idempotency (same event id) makes Paddle "Resend" skip it forever. Fix (after
the new webhook + allowlist are in place):

1. Supabase → SQL Editor → run:

```sql
delete from billing_events where outcome = 'sandbox-blocked';
```

2. Paddle sandbox dashboard → Developer Tools → Webhooks → your `paddle-webhook`
   endpoint → find the latest `subscription.*` / `transaction.*` event for the
   purchase → **Resend**.
3. Reload the app as that account within ~10 s — the badge/plan flips.

## 4d. Included HD voice list is now 2 voices (M13.3 — re-paste ai-proxy)

`ai-proxy` type=ttsVoices now serves exactly `de-DE-Neural2-A` (female) +
`de-DE-Neural2-B` (male). The wider Neural2+Wavenet set sounded like two identical
pairs. Re-paste **ai-proxy** from the repo to serve the trimmed list (the curated
in-app fallback already matches).

## 4e. Webhook log says "invalid signature" (M13.3)

The function REJECTS the event before any DB write (no `billing_events` row, no
idempotency marker), so once the signature passes, a plain Paddle **Resend** works —
no SQL cleanup needed. "invalid signature" always means: the
`PADDLE_WEBHOOK_SECRET` on the Supabase function ≠ the **signing secret of the
Paddle destination that delivered the event**. Fix:

1. Paddle (sandbox) → Developer tools → **Notifications** → open the FAILED
   delivery in the log → note WHICH destination delivered it.
2. Open that destination → copy its **signing secret** (the destination page's
   "Signing secret" — NOT the API key `…apikey…`, NOT the client-side token
   `test_…`). If more than one destination exists, either use this one's secret or
   delete the duplicates and keep exactly one pointing at the function URL
   (`https://<project>.supabase.co/functions/v1/paddle-webhook`).
3. Supabase → Edge Functions → `paddle-webhook` → Secrets → set
   `PADDLE_WEBHOOK_SECRET` to the copied value (paste plain — no quotes/spaces),
   and re-check `PADDLE_SANDBOX_TEST_USER` still holds both test uuids (recreating
   a function wipes its secrets).
4. Validate WITHOUT a purchase: destination page → **Send test notification** →
   the log should show **200** (`{"ok":true,…}` or a *reason* now — the M13.3
   webhook says exactly which check failed: missing header / stale ts / hmac
   mismatch).
5. Resend the latest `subscription.*`/`transaction.completed` from the log →
   reload the app as that account → badge flips.

## 5. Sandbox → live go-live (locked decision: when real users may pay)

1. Paddle: verify business + switch account to live → recreate products/prices →
   new live price IDs → rebuild `PADDLE_PRICE_MAP`.
2. Supabase: set `PADDLE_ENV=live`, replace `PADDLE_API_KEY`/`PADDLE_CLIENT_TOKEN`/
   `PADDLE_WEBHOOK_SECRET` with live values, update `PADDLE_PRICE_MAP`.
3. Re-paste all three functions (cheap; guarantees no drift). Sandbox guard lifts
   automatically when `PADDLE_ENV=live`.

## 6. Routine checks (monthly, ~5 minutes)

**Profit snapshot** (SQL editor — revenue comes from Paddle reports; this is cost):

```sql
-- this month's platform-AI cost per plan (nominal z.ai prices, exact usage)
select e.plan, count(distinct u.user_id) as users,
       round(sum(u.cost_usd_micros)/1e6, 2) as chat_usd
from ai_usage u join ai_entitlements e on e.user_id = u.user_id
where u.created_at >= date_trunc('month', now()) and u.feature <> 'hd-tts'
group by e.plan;

-- HD voice chars this month (real money beyond Google's free tier)
select round(sum(chars)/1e6.0, 2) as tts_million_chars
from ai_usage where feature = 'hd-tts' and created_at >= date_trunc('month', now());
```

Rules of thumb: chat cost is nominal bookkeeping (real cost = the flat Coding Plan);
watch (a) z.ai quota exhaustion → app shows "rate-limited", (b) TTS chars vs the 1M
free tier → beyond it each Plus user costs up to $2.40/mo worst case, (c) any user
burning > $5/mo chat → check `ai_usage` for scripted abuse. Secrets rotation: change
at the provider, update the Edge Function secret, done — no redeploy needed.
