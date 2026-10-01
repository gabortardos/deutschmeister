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

> **Step-by-step deploy guide with screenshots-level detail: `docs/M9_DEPLOY.md`** (answers
> the owner's questions about each dashboard step, Paddle products/prices/keys, secrets,
> function deploys, and the sandbox E2E test).

> Built: `paddle-checkout` + `paddle-webhook` Edge Functions, migration `0003_billing.sql`,
> ai-proxy monthly-allowance + per-plan-voice-cap upgrade, `src/llm/plans.ts` catalog,
> `src/billing/paddle.ts` signature twin, Settings → Account & Billing UI. **v2.4.1 fix
> (2026-09-21, after the owner hit 400 transaction_default_checkout_url_not_set):** Paddle
> Billing has no API-hosted checkout page — checkout.url is just <default payment link>?_ptxn,
> so purchases now open as a Paddle.js overlay in-page (`src/billing/paddleClient.ts`, lazy
> loaded on first subscribe; new secret `PADDLE_CLIENT_TOKEN`; Paddle dashboard default
> payment link must be set — M9_DEPLOY Step 2B). Owner deploy checklist (≈30 min): run 0003
> in the SQL editor · create the 4 sandbox prices (Basic/Plus × monthly/annual) · set the
> default payment link (Step 2B) · create a client-side token (Step 3) · set secrets
> PADDLE_API_KEY, PADDLE_CLIENT_TOKEN, PADDLE_ENV=sandbox, PADDLE_WEBHOOK_SECRET,
> PADDLE_PRICE_MAP, PADDLE_SANDBOX_TEST_USER (own uuid) · deploy `paddle-checkout` (JWT ON)
> and `paddle-webhook` (JWT **OFF**) + register its URL as a Paddle notification destination ·
> re-paste ai-proxy. Then E2E test: subscribe → overlay checkout → webhook grants → meter
> shows plan → cancel in portal → downgrade. Go-live = live secrets (incl. live client
> token) + PADDLE_ENV=live + live price IDs, nothing else.

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
  - **Pro — activating with M11.10 (owner decision 2026-09-29) — €9.99/mo · €89.99/yr (~25% off):**
    larger voice allowance (~300k chars/mo) + the expensive learning options: streaming tutor
    replies, full-rewrite writing grading, 🎲 LLM writing prompts, 250-word / 5-a-day writing.
    Unhide only when M11.10 ships (selling promises = refunds); until then Basic/Plus pricing
    cards anchor each other. Owner: create the Paddle products (sandbox first) + PADDLE_PRICE_MAP.
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
  - **Shipped (M9.8 / v2.7.0):** AI Credit Pack top-ups (€2.90 = $3 / €5.90 = $7, 6-month
    validity) · `byo-supporter` shipped as M9.6 (€11.99/yr, 30-day BYO trial — old "free forever" superseded 2026-09-21) · no
    free trial (14-day refund + $1 teaser instead) · EUR pricing, Paddle-as-MoR handles VAT.
  - **No LLM-API affiliate program exists** (checked 2026-09-21: OpenAI/Anthropic/Google/z.ai
    all have none for API keys) — monetizing key-needing users = the managed tiers above;
    OpenRouter BYO-with-markup is the only real middleman mechanism (extra signup friction —
    dormant idea).
  - **AI Credit Pack (top-up, one-time) — €2.90 = $3 credit / €5.90 = $7 (bonus), 6-month
    validity.** For "no subscription" learners post-teaser. Shipped as M9.8 / v2.7.0.
  - **BYO Supporter membership (owner decision 2026-09-21 — supersedes "free
    forever")** — 30-day free trial from the first saved key, then €11.99/year
    (shipped as M9.6 / v2.6.0, Paddle plan `byo-supporter`, zero allowances: chat
    AI + HD voice run on the user's own keys; the system itself is the product).
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
- **Shipped M10.1 (v2.8.0): progressStats engine + dashboard stats zone.** Remaining M10
  slices: design tokens/dark mode, route-based code-splitting, mobile bottom nav, flashcard polish.
- **Shipped M10.2 (v2.9.0): CSS-var design tokens + dark mode** (`bg-surface` semantic token,
  `src/state/theme.ts` with system/light/dark, anti-flash bootstrap, Settings → Appearance,
  header quick toggle). Remaining M10 slices: route-based code-splitting, mobile bottom nav,
  flashcard polish.
- **Shipped M10.3 (v2.10.0): code-splitting** — React.lazy routes (15 chunks), async
  `getSupabase()` factory (supabase-js leaves the eager bundle; guest builds never download it),
  react/db/content vendor chunks. Initial JS −35% gzip; >500 KB build warning gone.
- **Shipped M10.4 (v2.11.0): mobile bottom nav** — bottom tab bar below `sm` (Today/Vocab/
  Review/Talk + More sheet for Speak&Listen/Grammar/Word bank/Settings), header nav desktop-only,
  iOS safe-area padding, theme-safe scrim.
- **Shipped M10.5 (v2.12.0): learning-surface polish — M10 complete** — keyboard-driven
  study/review (pure `engine/sessionKeys.ts`, +10 tests → 309/309), dm-reveal animation,
  Kbd hints, auto-focus inputs.

### M11 — Learning depth (v2.4+, order re-negotiable with owner)
Mistake bank (from `drillAttempts`/matcher failures) · custom scenario builder ·
sentence listening · cloze reviews · insights page · vocab placement re-take · free writing
with correction.

**Shipped:** mistake bank → M11.1 (v2.13.0, see ROADMAP): pure
`src/engine/mistakeBank.ts` collectors + `/#/mistakes` page aggregating open
drill mistakes (latest attempt wrong), lapsed words, and tutor corrections.
Practice-my-mistakes → M11.2 (v2.14.0): pure `pickPracticeDrills` /
`pickPracticeWords` + "Practice these drills / words" sessions on the same
page, reusing DrillRunner and the vocab StudySession.
Mistake explanations → M11.3 (v2.15.0): the hybrid design below, built as
specced (static micro-lessons + cached `explainMistake`).
Custom scenario builder → M11.4 (v2.16.0): `generateScenario` LLM contract +
"Create your own scenario ⭐" card on the Conversation page (describe →
generate → preview → `addCustomScenario`).
Sentence listening → M11.5 (v2.17.0): pure `engine/sentenceListening.ts`
dictation grading + "✍️ Sentence dictation" session mode on the Speak &
Listen page (TTS speaks a learned word's example sentence, learner types it;
offline, feeds SM-2).
Cloze reviews → M11.6 (v2.18.0): pure `engine/clozeReviews.ts` gap finding +
distractor picking + "🧩 Cloze review" session on the Vocab page (example
sentences with the word gapped, 4 same-theme choices; offline, feeds SM-2).
Insights page → M11.7 (v2.19.0): pure `engine/insights.ts` skill aggregation
(accuracy by drill type & CEFR level, vocab coverage per level, conversation
correction types) + `/#/insights` page with streak badges and top-5 trouble
words; offline, local data only.
Tutor chat → M11.8 (v2.20.0): pure `engine/tutorChat.ts` + `tutorChatTurn`
contract + `/#/tutor` page (Free chat / Ask-the-tutor, silent corrections
through the existing mistake pipeline, 12-turn history cap, session resume).

Owner decisions recorded 2026-09-29 — **"both ways"**: default (cheap) versions
for the existing tiers + the Pro tier activated as the home of the expensive
options.

- **M11.8 tutor chat — shipped v2.20.0** as the default version for ALL tiers
  within their existing metered budgets (no plan changes, no streaming).
- **M11.9 free writing — shipped v2.21.0**: static per-CEFR prompt bank (8
  tasks/level) + correction list grading (`MistakeSchema` + existing Explain ✨
  buttons, NOT a full rewrite), ~120-word soft cap (400 hard block), 1 piece/day
  free · 3/day Basic/Plus · 10/day BYO (own key, own tokens); counts toward
  streak + Insights. Storage: Dexie v2 `writingPieces`, device-local — cloud
  sync needs migration `0005_writing_pieces.sql` + a sync adapter, deferred to
  the next owner-SQL batch.
- **M11.10a Pro writing features — shipped v2.22.0, dormant**: ✨ AI writing
  prompts (contract #9 `generateWritingPrompt`, never cached — variety is the
  point) + full-rewrite grading (contract #10 `rewriteWriting`, cached like
  gradeWriting), gated by `writingAiExtrasEnabled(route, plan)`: Pro on
  platform, **always on for BYO** (live immediately — own key, own tokens).
  Rewrite persists as `WritingPiece.rewrite?` (no Dexie bump). Pro plan copy
  made real; Pro `ttsCharCap` aligned to 300k (`paddle-webhook` `PLANS.pro`
  aligned in-repo — reaches production when the owner re-pastes in M11.10b).
- **M11.10b Pro activation (owner-gated)**: create Pro products in Paddle
  (sandbox first) → add to `PADDLE_PRICE_MAP` in both Paddle functions →
  re-paste both (includes the 300k webhook alignment) → build streaming
  tutor replies (Pro-first preview; roll out to everyone later if usage data
  allows) → remove `hidden: true` from the Pro plan entry. 250-word cap + 5
  pieces/day already wired since M11.9; writing stays capped even on Pro —
  a 250-word graded text ≈ 800–1,200 output tokens, unlimited would eat the
  budget.

- **M12 content milestones (user-directed 2026-09-29 — next after M11.10a).**
  Baseline measured: vocab **1,902** words (A1 381 · A2 345 · B1 302 ·
  B2 874 · C1/C2 0) → target **5,000** (+3,098); grammar **50** topics
  (A1 13 · A2 12 · B1 10 · B2 15 · C1/C2 0). Words are assigned to the
  level where they become useful (everyday-usefulness order across A1–C2),
  NOT a per-level quota:
  - **M12.1 C1 grammar — SHIPPED (v2.23.0, 2026-09-29)**: `src/content/grammar/c1.ts`,
    12 topics × 8 drills (syllabus 50 → 62, A1–C1). The original candidate list
    (Konjunktiv II deep, Konjunktiv I, Passiversatz, Nominalisierung, erweiterte
    Attribute, Genitivpräpositionen, Futur II, subjektive Modalverben,
    N-Deklination, Präpositionalverben, präpositionale Relativsätze, je…desto)
    was de-duplicated against what B2/B1 already ship (Konjunktiv I · KII
    Vergangenheit · subjektive Modalverben · N-Deklination · Nominalstil ·
    Genitiv-Präpositionen · Passiversatz · je…desto = B2; Verben mit
    Präpositionalergänzung = B1), keeping Konjunktiv-II-Irreales (als ob),
    erweiterte Attribute, Futur II and präpositionale Relativsätze, and adding
    Höflichkeits-KII, Bekommen-Passiv, Korrelat-es, Konnektoren-Nuancen
    (sofern/geschweige denn stay reserved for C2), Gerundiv, Verben mit Genitiv,
    Satzklammer/Ausklammerung and Appositionen. Append-stable ids `g-c1-01…` ·
    order 51–62; counts test 62, id regex `g-[abc][12]`.
  - **M12.2 C2 grammar — SHIPPED (v2.24.0, 2026-09-29)**: `src/content/grammar/c2.ts`,
    8 topics × 8 drills (syllabus 62 → 70, A1–C2). The original candidate list
    (Nominalstil vs Verbalstil · Inversion/Satzgliedstellung · Modalpartikeln ·
    feste Präpositionalverben + Idiomatik · Konjunktiv I in Presse · Ellipsen ·
    gehobene Konnektoren · produktive Wortbildung) was de-duplicated against
    shipped content: Konjunktiv I in Presse = `b2-konjunktiv-i`, Nominalstil =
    `b2-nominalstil`, Präpositionalverben/Idiomatik = `b1-verben-mit-praepositionen`
    + `b2-funktionsverbgefuege` — all three dropped. Shipped: Modalpartikeln
    (doch/ja/mal/eben/halt/schon/wohl), konditionale Inversion ohne wenn
    (Hätte ich…/Sollte es…), gehobene Konnektoren (sofern · insofern…als ·
    geschweige denn — reserved for C2 since M12.1), Ellipsen,
    Wortbildungs-Nuancen (lösbar/löslich · -bar/-fähig · zer-/ent-), nur
    prädikative Adjektive (egal/leid/schuld/quitt/gewachsen + case government),
    kaum…als + sobald/sowie, Präpositionspaare (von…aus · auf…hin ·
    aus…heraus · um…willen). Append-stable ids `g-c2-01…` · order 63–70;
    counts test 70 (C2: 8); id regex already matched c2.
  - **M12.3–M12.7 vocab → 5,000 in five batches (~600/batch)**:
    usefulness-ordered themes (Haushalt, Essen gehen, Gesundheit/Arzt,
    Arbeit/Bewerbung, Reisen/Verkehr, Behörden/Ämter, Gefühle/Charakter,
    Medien/Technik, Natur/Umwelt, Gesellschaft, Wirtschaft, Wissenschaft,
    abstrakte Verben …) — each word de/en + Beispiel + level-by-usefulness;
    vocab tests (uniqueness, required fields) extended; each batch ships
    behind the standard gate.
  - **M12.3 vocab batch 1 — SHIPPED (v2.25.0, 2026-09-29)**: +559 words
    (1,902 → 2,461; A2 +104 · B1 +229 · B2 +130 · C1 +96) over the first
    four planned themes: Haushalt/Home, Essen gehen/Food, Gesundheit/Arzt/
    Health, Arbeit/Bewerbung/Work. First C-level vocab band — new
    `src/content/vocab/c1.ts` (`w-c1-…` ids, ranks continue after B2).
    Rows appended at the end of each level file → ids append-stable;
    `ensureVocabSeeded` bulkPuts the whole corpus, so new words AND the
    refreshed frequencyRanks propagate on next launch. Candidates were
    pre-de-duplicated against the existing 1,902 headwords with a
    throwaway tuple-parser script (116+64+7 collisions dropped — much of
    the "obvious" household/food/work vocab already existed; one manual
    leak, Küche, was caught by the uniqueness test and removed). Vocab
    tests extended for C1 counts + C2-zero guard. Remaining to 5,000:
    +2,539 over batches 2–5 (~635/batch, themes per the list above).
  - **M12.4 vocab batch 2 — SHIPPED (v2.26.0, 2026-09-29)**: +634 words
    (2,461 → 3,095; A2 +120 · B1 +226 · B2 +224 · C1 +64) over
    Reisen/Verkehr (Travel + Transport) and Behörden/Ämter/Recht
    (Authorities + Law); the C1 band is legal/administrative register.
    Append-stable rows; all corpus invariants hold via the existing
    test contract (counts derive from the row arrays). Remaining to
    5,000: +1,905 over batches 3–5 (~635/batch).
  - **M12.5 vocab batch 3 — SHIPPED (v2.27.0, 2026-09-29)**: +481 words
    (3,095 → 3,576; A2 +72 · B1 +238 · B2 +99 · C1 +72) over
    Gefühle/Charakter (Emotions +142, new Character theme +108) and
    Medien/Technik (Media +137 · Technology +94); the C1 band adds
    psyche/character depth, media critique and AI register. Append-stable
    rows; corpus invariants hold via the existing test contract. Remaining
    to 5,000: +1,424 over batches 4–5 (~712/batch — the themes this batch
    drew from were already half-covered, so batches 4–5 carry a slightly
    larger share of the 5,000 target).
  - **M12.6 vocab batch 4 — SHIPPED (v2.28.0, 2026-09-29)**: +712 words
    (3,576 → 4,288; A2 +88 · B1 +137 · B2 +386 · C1 +101) over Natur (Nature),
    Umwelt (Environment, new theme) and Gesellschaft (Society). B2 nature
    covers landscape/weather/animals/plants/processes/outdoor; environment
    covers Nachhaltigkeit/energy/waste/water/climate plus an adjective band
    (umweltbewusst, erneuerbar…); C1 adds abstract register (Kipppunkt,
    Renaturierung, Narrativ, Vergangenheitsbewältigung, Schuldenbremse…);
    B2 society spans politics/state, welfare/demographics, values/culture,
    change/finances/religion. Candidates pre-de-duplicated against the
    pre-session headword dump (54 collisions dropped); a throwaway
    vite-node checker enforced row shape (leading null article on
    verbs/adjectives), global headword uniqueness, sentence containment and
    plural-only-on-nouns before the suite ran green. Remaining to 5,000:
    +712 over batch 5.
  - **M12.7 vocab batch 5 — SHIPPED (v2.29.0, 2026-10-01)**: +712 words
    (4,288 → 5,000 — corpus target REACHED; A2 +88 · B1 +140 · B2 +330 ·
    C1 +154) over Wirtschaft (Economy: banking/shopping basics →
    trade/companies/jobs → markets, macro, finance, corporate → C1
    state-finance register: Anleihe, Leitzins, Schuldenkrise,
    Steuergerechtigkeit, Einkommensschere …), Wissenschaft (Science:
    school/study basics → university + methods → disciplines, physics/
    chemistry/biology, space, studies → C1 abstract register:
    Reproduzierbarkeit, Paradigma, Peer-Review, Evidenz,
    Relativitätstheorie …) and abstrakte Verben (~120 verbs/phrases from
    B2 verwirklichen / in Kauf nehmen / Rechnung tragen up to C1
    gewähren / entkräften / konterkarieren / verharmlosen). New rows
    reuse the existing Economy/Science/Abstract theme labels. Candidates
    were verified against the 4,288-word baseline in-process (throwaway
    vite-node checker: shape, uniqueness, noun-in-sentence,
    plural-only-on-nouns, apostrophe scan of the new sections);
    55 collisions surfaced across 10 verification rounds and were
    swapped for verified-free words; the total lands exactly on 5,000
    with counts derived from the row arrays (no test edits needed).
  - **M12.8 A1–B2 grammar completeness audit — SHIPPED (v2.30.0,
    2026-10-01)**: syllabus diffed against Goethe A1–B2 checklists.
    Verdict: A1 ✓ complete · B2 ✓ complete · the real gaps sat in A2/B1.
    Filled: (1) `a2-adjektivendungen` broadened to the full declension
    system (weak after der-words · mixed after ein-words · strong
    without article — Nom/Akk/Dativ + plural, +5 drills); (2)
    `a2-praeteritum-modal` broadened to full Präteritum forms (weak -te,
    strong verbs, speech-vs-writing usage, +4 drills); (3) NEW
    `b1-perfekt-vs-praeteritum` (register/usage contrast — the M14
    lessons-pilot topic); (4) NEW `b1-temporalsaetze` (bevor/nachdem/
    während + tense sequencing with Plusquamperfekt/Perfekt); (5) NEW
    `b1-falls` (real conditionals, border to Konjunktiv II); (6) NEW
    `b1-damit-umzu` (same-subject um…zu vs different-subject damit).
    B1 10 → 14 topics, syllabus 70 → 74, +39 drills. **Seeding fix**:
    `ensureGrammarSeeded` was insert-only — broadened explanationMd and
    the shifted global `order` values would never have reached existing
    installs; it now upserts the full seed syllabus (same pattern as
    `ensureVocabSeeded`; user/LLM drills untouched — different ids).
    Deferred gaps (for M16 lesson-batch authoring): obwohl/trotzdem,
    Wortbildung-Basics, Ordinalzahlen, Reflexivverben mit Präposition,
    unbestimmte Pronomen (jeder/manche/alle). APP_VERSION 2.25.1 →
    2.30.0 (grammar releases bump the visible version; vocab batches
    M12.4–7 had not).
  - **M12.9 vocab scope picker + session skip (owner request 2026-10-01)**:
    **SHIPPED 2026-10-01, v2.31.0 (tag `m12.9`)** — built as specced, plus:
    custom words always pass the scope (deliberate user additions);
    `skipKeyAction` added to sessionKeys so the `S` key is pure and tested
    (StudySession skips at any pre-completion phase — the live typing input
    is guarded so 's' stays in the answer; ReviewPage '⚡ Known' is
    input-focus-guarded the same way); `normalizeVocabScope`
    garbage-guards the persisted value (the field rides the existing
    `app_settings` sync row); WordBankPage got a 🎯 "Focus scope" toggle
    chip and Settings→Learning a read-only mirror + link. Gate 419/419
    (+20 tests). Original spec below.
    **v2.31.1 fix (owner bug report: "click C1, still get A1 words")** —
    the empty-plan-only re-plan rule made the filter decorative whenever a
    plan was already built at startup. A scope change now rebuilds TODAY's
    queue immediately: new pure `replanTodayQueue` (lessonPlanner) keeps
    words already studied today in the queue (they still count toward the
    goal; the session runner skips them — no double-serve) and tops up the
    remaining slots with fresh in-scope words; `replanTodayLog` (lessonRepo)
    preserves `drillsDone`; store.patchSettings runs it on every vocabScope
    patch. +4 tests → 423/423.
    two learning-flow upgrades over the 5,000-word corpus.
    (a) **Word-focus filter** — users choose which slice of the corpus to
    learn: new persisted setting `vocabScope` (levels: CefrLevel[] +
    themes: string[]; empty = all), pure engine
    `src/engine/vocabScope.ts` (`applyVocabScope()`, unit-tested) wired
    into `buildLessonPlan`, `nextUnseenWords`, practice/cloze draws and
    the "unseen left" count; picker UI (level + theme chips with live
    "N of 5,000 words selected" counts) on VocabPage, mirrored in
    Settings→Learning; WordBankPage reuses it as a quick filter. The
    batches shipped as themes (Health, Law, Economy, Science,
    Environment …), so the theme filter IS the batch picker — no
    per-row batch metadata (locked decision).
    (b) **Session skip** — in StudySession (intro/choice/type) a
    "Known — skip" action (+ `S` key) marks the word known (SM-2 quality
    5 via `markWordKnown`) and advances immediately past the remaining
    drill steps; skipped words appear in the session summary and never
    count as wrong; ReviewPage gets an equivalent easy/skip. Kills the
    boredom of drilling words the user already knows ("errands through
    the material"). DoD: engine tests + full gate; v2.31.0.

## Phase 2 extension — owner-approved 2026-10-01 (M13–M17 + Phase 3 definition)

Owner vision (2026-10-01): guided user flow ("the road"), AI teacher (local-KB lessons
+ AI interactivity layer), an app-guide conversation, honest metering. Phase framing:
**Phase 2 = finish all major functions + complete the knowledge base + integrate the new
ideas. Phase 3 = deep testing, bug cleanup, menu/IA restructuring, refinement → ready
for real users (v3.0).** Locked decisions (do not re-ask — build):

1. **Build order:** M12.7 vocab batch 5 → M12.8 grammar audit → M12.9 vocab scope picker +
   session skip (owner-added 2026-10-01) → M13 metering honesty +
   owner-ops → role-drift quick win → M14 Lessons pilot → M15 Roadmap & guided flow →
   M16 lesson batches (A1→B1, then B2→C2) → M17 Guide assistant → writing-pieces sync
   + M11.10b (owner-gated). Phase 3 opens after.
2. **Lessons teach in English prose + rich German examples** (bilingual DE/EN from B2+).
3. **Lessons pilot = 3 topics:** A1 Präsens/personal pronouns & verb endings ·
   A2 adjective declension (`a2-adjektivendungen`, broadened to the full system
   by M12.8 ✓) · B1 Perfekt vs. Präteritum (created by the M12.8 audit as
   `b1-perfekt-vs-praeteritum` ✓). Three levels × three lesson shapes: paradigm table ·
   multi-table system · usage contrast. If the format survives all three, it scales.
4. **Conversation role-drift fix pulled into Phase 2** as a quick win after M13.
5. **Roadmap visual = vertical path** + ETA projection panel.

### M13 — metering honesty + owner ops (pre-test-user blocker)

Owner report: a Plus test account burned its whole AI allowance in a few trials while
real OpenAI spend was cents. Hypotheses, likelihood order: (a) metering uses
reserved/max tokens (maxTokens 900 + reasoning headroom) instead of the API-reported
`usage` tokens; (b) usage fields missing on some relay responses → worst-case fallback
estimate; (c) price-table drift / input-token double count; (d) presentation: TTS char
cap + chat budget conflated as "credits". Work: audit `ai-proxy` metering math against
OpenAI dashboard actuals → meter on real usage; single price source of truth; honest
"$X of $Y used" readout in Billing. Deliverable: consolidated **owner-ops checklist**
(Supabase Google provider + SMTP, Paddle products incl. dormant Pro, price-map pastes,
sandbox→live decision) — one click-by-click doc, prompted by the agent at that point.

**Shipped as v2.32.0 (2026-10-01).** Audit result: chat metering already bills the
provider's OWN `usage` tokens (never reserved/max tokens) and the price table matches
z.ai list prices ($0.6/$2.2 per 1M for glm-4.6 — re-verified on docs.z.ai). The burn
was REAL usage × under-sized allowances: $2/$3.5 were sized on gpt-5-mini input prices
and predate conversation practice (a 12-turn context turn ≈ $0.0027; a daily 15-turn
session ≈ $1.6/mo normal, heavy multi-session ≈ $4–6) → Basic broke at NORMAL use.
Fix (owner-approved same day): allowances retuned to fair-use guards — Basic $10 /
Plus $20 / Pro $40 (2–6× a heavy month); HD-voice caps UNCHANGED (the real per-user
cost + tier differentiator: Google TTS beyond the 1M-char free tier at $16/1M chars);
a missing-usage fallback now estimates chars/3.5 instead of billing $0 (books can
never silently under-count); Billing copy says "fair-use guard — normal learning
never reaches it". Cost basis for the profit model: platform chat runs on the owner's
flat GLM Coding Plan key → marginal $0 within its quota (capacity limit = prompts
per rolling 5-hour window, shared — watch 429s); profit table + the one-time
entitlement-row SQL bump + the consolidated runbook live in `docs/OWNER_OPS.md` (the
M13 deliverable). Owner deployment: re-paste paddle-webhook + ai-proxy, then run
OWNER_OPS §4 SQL once.

### Quick win — conversation role-drift fix (Phase 2, owner-approved pull-forward)

Bug: after several conversation turns the AI took over the user's role (AI became the
buyer). Fix: re-inject a compact role contract with every turn (or every N turns),
strengthen "you are X, never the learner's role" phrasing in the system prompt,
optional cheap reply-shape check; extend the service tests.

### M14 — Lessons pilot (teaching knowledge base, 3 topics)

- Lesson schema `src/content/grammar/lessons/*.ts`: hook/context (why it matters) →
  step-by-step teaching prose → tables worked through (ich/du/er …) → common mistakes
  & contrasts → 3–5 interactive comprehension checkpoints (offline-gradable,
  engine-checked) → printable cheat-sheet summary. Local, typed, free, testable — the
  deterministic "teacher at the blackboard".
- UI: "📖 Lesson" tab on GrammarTopicPage above the drills → "Now practice it" CTA into
  the existing drill round.
- AI stays interactive: "Ask about this lesson" (tutor chat preloaded with lesson
  context), fresh AI examples — never the base explanation.
- Authoring pipeline: fixed lesson template → agent drafts → **owner reviews the German
  didactics** (the one step that needs a teacher's eye). Owner supplies a German
  textbook (PDF preferred) or YouTube link → coverage map against the 74 topics +
  style/depth calibration (reference only — we write our own prose, keeps licensing clean).

### M15 — Learning Roadmap & guided flow ("be the flow")

- Onboarding v2: goal interview (why German, target level, horizon, minutes/day) →
  placement becomes a first-class step → the reveal: "here is your road to B1".
- `src/engine/curriculum.ts`: deterministic syllabus graph over existing content — per
  level, ordered units = vocab theme cluster + 1–2 grammar topics + suggested
  conversation scenario + milestone check (mastery gate reusing placement mechanics).
  Computes known / left / ETA ("at 15 min/day you reach A2 around …") — the visible
  investment→achievement path the owner described. Offline, testable, append-stable.
- `#/roadmap` page: vertical path (level bands → units → current position,
  completed/current/locked states) + ETA projection panel; Dashboard "What's next"
  becomes its mini version. "Today" becomes a guided session playlist (reviews → new
  words → lesson+drills → conversation) instead of menu picking.

### M16 — lesson batch authoring (content marathon)

All remaining topics A1→B1 first, then B2→C2; owner didactic review per level; lessons
become nodes on the M15 Roadmap.

### M17 — App-Guide assistant (conversation with the app itself)

- Tier 1: guide chat = static app-manual KB + live user context (level, streak, goal,
  untouched features, roadmap position); answers "how do I… / what should I do next";
  every reply ends with 1–3 action buttons (deep links: open cloze review, set 10
  words/day).
- Tier 2: the model returns structured intents (`navigate` / `set_goal` /
  `start_session` / `explain_feature`) via a zod contract (same pattern as
  `llm/services.ts`); the app executes with guardrails — plan changes always confirmed
  by a button. This is the "dynamic towards the user's requirements" layer.
- Prereqs: M13 metering sane first; better after M15 (the guide guides through the flow).

### Phase 3 definition (opens after M17 + writing sync + M11.10b)

Test-user program + deep QA + test-result analysis · bug bash · IA/menu redesign
(collapsible level sections, sticky level tabs, search/filter in Grammar — kills the
A1→C2 scroll, merged thin menus, mobile "More" cleanup) · UX/performance/a11y polish →
**v3.0 real-users-ready**. Dormant options stay dormant (gamification, C-level placement
items, `glm-4.5-flash` switch); C-level placement is revisited once C lessons exist.

Deferred design decisions recorded 2026-09-21 (owner-approved direction, build here):

- **Mistake explanations — on demand, hybrid — SHIPPED as M11.3 (v2.15.0).** The conversation mistake pills
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

1. **Monetizing BYO-key users — DONE as M9.6** (historical: until then BYO was free). The M8 entitlement
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


