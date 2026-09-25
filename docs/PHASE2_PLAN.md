# PHASE2_PLAN.md — DeutschMeister Phase 2 (v1.0 → v2.x), milestones M4.2 → M11

> Companion to `AGENT.md` (conventions + verification gate) and `ROADMAP.md` (live ledger).
> This file holds the owner-approved Phase 2 plan: locked decisions, architecture, sequencing.
> Resume protocol for a fresh agent: read `AGENT.md` → `ROADMAP.md` → this file, run the gate
> (it must be green), then build the next unchecked milestone below. Approved 2026-09-21.

## Where we are (v2.1.0, live)

M0–M4 complete. Local-first, single-user PWA: 1,902-word vocab corpus (A1–B2) + SM-2 SRS, 50 grammar
topics (A1–B2) + placement, word bank, Speak & Listen drills (quality-ranked TTS voices + preview
picker + optional HD cloud voice via Google Cloud TTS with the user's key), 20 AI conversation
scenarios (incl. hands-free voice mode: continuous mic, silence commit, auto-spoken replies), AI
drills/explain/examples — all with the user's own API key
(GLM bigmodel.cn / OpenAI / DeepSeek). Export/import backup, offline shell, CI→Pages deploy.
Owner's daily driver (noted 2026-09-21): OpenAI **gpt-5-mini** BYO key — the GLM Coding Plan
(Lite) key is unusable in-browser (z.ai sends no CORS headers; bigmodel.cn rejects z.ai keys;
see `src/llm/providers.ts`). Accounts (M7.1, v1.3.0): sign-in is live — Google OAuth (PKCE) +
email/password with verification, forgot-password and recovery; the anon key ships via GitHub
repo variables (public-by-design, never in the repo). M7.2 ✅ (v2.0.0): last-write-wins sync
engine (`src/sync/syncEngine.ts`, 10 user-data tables via `syncRepo` adapters; API keys and
HD-TTS config are localStorage-only and never syncable), auto-sync on app start and sign-in,
"Use this browser's data" claim flow in Settings→Account. Owner action: run
`supabase/migrations/0001_init.sql` once in the SQL editor (RLS own-rows-only). Guest mode
stays fully usable without an account. Known v1 limit: no delete propagation (no tombstones).
Deterministic core needs no key, no net.

M8 ✅ (v2.1.0): platform-AI teaser shipped — signed-in keyless users get all AI features via
the `ai-proxy` Edge Function on the owner's key (owner pick: `gpt-5-mini` + HD TTS included;
switch to `glm-4.5-flash` later is a constants change in the function + `llm/entitlement.ts`).
$1 metered budget (Pro allowance/credit fields ready for M9), 10 req/min, email-verified only;
HD TTS metered at $0/char with a 200k chars/month guard while Google's free tier covers it.
BYO key always wins and stays unmetered. Owner actions: run `supabase/migrations/0002_metering.sql`,
deploy the function from `supabase/functions/ai-proxy/index.ts`, set secrets
`OPENAI_PLATFORM_KEY` + `PLATFORM_TTS_KEY`.

## Locked owner decisions (do not re-ask — build)

1. **Multi-user via Supabase** — Google OAuth + email/password with **email verification** and
   **forgot-password**; email+password doubles as the login fallback when Google isn't usable.
