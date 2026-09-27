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

## M9.6 BYO Supporter membership (v2.6.0)

Owner decisions 2026-09-21: yearly · €11.99/yr · NO platform HD-voice allowance (own Google TTS
key instead) — supersedes the old "BYO free forever" lock. Model: 30-DAY FREE TRIAL stamped the
moment a key is first saved (`AppSettings.byoKeyFirstSeenAt`, migration-free optional Dexie
column, idempotent write in `patchApiKey`), then the Paddle plan `byo-supporter` (ZERO platform
allowances — chat AI + HD voice stay on the user's own keys; a Supporter row replaces any prior
plan in `ai_entitlements`). Pure gate in `src/llm/entitlement.ts` (`byoAccess` /
`byoTrialDaysLeft` / `resolveAiRoute` `byoAllowed` fall-through: locked key → platform/guest
path) driven by `useByoGate()` in `src/state/useLlmDeps.ts`. UI: status banner in Settings →
AI Model (member ✓ / trial countdown / locked paywall), Supporter card on the Annual tab of
Account & Billing, welcome-tour + all stale "free forever" copy corrected. Edge: `paddle-checkout`
catalog + `paddle-webhook` PLANS row accept the plan. Owner sandbox steps: create product
"Supporter" €11.99/year → add the price id to `PADDLE_PRICE_MAP` on BOTH Paddle functions →
re-paste BOTH functions (code changed in both). No DB migration. 261 tests (253→261).

## M9.8 AI Credit Packs — one-time top-ups (v2.7.0)

PHASE2 spec: €2.90 → $3 / €5.90 → $7 managed-AI credit, 6-month validity, no subscription.
Data: migration `0004_credit_packs.sql` = `ai_credit_packs` ledger (amount, expires_at; RLS
read-own, service-role writes; spend still lives in ai_usage — pack rows are never decremented,
expiry just drops them). `paddle-webhook` turns transaction.completed + kind=credit into a pack
row (expires = purchase + 6 months; deduped via billing_events). `paddle-checkout` type=plans
also returns `credits:[{creditUsdMicros, priceId}]` (cheapest first). `ai-proxy` budget walk:
PACKS (soonest-expiring first, expired dropped) → legacy credit_usd_micros → $1 teaser →
monthly allowance — mirrored in `lifetimePoolsRemaining` (src/llm/entitlement.ts;
`remainingBudgetWithMonthly` keeps its exact legacy result shape when no packs are passed) and
published as packsUsdMicros / packsExpiresAt in every usage response (platformStore +
BillingSection meter adopt them). BillingSection: "Top up once" cards bought via the SAME
overlay flow (`startCheckout` refactor); `afterPurchase('credit')` polls until the cap grows.
Owner sandbox steps: run 0004 SQL once → create 2 one-time prices (€2.90, €5.90) → add
`{"kind":"credit","creditUsdMicros":…}` entries to PADDLE_PRICE_MAP on BOTH Paddle functions →
re-paste paddle-checkout + paddle-webhook + ai-proxy (all three changed). 270 tests (261→270).

## M10.1 Dashboard stats zone (v2.8.0)

