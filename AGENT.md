# AGENT.md — Development Handoff Guide (single source of truth)

You may be Claude, GPT/GPT-5, Gemini, DeepSeek, Copilot, or a human taking over this project.
This file tells you everything needed to continue development **without asking the user
questions that are already answered**. Read this file, then `ROADMAP.md`, then
`docs/MASTER_PROMPT.md` (the full spec). The user's rule: **if a decision is already documented
here, do not re-ask — just build.**

## Project

**DeutschMeister** — local-first, single-user German learning app (browser MVP → iOS later).
Deterministic core (vocab/grammar/SRS, offline, free) + optional LLM layer (BYO key).
- Phase 2 (v2.x): accounts (Supabase), $1 platform-AI teaser, hybrid payments — plan:
  `docs/PHASE2_PLAN.md`. The single-user/no-backend description applies through M6; from M7 a
  backend becomes OPTIONAL (guest/local-only mode stays forever).
- Live: https://gabortardos.github.io/deutschmeister/ (auto-deploys on every push to `main`)
- Repo: `gabortardos/deutschmeister` (public, GitHub Pages via Actions)
- Stack: React 18 + Vite 5 + TypeScript strict (no `any`) + Tailwind + Zustand + Dexie +
  react-router (HashRouter) + zod + Vitest. Node 20+, npm.
- Vite `base: '/deutschmeister/'` — never change while hosted on the Pages subpath.

## The verification gate (NON-NEGOTIABLE)

After EVERY development step (feature, fix, refactor), run:

```bash
cd "/Users/gabortardos/Desktop/German language teacher app - GLM"   # NOTE: path has spaces — always quote!
npx tsc --noEmit && npm test -- --run && npm run build
```

If anything fails: fix it and re-run until 100% green. Only then commit/push. The deployed
version is only ever overwritten by a fully green build. `npm run dev` smoke test (HTTP 200)
is part of milestone DoDs. Git tags: `m0`, `m1`, … per milestone + moving tag `last-working`
pointing at the newest verified commit. Update `ROADMAP.md` in the same commit.

## Conventions

- `src/engine`, `src/llm`, `src/speech`: pure TS modules, NO React imports (unit-tested).
- Features never touch Dexie directly — always via `src/db/repositories/*`.
- API key lives ONLY in localStorage (`src/llm/keyStore.ts`, key `dm.apiKey`), never in
  IndexedDB, never in code, never committed. Other localStorage keys: `dm.llmLog` (diagnostics).
- Dexie boolean filters use `.filter((x) => x.custom === true)` (IndexedDB doesn't index
  booleans reliably).
- UI primitives in `src/components/ui.tsx` (Card, Button, Badge, Field, inputClass…).
- Commits: conventional style with milestone prefix, e.g. `M1: vocab SRS engine, drills, dashboard`.
- Secrets scan before every commit: `git diff --cached | grep -nEi '(sk-[A-Za-z0-9]|api[_-]?key.*=|Bearer )'`
  — if a real key shows up, abort the commit.
- German content uses proper orthography (ä ö ü ß). No lorem-ipsum German. No gamification
  (deliberate dormant option — see `docs/PHASE2_PLAN.md` § Dormant options before building
  anything that could block it later).

## Environment quirks (this machine)