2. **Freemium + BYO key** — deterministic core free forever for everyone; a user's own API key
   unlocks all AI features free (current rule; see Dormant options #1 for the future door).
3. **$1 platform-AI teaser** — verified keyless accounts may use the owner's provider key up to
   $1 of *metered* usage; then an alert + paywall with two outs: pay, or add your own key
   (BYO escape hatch stays prominent — it's a feature, not a punishment).
4. **Hybrid payments** — monthly subscription (includes a monthly platform-usage allowance,
   e.g. €4/mo → $5 of AI, auto-refreshed, cost-capped for the owner) AND one-time top-ups
   (e.g. €2 → $2 credit, stacks on any tier, never expires). The user picks either.
5. **PSP: Paddle preferred** (merchant of record → they handle EU VAT), Stripe as fallback.
   Hosted checkout only — no card data ever touches our code. Apply early (approval lag).
6. **Auth email via Resend free SMTP** (100 mails/day) — Supabase's built-in SMTP is dev-only
   (~2–4 mails/hour).
7. Teaser-pool provider chosen by owner at M8 (candidates: `glm-4.5-flash` free tier ≈ $0 cost,
   `gpt-4o-mini`/`gpt-5-mini`, `deepseek-chat`; owner's own daily model today is `gpt-5-mini`).
8. **No gamification now** — progress visuals only; but nothing may preclude it later
   (Dormant options #2).
9. **Sequencing** — the commercial arc (M7→M8→M9) lands BEFORE the graphics pass (M10),
   because paywalls reshape screens; content & speech (M5/M6) come first (pure value, zero
   architectural risk).
10. **Guest mode stays forever** — the current local-only, no-account app remains fully usable.

## Membership tiers

| Tier | Deterministic core | AI features |
|---|---|---|
| Guest (no account) | ✅ free forever | only with own key |
| Free member (email verified) | ✅ | **$1 platform teaser**, then BYO key or pay |
| Premium (subscription and/or top-ups) | ✅ | platform AI per allowance/credit |
| Anyone with own key | ✅ | ✅ free, unlimited, on their key |

## Milestones

| # | Milestone | Version | One-liner |
|---|---|---|---|
| M4.2 | UX cleanup | v1.0.1 | Setup checklist → Settings + guided onboarding, per-provider API-key manuals, Roadmap card removed from dashboard, version footer, dashboard "next action" focus |
| M5 | Full B2 content | v1.1 | M5.1 vocab → ~2,000 words (incl. ~125 phrases) · M5.2 grammar → ~50 topics · M5.3 +8–10 B1/B2 scenarios |
| M6 | Speech | v1.2 | TTS voice-quality fix (quality-ranked selection + per-voice previews), optional HD cloud TTS, hands-free voice conversation (state machine + silence detection + auto-TTS) |
| M7 | Accounts | v2.0 | Supabase: Google + email/password (verification, forgot-password, fallback), RLS isolation, offline sync (last-write-wins via `updatedAt`), "claim this browser's data", guest mode |
| M8 | Platform AI teaser | v2.1 | `ai-proxy` Edge Function (owner key server-side), per-user metering + $1 verified cap, rate limits, usage meter UI, exhaustion alert + paywall + BYO escape hatch |
| M9 | Payments (hybrid) | v2.2 | Paddle hosted checkout (subscription + top-ups), signature-verified webhooks → entitlements/credit, Settings → Account & Billing |
| M10 | Graphics/UI | v2.3 | design system, dark mode, code-splitting, mobile bottom nav, flashcard polish, `progressStats` engine + dashboard stats zone |
| M11 | Learning depth | v2.4+ | mistake bank, custom scenario builder, tutor chat, sentence listening, cloze reviews, insights page, vocab placement, free writing |

## Per-milestone detail

### M4.2 — UX cleanup (v1.0.1)
- Dashboard "Setup checklist" card moves to the top of Settings as a **Getting started** card
  (auto-hides when complete); dashboard keeps a single welcome line linking to it until done.
- Dashboard **"What's next" focus**: one primary CTA chosen by logic — no placement yet →
  placement; new words left → continue vocab; due > 0 → review; else grammar of the day.
- **API-key manuals**: per-provider collapsible step-by-step guides in Settings → AI Model
  (GLM bigmodel.cn incl. "z.ai keys won't work" warning; OpenAI; DeepSeek).
- Remove the static **Roadmap card** from the dashboard (repo docs are the roadmap now).
- **Version footer** in Settings (`v1.0.1` from `src/version.ts`). Remove dead `MilestoneStub`.

### M5 — B2 content (v1.1)
- M5.1 vocab corpus 1,028 → **~2,000 words** (B2-weighted frequency lists; add ~125 common
  **phrases** as learnable items; append-stable ids, rank-refresh seeding as in M1.1).
- M5.2 grammar 35 → **~50 topics** (B1 consolidation + B2 set: Konjunktiv II, Passiv variants,
  Nominalstil, subjektive Bedeutung von Modalverben, n-Deklination, …).
- M5.3 **+8–10 scenarios** (B1/B2 life situations: Arzttermin, Wohnungssuche, Bewerbungsgespräch,
  Behördengang, …). Content rules: proper orthography, no lorem German.

### M6 — Speech (v1.2)
- **TTS voice-quality fix**: `tts.ts` currently ranks voices by `de-DE` locale only → picks
  legacy SAPI/eSpeak robotic voices. Fix: quality-ranked selection (network/premium voices
  first) + **per-voice preview picker** in Settings → Speech.
- **Optional HD cloud TTS** (provider + pricing decided with owner at milestone start).
- **Hands-free voice conversation**: pure state machine `src/engine/voiceSession.ts` +
  silence detection + auto-TTS. Chrome/Edge full, Safari partial, Firefox typing fallback.

### M7 — Accounts (v2.0)
- Supabase project (free tier): Auth (Google + email/password, verification, reset), Postgres
  tables mirroring Dexie tables with **RLS per-user isolation** (owner: user_id, updated_at).
- Client: `src/sync/` — sign-in UI (Settings → Account + first-run prompt), session, sync engine
  (last-write-wins on `updatedAt`, existing fields), **"claim this browser's data"** flow
  (uploads local data to the new account on first login), sign-out, guest mode untouched.
- Supabase URL + anon key are public-by-design (`VITE_` env → bundled; safety = RLS).
- **Owner touchpoints (~25 min):** create Supabase project, Google Cloud OAuth consent,
  Resend account + SMTP creds into Supabase (click-by-click guides provided by the agent).

### M8 — Platform AI teaser (v2.1) ✅ SHIPPED (v2.1.0)
- Edge Function **`ai-proxy`** (Deno): verify JWT → check entitlement order (below) → forward
  to provider with the **PLATFORM key (server-side secret)** → meter actual cost from response
  token usage × price table (single config file) → persist usage → return. Client never sees
  the platform key. Over cap → `402` → client shows the paywall.
- **Entitlement/meter check order:** ① active Pro allowance → ② credit balance → ③ $1 free
  teaser (email-verified accounts only) → ④ 402 paywall. **BYO key skips all of it** (direct
  browser→provider, unchanged).
- Abuse guards: email verification required, per-user rate limit (~10 req/min), server-side cap.
- UI: persistent "Free AI credit: $0.63 / $1.00" meter; exhaustion alert + paywall card with
  "add your own key — free forever" escape hatch.
- **Entitlement layer** (config-driven, one module): every AI feature checks it; today's rule
  `byoKey → grants all, free`. This is the door for Dormant option #1.
- **Owner touchpoints (~10 min):** pick teaser provider, create its key, set as Edge Function
  secret (never in repo).
- **Open decision at M8 (deferred 2026-09-23, owner):** does the $1 teaser also cover **HD cloud
  TTS** (owner's Google key via the same proxy, metered in characters)? Facts for that call:
  Google TTS free tier = 1M Neural2 chars/month **per billing project** (shared across all
  teaser users ≈ ~3,000 spoken replies; then $16/1M ≈ ~200 replies per $1 of meter); user's own
  Google key stays free regardless (M6.2 BYO path, unchanged). Decide from real teaser usage.
  → RESOLVED 2026-09-23: **HD TTS included**, priced $0/char (free tier covers it) with a
  200k chars/month server-side guard. Teaser chat provider: `gpt-5-mini` (owner daily driver;
  `glm-4.5-flash` swap later = constants change, see `entitlement.ts` + the function header).

### M9 — Payments, hybrid (v2.2) — **✅ CODE COMPLETE 2026-09-21 (v2.4.0), awaiting owner sandbox deployment**

> Built: `paddle-checkout` + `paddle-webhook` Edge Functions, migration `0003_billing.sql`,
> ai-proxy monthly-allowance + per-plan-voice-cap upgrade, `src/llm/plans.ts` catalog,
> `src/billing/paddle.ts` signature twin, Settings → Account & Billing UI. Owner deploy
> checklist (≈30 min): run 0003 in the SQL editor · create the 4 sandbox prices (Basic/Plus ×
> monthly/annual) · set secrets PADDLE_API_KEY, PADDLE_ENV=sandbox, PADDLE_WEBHOOK_SECRET,
> PADDLE_PRICE_MAP, PADDLE_SANDBOX_TEST_USER (own uuid) · deploy `paddle-checkout` (JWT ON) and
> `paddle-webhook` (JWT **OFF**) + register its URL as a Paddle notification destination ·
> re-paste ai-proxy. Then E2E test: subscribe → webhook grants → meter shows plan → cancel in
> portal → downgrade. Go-live = live secrets + PADDLE_ENV=live + live price IDs, nothing else.

- Paddle (preferred, MoR → EU VAT handled) or Stripe: **hosted checkout** products for (a) Pro
  monthly subscription (includes monthly allowance) and (b) top-ups. Redirect flow only.
- Webhook Edge Function: verify PSP signature → subscriptions set `plan/validUntil`; one-time
  purchases add `creditCents`. Client refetches → unlock. No card data in our code (SAQ-A).
- Settings → **Account & Billing**: current tier, usage bar, credit balance, manage/cancel
  (PSP-hosted portal), "add your own key instead" hint.
- Prices/allowances in the single config file. Dormant SKU slot: `byo-supporter` plan type.
- **Owner touchpoints (~20 min + approval wait):** PSP account, products, webhook secret.
- **Sandbox-first (owner decision 2026-09-21):** registration done; live approval not yet applied
  for. Build + demo the whole flow on the Paddle **sandbox** (no approval needed, test cards,
  simulated renewals/cancellations/refunds), apply for live approval in parallel, then swap
  sandbox → live credentials and recreate products at go-live. Guard: sandbox webhook writes
  must never grant real entitlements to real users (env-flag / entitlement `source` column;
  owner's own account only for testing).
- **Membership structure v3 (2026-09-21 — owner instinct + GPT analysis + cost math, merged):**
  - **Free** — unchanged: full core app + $1 metered AI teaser + BYO key free forever. At M9 the
    platform HD voice shrinks to a small taste (~20k chars/mo ≈ 65 spoken replies — shows what
    Plus sounds like); browser voices + own Google key stay free & unlimited.
  - **Basic — €3.99/mo · €29.99/yr (~37% off):** the managed AI tutor WITHOUT platform HD voice
    (browser voices + own Google key free, unlimited). AI budget: $2/mo on the gpt-5-mini
    backend (≈1,400 tutor turns) or $3 on the coding-plan backend. Owner idea — the paywall
    boundary sits exactly on the app's only real marginal cost (voice), so Basic costs ≈ €0–2
    → ~44–95% margin, near-pure ARPU.
  - **Plus — "Most popular" badge — €5.99/mo · €49.99/yr (~30% off):** everything Basic +
    platform HD voice (~150–200k chars/mo ≈ 500–650 spoken replies) + bigger AI budget
    ($3.5/mo mini-backend / $5 coding-plan backend).
  - **Pro — dormant until M11 fills it — €9.99/mo · €89.99/yr (~25% off):** larger voice
    allowance + premium tutoring features (M11) + priority support. Only displayed once it has
    real content (selling promises = refunds); until then Basic/Plus pricing cards anchor
    each other.
  - **Lineage:** two-tier + anchoring + badge from the GPT analysis; tier split on the voice
    boundary from the owner (cost-aligned — HD TTS at $16/1M chars is the only real marginal
    cost, chat ≈€0 on the coding plan); annual discounts 30–37% (industry norm; GPT's 17%
    rejected — cash flow + churn-kill). Budgets are FAIR-USE ceilings: median member costs
    ~€0.3–0.7 (~85–90% net margin), a pathological max-out member ≈ break-even by design
    (bounded, never runaway, never deeply negative).
  - **Backend note (2026-09-21):** platform chat currently runs **gpt-5-mini on
    OPENAI_PLATFORM_KEY** (ZAI_PLATFORM_KEY not set). Swap to the GLM Coding Plan = set the
    secret + redeploy ai-proxy; all client meters auto-adopt (M8.1). Per-turn on gpt-5-mini ≈
    $0.0014 (≈700 turns per $1). If a cheaper "-mini" refresh ships, it's the same
    secrets/config swap.
  - **Kept from earlier drafts:** AI Credit Pack top-ups (€2.90 = $3 / €5.90 = $7, 6-month
    validity) = M9 phase 2 · BYO stays 100% free forever · `byo-supporter` SKU dormant · no
    free trial (14-day refund + $1 teaser instead) · EUR pricing, Paddle-as-MoR handles VAT.
  - **No LLM-API affiliate program exists** (checked 2026-09-21: OpenAI/Anthropic/Google/z.ai
    all have none for API keys) — monetizing key-needing users = the managed tiers above;
    OpenRouter BYO-with-markup is the only real middleman mechanism (extra signup friction —
    dormant idea).
  - **AI Credit Pack (top-up, one-time) — €2.90 = $3 credit / €5.90 = $7 (bonus), 6-month
    validity.** For "no subscription" learners post-teaser. Phase 2 of M9 (optional at launch).
  - **BYO stays 100% free** — never paywall what users power themselves; dormant
    `byo-supporter` SKU (e.g. €1.90/mo tip jar) stays dormant.
  - **No free trial at launch** — the $1 teaser + published 14-day refund policy (/#/refund)
    already serve as the risk-free try. Rationale: fewer moving parts, honest funnel.
  - **EUR pricing** — EU-first audience, Paddle-as-MoR handles VAT.
  - **Allowance mechanics + worst-case math (2026-09-21):** chat ≈ $0.0014–0.002/turn
    (gpt-5-mini / glm-4.6 nominal — ≈€0 real on the GLM Coding Plan); **HD TTS = the real
    cost** at $16/1M Neural2 chars ≈ 200–390 spoken replies per $1 beyond Google's shared
    1M-char/mo free tier; per-turn grading is already inside the turn JSON; on-demand
    explanations ~$0.0002–0.0004 (LLM-cached, repeats free). Allowances are enforced by the
    existing M8.1 metering engine — tiers are config, not code.

### M10 — Graphics/UI (v2.3)
- Tailwind design system (tokens/typography/spacing), dark mode, route-based code-splitting
  (lazy pages), mobile bottom navigation, flashcard/learning-surface polish.
- **`src/engine/progressStats.ts`** (pure, tested) + dashboard **stats zone** (progress ring,
  activity heatmap, forecast) — progress visuals only (no gamification), but shaped so a future
  `engagement.ts` layer can decorate it (Dormant option #2).

### M11 — Learning depth (v2.4+, order re-negotiable with owner)
Mistake bank (from `drillAttempts`/matcher failures) · custom scenario builder · tutor chat ·
sentence listening · cloze reviews · insights page · vocab placement re-take · free writing
with correction.

Deferred design decisions recorded 2026-09-21 (owner-approved direction, build here):

- **Mistake explanations — on demand, hybrid.** The conversation mistake pills
  (`said → corrected (type)`) become tappable → popover (click/tap, NOT hover — mobile-first
  PWA has no hover, and hover needs a separate a11y path). Popover shows: (a) an instant
  **static micro-lesson** per `MistakeCategory` (gender/case/word-order/vocab/verb-form/
  other) — free, offline, deterministic, testable; plus (b) an **Explain** button →
  `explainMistake()` LLM call (2–3 sentences specific to that sentence, link the matching
  grammar topic if one exists) routed through the existing LlmCache (~$0.0002/call on paid
  tiers, ≈free on GLM flash; repeat explanations = cache hits = free). Deliberately NOT
  baked into the conversation-turn schema — always-on explanations would add ~30–60% output
  tokens to every turn and slow/price up the base UX.
- **Two-phase streaming turns.** Today nothing renders until the whole turn JSON passes
  validation → that's the perceived latency. Fix: stream the tutor reply text first
  ("tutor is typing…" within ~1 s), then a second cheap background call grades
  mistakes/translation and patches the turn. Cost ~1.5× tokens per turn. Pair with TTS
  speaking sentence-by-sentence once streamed.
- **Cheap speed levers (when wanted, no spend):** cap tutor reply length in the prompt
  (≤2 short sentences) + trim conversation history to the last ~10–12 turns. Owner decision
  2026-09-21: do NOT buy a faster paid tier now — current latency is acceptable; revisit
  with real usage data.

## Payments reality check (recorded so nobody re-litigates it)
Card processing cannot be self-developed or free — card networks require a certified PSP
(PCI-DSS). The realistic floor is $0-fixed-cost + per-transaction fees:
Paddle/LemonSqueezy ~5% (merchant of record, handles EU VAT — simplest legally for a solo EU
developer), Stripe ~1.5% + €0.25 EU cards (lowest fees, VAT/registration is the seller's work),
PayPal ~2.9% + fixed. At €2–5 price points the fee gap is cents per sale → legal simplicity
wins → Paddle.

## Dormant options (owner may activate later — deliberately not precluded)

1. **Mild subscription for BYO-key users.** Today BYO = everything free. The M8 entitlement
   layer makes future charging a **config change** (e.g. conversations/voice → Pro while drills
   stay free with any key) — no rework. Technical limit to know: BYO calls go direct
   browser→provider, so they **cannot be metered** — only feature-level gating is possible.
   If true BYO usage caps are ever wanted, the designed path is routing BYO calls through
   `ai-proxy` with the user's key sent per-request, used transiently, never stored. The M9
   billing schema reserves a `byo-supporter` plan type.
2. **Gamification.** Not built, deliberately not precluded: daily activity is recorded so that
   streaks/XP are computable retroactively from existing logs; M10's stats zone + progressStats
   engine are designed to be decoratable by a future `src/engine/engagement.ts` (XP, badges,
   streaks) without UI rewrites. Do NOT add XP columns or badge tables until the owner
   activates this.

## Risks & mitigations
- Supabase free projects pause after 7 days of total inactivity → fine with real users; else
  keepalive ping or $25/mo Pro.
- Paddle seller approval takes days–weeks → apply at M9 start, build against Stripe fallback if
  delayed.
- Provider price tables drift → single config file, revisit at M9.
- `ai-proxy` adds ~100–300 ms latency to platform AI calls → acceptable; BYO path unaffected.
- Teaser abuse → verified email + rate limit + server-side cap (above).

## Phase 2 security rules (extend AGENT.md)
- Platform LLM key, PSP webhook secrets, SMTP creds: ONLY as Supabase Edge Function secrets
  (dashboard/CLI). Never in repo, client, docs, commits, or chat echoes.
- Supabase anon key + project URL are public-by-design; data safety comes from RLS policies.
- Webhooks verify PSP signatures before mutating entitlements.
- Pre-commit secrets scan (AGENT.md) unchanged and still mandatory.