`src/engine/progressStats.ts` (pure, +21 tests, 270→291): streaks (grace: an
inactive today still counts through yesterday), 12-week heatmap cells
(HEATMAP_DAYS=84, intensity 0–4 vs the busiest day), 7-day due forecast
(overdue folds into today; Math.round day-index absorbs DST ±1 h), mature-share
ring (`learnedRing`: review/introduced + introduced/totalWords coverage, null
guards for fresh accounts). Facade `computeProgressStats` is the decorator seam
for a future `engagement.ts` (Dormant option #2). `statsRepo.activityDays()`
aggregates REAL activity only — drillAttempts.at, vocabCards.updatedAt +
introducedDate (sync bulkPut keeps original timestamps), conversationSessions.
startedAt; LessonLogs are excluded because their plan fields are stamped on
app-open, not on study. UI `features/dashboard/StatsZone.tsx` (self-loading,
store untouched): SVG ring, weekday-aligned heatmap, forecast bars. Streaks are
computed but NOT displayed (gamification dormant). Remaining M10 slices: design
tokens + dark mode, route-based code-splitting, mobile bottom nav, flashcard
polish.

## M10.2 Design tokens + dark mode (v2.9.0)

Theming lives in `tailwind.config.js` + `src/index.css`: every used color step
(slate 50–900, indigo 50–800, emerald/red/amber 50–800, sky 50–800, rose 50–700)
is backed by an `--dm-*` CSS var (RGB triplet), remapped under `.dark`. The
existing utility classes flip themes WITHOUT per-file `dark:` sweeps — fills
invert (slate-900↔100), accent 400–600 stay, status fills/text swap to dark
tints/light steps. RULES for new code: use `bg-surface` for card/panel
backgrounds (NOT `bg-white` — that stays literal white for text on accent
buttons); if you adopt a color step that isn't in the var set, add both the
`:root` and `.dark` values or it will be light-only. Theme state:
`src/state/theme.ts` (choice 'system'/'light'/'dark' persisted at `dm.theme`;
pure injected helpers + pub/sub so the header ☀️/🌙 toggle and Settings →
Appearance stay in sync; `initTheme()` in `main.tsx` follows OS changes while
'system'). Anti-flash: inline script in `index.html` head must stay in sync
with theme.ts (same key + class semantics). Theme-color metas now follow the
page background per color scheme (PWA manifest keeps brand indigo). Remaining
M10 slices: route-based code-splitting (1.1 MB single chunk), mobile bottom
nav, flashcard polish.

## M10.3 Code-splitting (v2.10.0)

Three layers. (1) Routes: `App.tsx` wraps Routes in `<Suspense fallback={<PageLoader/>}>`
and every route EXCEPT DashboardPage + WelcomeFlow (first screen on open) is
`React.lazy` — 15 on-demand chunks. RULE: new pages get `lazy(() => import(...))`;
only first-screen pages stay eager. (2) Supabase: `getSupabase()` in
`src/sync/supabaseClient.ts` is now an ASYNC factory — env check first, then
`await import('@supabase/supabase-js')`; RULE: always `const sb = await
getSupabase()` (returns null when unconfigured OR chunk load failed — memo
resets so it retries). The type import stays type-only; never re-add a value
import of supabase-js to eager code. (3) Vendor/content: `manualChunks` in
vite.config.ts → react-vendor / db-vendor (dexie) / content (src/content —
vocab+grammar seed, still eager because the dashboard plan needs it day one).
Numbers: initial JS 1108 → 669 KB raw (~217 KB gzip, −35%); supabase-js
(232 KB) + route pages load post-paint. SW needed no change (assets are
cache-first; visited lazy pages work offline). Diagnosed with a source-map
sizes script (sourcesContent per module) — see AGENT history if you need it
again. Remaining M10 slices: mobile bottom nav, flashcard polish.

## M10.4 Mobile bottom nav (v2.11.0)

`src/app/MobileNav.tsx` — fixed bottom bar below `sm` (header nav is
`hidden sm:block` in `Layout.tsx`). Four tabs (Today/Vocab/Review/Talk) + a
"More" sheet with the secondary sections. RULES for new sections: primary
sections get a tab in `PRIMARY` (short label ≤5 chars + emoji); secondary go
in `SECONDARY` (sheet) — keep the two arrays + Layout's NAV_ITEMS in sync.
Dark-mode gotchas baked in: the sheet scrim is `bg-black/40` because the
`slate-900` token inverts to a light value in dark mode (an overlay built
from it would be white); bar/sheet pad with `env(safe-area-inset-bottom)` and
`index.html` has `viewport-fit=cover` for the installed iOS PWA. Sheet closes
on navigation (useLocation effect), Esc, and backdrop click. Main/footer have
mobile bottom padding (`pb-24`/`pb-28`, `sm:` restores) so the fixed bar
never covers content. Remaining M10: flashcard polish (M10.5).

## M10.5 Learning-surface polish (v2.12.0) — M10 complete

Keyboard-first studying via PURE `src/engine/sessionKeys.ts`
(introKeyAction / choiceKeyIndex / resultKeyAction; +10 tests in
`src/engine/__tests__/sessionKeys.test.ts`). RULE: keyboard shortcuts on
learning surfaces map keys → actions in that module (never inline in
components) so they stay testable. Wiring gotchas already solved: while a
typing input is active the components leave Enter to the native form submit;
`completingRef` in StudySession prevents double-completion when a focused
button's native Enter ALSO fires the window keydown handler — keep that ref
if you touch completeWord. Visual: `.dm-reveal` (index.css, 180 ms fade-up,
disabled under prefers-reduced-motion) marks revealed answers/result blocks;
`Kbd` in ui.tsx renders keycap hints and is hidden below `sm` (no keyboard
on phones). Typing inputs auto-focus (StudySession focus effect per phase;
ReviewPage input has key={index}+autoFocus). ReviewPage imports
sessionKeys from engine/ (not features/vocab/) on purpose — engine is the
shared pure-logic home.

## M11.1 Mistake bank (v2.13.0)

PURE `src/engine/mistakeBank.ts` (+15 tests): three collectors over plain
rows — `collectDrillMistakes` (latest-attempt-decides: an item is an active
mistake only while its LATEST drillAttempt is wrong; `wrongCount` keeps the
full history; `(revealed)` answers count as misses), `collectTroubleWords`
(`vocabCards.lapses > 0` — that covers BOTH Review misses and Speak & Listen
misses, which also go through reviewWord), `collectConversationMistakes`
(turn `mistakes[]` flattened, newest first, cap 20). RULE: mistake logic
lives in the engine, never in the page — later M11 slices (practice-my-
mistakes, mistake SRS, insights) reuse the same collectors.
`src/db/repositories/mistakeRepo.ts` is the only Dexie-touching part
(read-only, one Promise.all over 6 tables). Page `/#/mistakes`
(features/mistakes/MistakeBankPage.tsx) self-loads (StatsZone pattern —
store untouched). Nav: header NAV_ITEMS after Review + MobileNav SECONDARY
sheet (📌 Mistake bank). No "clear" button on purpose — mistakes clear by
learning (answer the drill correctly, review the word, read the correction).

## M11.2 Practice my mistakes (v2.14.0)

The mistake bank is actionable: "Practice these drills →" replays the open
drill mistakes through the EXISTING DrillRunner, "Practice these words →"
replays lapsed words through the vocab StudySession. Selection stays pure:
`pickPracticeDrills` (cap 15, wrongCount desc then latest miss, shuffled) and
`pickPracticeWords` (cap 12, most-lapsed first, shuffled) in
engine/mistakeBank.ts (+7 tests → 331 total). mistakeRepo now also returns
the raw rows the sessions need (`items`, `bank`) — still read-only. The page
swaps itself for the runner (WordBankPage session pattern): DrillRunner
already records drillAttempts mid-session, so correct retries clear bank
rows on reload; StudySession reviews go through reviewWord → SRS +
refreshToday. Pickers are generic `<T extends { id: string }>` so tests use
minimal rows.

## M11.3 Mistake explanations — hybrid (v2.15.0)

Tappable correction pills (click/tap ONLY, no hover) expand inline (Esc
collapses): (a) static micro-lesson per MistakeCategory from pure
`engine/mistakeLessons.ts` (+6 tests; tolerant lookup falls back to 'other'),
deep link to the matching grammar topic via `findTopicForMistake` (title
keyword, case-insensitive; vocab/other → null); (b) "Explain this ✨" → 6th
LLM contract `explainMistake(deps, { said, corrected, type, cefr })` in
llm/services.ts (+3 tests): 2–3 sentences about that exact sentence,
LlmCache key type+said+corrected+model → repeats free. Shared component
`features/mistakes/MistakeExplainer.tsx` (variants pill/plain; without AI
deps it shows the settings hint instead of the button). Wired in 3 places:
ConversationSessionPage transcript + session feedback, MistakeBankPage rows.
RULE unchanged: category logic pure in engine, LLM contract in services,
component only orchestrates.

## M11.4 Custom scenario builder (v2.16.0)

Conversation page → "Create your own scenario ⭐" card
(`features/conversation/ScenarioBuilder.tsx`): description (≥8 chars) +
level (defaults to profile level) → 7th LLM contract
`generateScenario(deps, { description, cefr })` in llm/services.ts (+3
tests): zod-validated shape, normalized on return (title ≤60, emoji first
grapheme + ⭐ fallback, phrases trimmed/capped at 6), maxTokens 600 temp 0.8,
LlmCache key cefr+model+hash(description) — same text regenerates free,
tweaked text = new scenario. Preview → Save via contentRepo.addCustomScenario
(optional `emoji` input added; manual path unchanged) → custom row lands on
top of the library (getAllScenarios: customs newest-first). No AI deps →
Settings hint instead of the Generate button.

## M11.5 Sentence listening / dictation (v2.17.0)

Speak & Listen page (`#/practice`) gains a second session mode:
"✍️ Sentence dictation →". TTS speaks the German example sentence of a
learned word (auto-plays on arrival; 🔊 Replay / 🐢 Slower), the learner
types it; grading is umlaut- and punctuation-tolerant over the whole
sentence. Pure engine `src/engine/sentenceListening.ts` (+11 tests →
354/354): `sentenceItems(words, limit=6)` (only words with
`exampleSentenceDe`, deduped by normalized sentence, deterministic order —
the page shuffles), `normalizeSentence` (strips punctuation incl. „“
quotes, then the shared umlaut-folding `normalize`),
`gradeSentence` (Levenshtein similarity, stricter than the speech matcher:
≥0.9 correct / ≥0.75 almost / else incorrect — typed input has no STT
noise). Page: `SessionItem = SpeakListenItem | SentenceItem` union,
sentence card (Check / Show answer, verdict badge + % match, sentence +
translation, 🔊 Hear it, Enter → next), SM-2 via
`reviewWord(qualityForVerdict)` + `bumpDrills`; done screen repeats the
same mode. 100% offline (device TTS only).

## Resume protocol for a new agent

1. `git log --oneline -8` + read `ROADMAP.md` → know exactly what's done and what's next.
2. Run the verification gate — it must already be green before you change anything.
3. Build the next unchecked item from `ROADMAP.md` (Phase 2 milestones: `docs/PHASE2_PLAN.md`).
   Update ROADMAP + relevant docs as you go.
4. Gate → docs → secrets scan → commit → `git push origin main --tags` → verify CI+deploy green
   (`/opt/homebrew/bin/gh run list --limit 3`) → verify live URL.