- macOS, zsh. The workspace path contains spaces — ALWAYS quote it in shell commands.
- `gh` CLI is not on PATH: use the full path `/opt/homebrew/bin/gh` (authed as `gabortardos`).
- Provider facts, live-verified 2026-09-20, re-checked 2026-09-24 (curl OPTIONS preflights from
  github.io + localhost origins): api.z.ai (coding AND paas endpoints) answers preflight 200 but
  sends NO access-control-allow-origin → z.ai keys (incl. GLM Coding Plan Lite) cannot be used
  browser-direct. Since M8.2 the `glm-zai` provider relays them through the ai-proxy Edge
  Function (server-side, no CORS; user's key in `x-dm-byo-key`, forwarded once, never stored).
  Server-side the coding endpoint works with `glm-4.6` (~1.3 s, thinking disabled by the adapter).
  Browser-usable GLM: `https://open.bigmodel.cn/api/paas/v4` (full CORS) with a bigmodel.cn key
  (default model `glm-4.5-flash`, free tier). `glm-4-flash` retired (1211); `glm-5.3-flash` needs
  balance (1113). api.openai.com and api.deepseek.com are browser-compatible.
  The user's key is NOT stored in this repo — the user pastes it into Settings in the browser
  (or opens `#/settings?key=…`, which stores + strips it). Never echo real keys into files/logs/commits.

- Supabase (M7): project `deutschmeister` (eu-central-1). Client env ships via GitHub repo
  VARIABLES `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (+ local `.env`, gitignored) — the
  anon key is public-by-design (safety = RLS); the service_role key must NEVER leave the
  Supabase dashboard. Cloud tables: `supabase/migrations/0001_init.sql` (owner applies via SQL
  editor; until then the app shows a friendly "not set up yet" sync error).
- Paddle payments (M9, v2.4.0 — code complete, owner deployment pending): two new Edge
  Functions + migration `supabase/migrations/0003_billing.sql` (ai_entitlements gains
  valid_until/source/tts_char_cap/cancel_at_period_end/paddle_customer_id; `billing_events`
  table = webhook idempotency + audit, RLS deny-all → service-role only).
  - `supabase/functions/paddle-checkout/index.ts` (deploy with JWT verify ON): type=plans
    (catalog from PADDLE_PRICE_MAP — price IDs live server-side so sandbox→live needs no
    client rebuild), type=checkout (POST {api}/transactions → returns {transactionId,
    clientToken, env, url}; v2.4.1: Paddle Billing has NO API-hosted checkout page — its
    checkout.url is just <default payment link>?_ptxn=…, so the client opens the
    transaction as a Paddle.js overlay; a missing dashboard default payment link ⇒ 400
    transaction_default_checkout_url_not_set), type=portal (customer-portal session for
    manage/cancel).
  - `supabase/functions/paddle-webhook/index.ts` (deploy with JWT verify **OFF** — Paddle
    sends no Supabase JWT; the Paddle-Signature HMAC is the auth): verifies ts/h1 over
    `ts:rawBody` (±300 s), idempotent via billing_events, subscription events →
    grant/extend/downgrade ai_entitlements (unknown price ids never grant; credit packs add
    credit_usd_micros), **sandbox guard**: while PADDLE_ENV≠live, events only touch
    PADDLE_SANDBOX_TEST_USER. Signature twin unit-tested in `src/billing/paddle.ts`.
  - ai-proxy upgraded: budget = LIFETIME pools ($1 teaser + credit) consumed FIRST, then the
    monthly allowance (only while now < valid_until) — mirror of
    `remainingBudgetWithMonthly` in `src/llm/entitlement.ts`; per-plan HD-voice caps
    (free 20k taste / Basic 0 → 403 `hd-voice-not-in-plan` / Plus 150k); usage response
    publishes plan envelope (plan/ttsCharsUsed/ttsCharCap/validUntil/cancelAtPeriodEnd).
  - Secrets (owner, dashboard): PADDLE_API_KEY, PADDLE_CLIENT_TOKEN (Paddle client-side
    token `test_…`/`live_…` — public by design, can only OPEN checkouts), PADDLE_ENV
    (sandbox|live), PADDLE_WEBHOOK_SECRET, PADDLE_PRICE_MAP (JSON
    priceId→{plan,kind,interval,creditUsdMicros}), PADDLE_SANDBOX_TEST_USER. Paddle-side
    too: default payment link = app URL (Checkout → Checkout settings), or every
    transaction-create 400s (sandbox: any URL, no approval; live: reviewed).
    Plan allowances (gpt-5-mini backend: Basic $2 / Plus $3.5) live in paddle-webhook's PLANS.
  - Client: plan catalog `src/llm/plans.ts` (v3: Basic €3.99·€29.99, Plus €5.99·€49.99 ⭐,
    Pro dormant/hidden), Settings → Account & Billing (`BillingSection.tsx`: usage bars,
    pricing cards, checkout/manage redirects, ?billing=success return handling). v2.4.1:
    `src/billing/paddleClient.ts` lazy-loads cdn.paddle.com/paddle/v2/paddle.js on first
    subscribe (Initialize-once guard), opens the transaction via
    Paddle.Checkout.open({transactionId}) overlay, closes it on checkout.completed and
    polls the meter via getState (no stale closures); typed failure reasons are
    surfaced in the UI (v2.4.2) — the old silent redirect to checkout.url was a
    dead end (it IS our homepage?_ptxn); redirect only to genuine external pages,
    and landing with ?_ptxn=… auto-resumes the overlay (main.tsx). v2.4.3: the
    CDN SDK removed Initialize({environment}) ("Unknown option parameter") —
    sandbox is now selected with Paddle.Environment.set('sandbox') BEFORE
    Initialize; live needs no call (production is the default). v2.4.4:
    eventCallback logs every checkout.error/warning as `[PADDLE]` console lines.
    v2.4.5: NO customer-email prefill in Checkout.open — Paddle's
    transaction-checkout service rejects settings.customer.email
    (validation.no_validation_set); the webhook maps by custom_data.user_id,
    so the prefill was unnecessary anyway.
    v2.4.6: platform HD voice is GATED (configurePlatformTts availability
    predicate: signed-in + plan tts_char_cap > 0) — signed-out users no longer
    see the included voice picker; ai-proxy gained type=ttsVoices (included
    German list = Neural2+Wavenet, same whitelist as synthesize — Studio/Chirp
    stay BYO-only); the Speech section greyes out whichever engine is unused and
    the HD preview no longer silently plays the browser voice when keyless.
- Platform AI teaser (M8, v2.1.0): signed-in keyless users get AI via the `ai-proxy` Edge
  Function (`supabase/functions/ai-proxy/index.ts` — owner deploys by pasting into Dashboard →
  Edge Functions; secrets `OPENAI_PLATFORM_KEY` or `ZAI_PLATFORM_KEY` (chat; z.ai wins when both
  exist) + `PLATFORM_TTS_KEY` set there, never in repo;
  metering tables from `supabase/migrations/0002_metering.sql`). $1 metered cap, 10 req/min,
  email-verified only (owner: confirm his user manually — "Confirm email" is disabled
  project-wide). BYO key always wins and bypasses the proxy entirely. Since M8.1 the function
  PUBLISHES its live model+prices in every usage response and the client adopts them
  automatically on refresh; `src/llm/entitlement.ts` keeps only a bundled FALLBACK (offline /
  pre-redeploy sessions). M8.2 adds the BYO relay (`POST /byo/zai-coding|zai-api/chat/completions`,
  no account needed, caller's key in `x-dm-byo-key`, host-locked routes, 64 KB cap, 30 req/min/IP)
  and the default provider `glm-zai` ("GLM via z.ai — Coding Plan", glm-4.6, `relay:` sentinel
  baseUrls resolved by the adapter). M8.3: provider labels/model annotations de-confused in
  Settings (bigmodel.cn: only glm-4.5-flash is free, others need balance), relay endpoints show
  a managed static field, and the 5 public Paddle-compliance pages live at `/#/about|contact|`
  `terms|privacy|refund` (`src/features/legal/LegalPages.tsx`, footer-linked everywhere).

## M9.5 onboarding (v2.5.0)

First-visit tour at `#/welcome` (`src/features/onboarding/WelcomeFlow.tsx` + `welcome.ts`
helpers): auto-opens from the Dashboard when the `dm-welcome-done` localStorage flag is absent
(fresh browser on an existing account sees it once too — deliberate). Four steps: intro →
optional account (reuses `sync/authActions.ts`: Google / email sign-in + sign-up / guest) →
basics (name / A1–B2 / 5-10-15-20 daily goal, saved via `patchProfile`) → explicit AI choice:
included teaser (with meter + run-out copy + guest warning) vs own key (provider + key →
`setApiKey` + `patchSettings`). "Replay welcome tour" lives in Settings → Getting started.
Note: the Google button needs the Google provider enabled in Supabase (dashboard) and email
sign-up needs SMTP — without them the buttons show the provider's error and the guest path
always works.

## Resume protocol for a new agent

1. `git log --oneline -8` + read `ROADMAP.md` → know exactly what's done and what's next.
2. Run the verification gate — it must already be green before you change anything.
3. Build the next unchecked item from `ROADMAP.md` (Phase 2 milestones: `docs/PHASE2_PLAN.md`).
   Update ROADMAP + relevant docs as you go.
4. Gate → docs → secrets scan → commit → `git push origin main --tags` → verify CI+deploy green
   (`/opt/homebrew/bin/gh run list --limit 3`) → verify live URL.
