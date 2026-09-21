# PHASE2_PLAN.md — DeutschMeister Phase 2 (v1.0 → v2.x), milestones M4.2 → M11

> Companion to `AGENT.md` (conventions + verification gate) and `ROADMAP.md` (live ledger).
> This file holds the owner-approved Phase 2 plan: locked decisions, architecture, sequencing.
> Resume protocol for a fresh agent: read `AGENT.md` → `ROADMAP.md` → this file, run the gate
> (it must be green), then build the next unchecked milestone below. Approved 2026-09-21.

## Where we are (v1.0.0, live)

M0–M4 complete. Local-first, single-user PWA: 1,028-word vocab corpus + SM-2 SRS, 35 grammar
topics + placement, word bank, Speak & Listen drills, 11 AI conversation scenarios, AI
drills/explain/examples — all with the user's own API key (GLM bigmodel.cn / OpenAI / DeepSeek).
Export/import backup, offline shell, CI→Pages deploy. Deterministic core needs no key, no net.

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
   `gpt-4o-mini`, `deepseek-chat`).
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

### M8 — Platform AI teaser (v2.1)
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

### M9 — Payments, hybrid (v2.2)
- Paddle (preferred, MoR → EU VAT handled) or Stripe: **hosted checkout** products for (a) Pro
  monthly subscription (includes monthly allowance) and (b) top-ups. Redirect flow only.
- Webhook Edge Function: verify PSP signature → subscriptions set `plan/validUntil`; one-time
  purchases add `creditCents`. Client refetches → unlock. No card data in our code (SAQ-A).
- Settings → **Account & Billing**: current tier, usage bar, credit balance, manage/cancel
  (PSP-hosted portal), "add your own key instead" hint.
- Prices/allowances in the single config file. Dormant SKU slot: `byo-supporter` plan type.
- **Owner touchpoints (~20 min + approval wait):** PSP account, products, webhook secret.

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


