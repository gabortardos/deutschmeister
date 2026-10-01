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
  - SPA deep links work since 2026-09-29: deploy.yml copies `dist/index.html` →
    `dist/404.html` (GitHub Pages serves it for unknown paths; status stays 404
    but the browser gets the shell and client-side routing fixes the URL).
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
    Plan allowances live in paddle-webhook's PLANS — M13 retune (2026-10-01):
    Basic $10 / Plus $20 / Pro $40 fair-use guards at nominal glm-4.6 prices
    (chat's real cost = the owner's flat Coding Plan key → marginal $0; a heavy
    learning month meters ≈ $4–6). Existing ai_entitlements rows need the
    one-time SQL bump in docs/OWNER_OPS.md §4.
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

## M11.6 Cloze reviews (v2.18.0)

"🧩 Cloze review" button on the Vocab page ("Want more?" card) starts an
8-sentence session: German example sentences of learned words with the
word itself gapped out — pick the missing word from 4 choices. Pure
engine `src/engine/clozeReviews.ts` (+10 tests → 364/364): `findGap`
matches only a literal occurrence (case-insensitive with Unicode letter
boundaries, so "Tag" never matches "Tage"; article form "der Tag"
preferred, bare word tolerated — sentences where the word only appears
inflected are skipped, never gapped wrongly), `clozeOptions` builds the
answer-first distractor list (same-theme words first, mirroring the
answer's shape — article+noun vs bare word — distinct after
normalization; wrong-article variants of the same noun stay in as gender
practice), `clozeItems` dedupes by sentence and caps at 8, `checkCloze`
compares normalization-tolerantly. `ClozeSession.tsx` renders the gap
chip + English translation hint, choice buttons with 1–4 shortcuts
(`sessionKeys`), verdict badge + 🔊 Hear sentence, done-screen summary;
every answer feeds SM-2 (`reviewWord(4/1)`) + `bumpDrills`. The engine
returns `[answer, ...distractors]` deterministically — the page shuffles
for display. 100% offline.

## M11.7 Insights page (v2.19.0)

New `/#/insights` route ("Insights" in the desktop nav + mobile More
sheet). The Dashboard stats zone (M10.1) owns the TIME dimension
(heatmap, streaks, due forecast); this page owns the SKILL dimension —
where you are strong/weak. Pure engine `src/engine/insights.ts` (+7
tests → 371/371), mistakeBank-style `*Like` structural inputs:
`accuracyByType` (attempts joined to drill items; orphaned attempts —
deleted LLM drills — skipped; integer %; worst accuracy first),
`accuracyByCefr` (A1→C2 order, attempted levels only),
`vocabCoverage` (introduced vs total bank words per CEFR level, empty
levels skipped), `mistakeTypeCounts` (conversation corrections, most
frequent first), `computeInsights` (totals incl. overall drill
accuracy, conversation count, corrections received). Page
`src/features/insights/InsightsPage.tsx` reuses `computeStreaks` +
`activityDays` for streak badges and `collectTroubleWords` for the
top-5 lapsed words (link to the Mistake bank); bar rows are green ≥80%,
amber ≥60%, red below; every section has an empty state. 100% offline.

## M11.8 Tutor chat (v2.20.0)

New `/#/tutor` route ("Tutor" in the desktop nav, 🎓 Tutor chat in the
mobile More sheet). Free-form chat with the tutor — NO scenario, unlike
Conversation role-play. Two modes share one transcript (persisted in
localStorage via `dm-tutor-mode`): 🗣️ Free chat (German replies at the
learner's level, 1–3 sentences, always ends in a question, mistakes graded
silently in JSON) and ❓ Ask the tutor (questions ABOUT German, ≤120-word
English answers). Pure engine `src/engine/tutorChat.ts` (+6 tests →
379/379): `TUTOR_MODES` metadata, `TUTOR_HISTORY_CAP = 12` +
`trimTutorHistory` (drops empty turns, keeps newest 12 — flat input
tokens), `isTutorChatMode` guard. LLM contract #7 `tutorChatTurn`
(`llm/services.ts`, maxTokens 900, temp 0.7, no cache) REUSES
`ConversationReplySchema` → tutor-chat corrections flow into the Mistake
bank and Insights through the existing pipeline, zero extra wiring.
Storage: conversation tables reused via sentinel `scenarioId:
'tutor-chat'` (`TUTOR_CHAT_SCENARIO_ID` in conversationRepo — no Dexie
schema bump); Conversation "Recent sessions" labels them "🎓 Tutor chat".
Page: resumes the latest session (messenger, not scene), level-select
override, EN translation under tutor bubbles, corrections box with
MistakeExplainer + Mistake bank link, ＋ New chat ends the session.
Billing unchanged (BYO unmetered; platform teaser→credits→allowance).
Note: `vite preview` serves under the `/deutschmeister/` base path —
smoke-test `/deutschmeister/tutor`, not `/tutor`.

## M11.9 Free writing (v2.21.0)

New `/#writing` route ("Writing" in the desktop nav, ✍️ Free writing in the
mobile More sheet). Homework-style free writing: a static bilingual prompt
bank (`src/content/writing/prompts.ts`, 8 tasks per CEFR level, 48 total —
A1 everyday texts → C2 stylistic play), a deterministic daily pick
(`promptForDay` in the pure `src/engine/writing.ts` — the 🎲 button just
advances a salt), and grading via LLM contract #8 `gradeWriting`
(`llm/services.ts`, maxTokens 1000, temp 0.3, cached by
level+model+hash(prompt+text) so re-grading an identical submission is
free): 2–3 English "overall" sentences, ≤3 strengths, ≤15 corrections
reusing MistakeSchema — corrections render as MistakeExplainer rows (Explain
✨ per correction) and flow into the Mistake bank + Insights through the
conversation-mistake pipeline (mistakeRepo maps pieces to pseudo-turns;
sessionId 'writing' is a display key only, never deep-linked). Caps and day
limits (all in engine/writing.ts): min 15 words, soft cap 120 (amber,
still submittable), hard block 400; 1 piece/day free · 3 Basic/Plus · 5 Pro
(dormant until M11.10) · 10 on a BYO key (own tokens, anti-runaway only);
quota counts local calendar days (keyOfDay) off stored pieces. Storage:
Dexie version(2) `writingPieces` (additive — existing installs upgrade to
an empty table); `writingRepo` is the seam. NOT cloud-synced yet on
purpose: syncEngine has no per-adapter failure isolation, so shipping an
adapter before the owner runs `0005_writing_pieces.sql` would break sync
for everyone — migration + adapter land with the next owner-SQL batch.
Streak/heatmap: `ActivityDay.writing?` (optional field) counted by
dayActions; statsRepo buckets `writingPieces.createdAt`. Insights:
`totals.writing` + ✍️ badge; writing corrections join mistakeTypes and the
corrections total. Level select persists to `dm-writing-level` (defaults to
the profile level). Corrections are NOT auto-converted into drills in
M11.9 — there is no practice surface for ownerless drills yet (M11.10
candidate).

## M11.10a Pro writing features (v2.22.0, dormant)

All Pro-tier writing features that need NO owner work, shipped dormant-safe
(M11.10b = the owner-gated activation). Two new LLM contracts in
`llm/services.ts`: #9 `generateWritingPrompt` (maxTokens 300, temp 0.9,
deliberately NOT cached — variety is the point; the system prompt embeds
the CEFR level, up to 8 recent task texts to avoid repeating, and a
per-click `newId()` seed) and #10 `rewriteWriting` (maxTokens 1200,
temp 0.3, cached like gradeWriting by level+model+hash(prompt+text)).
Gate: `writingAiExtrasEnabled(route, plan)` in `src/engine/writing.ts` —
Pro on the platform route, ALWAYS on for BYO (own key, own tokens → live
for BYO users immediately), off otherwise. Writing page: "✨ AI prompt"
button (badge "AI ✨"; pieces store `promptId: 'ai'`; 🎲 / level change /
submit reset it) and "Full rewrite ✨" on the feedback card → indigo card
with the corrected text, persisted as `WritingPiece.rewrite?` (optional +
non-indexed → NO Dexie schema bump; `savePiece` upsert is the piece's only
later write). Ineligible users see dormant-safe hints, no upsell links
while Pro is unpurchasable. `plans.ts`: Pro copy is now real (writing
studio, streaming, ~300k voice chars) and `ttsCharCap` is 300k — the
`paddle-webhook` `PLANS.pro` entry is aligned in-repo and reaches
production when the owner re-pastes the function in M11.10b.

## M12.1 C1 grammar bank (v2.23.0)

`src/content/grammar/c1.ts`: 12 C1 topics × 8 drills each — grammar syllabus
50 → 62 (A1–C1). The PHASE2_PLAN candidate list was first de-duplicated against
shipped B2/B1 (B2 already had Konjunktiv I, KII Vergangenheit, subjektive
Modalverben, N-Deklination, Nominalstil, Genitiv-Präpositionen, Passiversatz,
je…desto; B1 had Verben mit Präpositionen). Shipped: als-ob Vergleiche,
Höflichkeits-KII, Futur II, Bekommen-Passiv, Korrelat-es, Konnektoren-Nuancen
(auch wenn / es sei denn / vorausgesetzt / zumal — sofern & geschweige denn stay
reserved for C2), erweiterte Attribute, Gerundiv, Relativsätze mit Präposition +
was/wo, Verben mit Genitiv, Satzklammer & Ausklammerung, Appositionen.
Mechanics: registered in `grammar/index.ts` LEVELS after B2 → ids `g-c1-01…`,
order 51–62 (append-stable, A1–B2 ids/orders untouched); `grammarRepo`
backfills by id, so existing devices get the topics on next launch.
`relatedVocabTheme` must be null or a theme that exists in the vocab corpus
(tests enforce). Drill mix per topic: cloze ×3–4 + choice + transform +
translate_de_en + translate_en_de ± wordorder (only where the sentence needs no
interior comma — the wordorder runner checks an exact token permutation of
acceptedAnswers[0]).

## M12.2 C2 grammar bank (v2.24.0)

`src/content/grammar/c2.ts`: 8 C2 topics × 8 drills — grammar syllabus
62 → 70, level-complete A1–C2. Same de-dup discipline as M12.1: the recorded
plan's "Konjunktiv I in Presse", "Nominalstil vs Verbalstil" and "feste
Präpositionalverben + Idiomatik" were dropped (b2-konjunktiv-i, b2-nominalstil,
b1-verben-mit-praepositionen + b2-funktionsverbgefuege already ship them).
Shipped: Modalpartikeln, konditionale Inversion ohne wenn (KII + sollte-Form),
gehobene Konnektoren (sofern / insofern…als / geschweige denn), Ellipsen,
Wortbildungs-Nuancen (lösbar/löslich, -bar/-fähig, zer-/ent-/ver-), nur
prädikative Adjektive (egal/leid/schuld/quitt/gewachsen + case government),
kaum…als + sobald/sowie, Präpositionspaare (von…aus / auf…hin / aus…heraus /
um…willen + Genitiv). ids `g-c2-01…`, order 63–70 (append-stable); the test
id regex `g-[abc][12]-\d{2}` already matched c2, only the counts row changed
(62 → 70, C2: 8). Also fixed the stale WELCOME_LEVELS comment in
`src/features/onboarding/welcome.ts` — the tour itself stays A1–B2 while vocab
tops out at B2 (grammar alone is not a level the app can teach end to end).

## M12.3 vocab batch 1 (v2.25.0)

First vocab-bank expansion (M12 plan): **+559 words, 1,902 → 2,461**, across
the four usefulness-leading themes — Haushalt (Home), Essen gehen (Food),
Gesundheit/Arzt (Health), Arbeit/Bewerbung (Work). Distribution by level of
usefulness: A2 +104 · B1 +229 · B2 +130 · **C1 +96 — the first C-level vocab
band**, shipped as a new `src/content/vocab/c1.ts` (`w-c1-0001…` ids;
frequencyRanks continue after the B2 block).

Key mechanics (mirror the grammar milestones):
- **Append-stable ids**: new rows go at the END of each level file; existing
  `w-a2-*`/`w-b1-*`/`w-b2-*` ids never move. `ensureVocabSeeded` bulkPuts
  the full corpus each launch, so appended words seed AND shifted
  frequencyRanks refresh on existing devices (unlike grammar's insert-only
  backfill — vocab is an upsert by design).
- **De-dup first, author second**: candidates were checked against the
  1,902 existing headwords with a throwaway tuple-parser (`.tmp-vocab-recon.cjs`,
  deleted). 116+64+7 collisions dropped — much obvious household/food/work
  vocab already existed (Küche, Messer, Rechnung, Praxis, Termin, Gehalt …).
  One leak (duplicate Küche) slipped into a2 and was caught by the uniqueness
  test — the tests are the real gate, the script is the convenience.
- **Test contract**: unique headwords (case-sensitive), unique ids, corpus
  ranks = index+1, per-level counts (now incl. C1 + C2-zero guard), full
  population of all fields, only nouns carry article/plural, noun base form
  contained in the German example sentence (case-insensitive substring).
- Word discovery stays frequency-rank driven (no CEFR filter), so the new
  words surface naturally in "learn extra words" across all learner levels.

**Post-ship hotfix (v2.25.1)**: the C1/C2 grammar banks were seeded but
invisible — `GrammarPage.tsx` rendered sections from a stale local
`LEVELS = ['A1','A2','B1','B2']` list. Lesson: when adding a new CEFR band
anywhere, grep for hardcoded level lists (`'A1', 'A2', 'B1', 'B2'`) — the
canonical source is `CEFR_LEVELS` in `src/db/types.ts`. Known remaining
intentional cap: `PLACEMENT_LEVELS` (B2 — placement bank has no C items).

## M12.4 vocab batch 2 (v2.26.0)

Second vocab expansion: **+634 words, 2,461 → 3,095** over Reisen/Verkehr
(Travel 218 · Transport 129) and Behörden/Ämter/Recht (Authorities 149 ·
Law 109); A2 +120 · B1 +226 · B2 +224 · C1 +64 — the C1 additions are pure
legal/administrative register. Same mechanics as M12.3 (append-stable ids at
the end of each level file; `ensureVocabSeeded` bulkPuts the whole corpus so
appended words + refreshed ranks propagate on next launch). ~68 pool words
intentionally skipped (proper nouns, archaic/niche terms, near-duplicates).

**Ops lesson**: after this batch the deployed app still showed 2,461 — the
words existed only in the working tree. GitHub Pages deploys from pushed
commits via `.github/workflows/deploy.yml`; a local `dist/` rebuild never
reaches production. When a deployed count looks stale, check `git status`
+ Actions FIRST, then the service worker (network-first shell means one
extra reload at most).

## M12.5 vocab batch 3 (v2.27.0)

Third vocab expansion: **+481 words, 3,095 → 3,576** over Gefühle/Charakter
(Emotions +142; new `Character` theme +108) and Medien/Technik (Media +137 ·
Technology +94); A2 +72 · B1 +238 · B2 +99 · C1 +72. Reuses the existing
theme labels (Emotions/Media/Technology) plus one new Character label so the
Vocab-page theme filter stays clean. Same append-stable mechanics as
M12.3/M12.4. Remaining to 5,000: +1,424 over batches 4–5 (~712/batch).

**Dedup lesson**: the candidate pool was checked in-process (import
SEED_VOCAB, Map over trimmed headwords — mirrors the case-sensitive
uniqueness test). A second shell-side check (`comm` against a grep-extracted
headword list) silently under-reported because vite-node spinner output
pollutes the dumped file — Heimweh and Verlangen slipped through, were caught
by the in-process dup scan and replaced with Nostalgie/Leidenschaft. Never
trust a text-file pipeline for corpus checks; always import the corpus.

## M14 Lessons pilot (v2.35.0)

The deterministic "teacher at the blackboard" layer — full static lessons for 3
pilot topics, no AI required, no Dexie, no sync (bundle content like grammar
topics).

- **Schema** `src/content/grammar/lessons/types.ts`: `Lesson = hook →
  sections[] (heading + prose + optional worked table) → mistakes[]
  (wrong → right → why) → checkpoints[] (offline multiple choice) →
  cheatSheet[]`. Prose/cells support the MiniMarkdown inline subset
  (`**bold**` only — no headings/lists inside lesson text; those are typed
  fields). EN prose + DE examples (bilingual prose starts at B2+ per plan).
- **3 authored lessons**: `g-a1-02` Present tense: regular verbs (opens with
  the pronoun cast), `g-a2-12` Adjective endings (one-signal principle, full
  der-/ein-/no-article tables Nom/Akk/Dat), `g-b1-11` Perfekt vs. Präteritum
  (register rule + the sein/haben/modal Präteritum exception). **The agent
  drafted them; the owner's didactic review is the remaining human step of
  the M14 authoring pipeline** (feedback → edit the three files in
  `src/content/grammar/lessons/`; the content-contract tests keep edits safe).
- **Engine** `src/engine/lessons.ts`: `gradeCheckpoint(cp, chosen)` and
  `lessonProgress(checkpoints, answers)` — pure, +7 tests.
- **UI**: `LessonView.tsx` inside GrammarTopicPage. Topics with a lesson get
  a 📖 Lesson / ⚡ Quick reference segmented tab (lesson is default; the
  summary tab is the old page unchanged; topics without a lesson render
  exactly as before). Checkpoints grade instantly, allow retry, and reveal
  the teaching explanation. The cheat sheet prints via a **hidden iframe**
  (`printCheatSheet`) — deliberately no global print CSS. "Now practice it →"
  runs the topic's existing drill round; "💬 Ask about this lesson" parks a
  one-shot localStorage `dm-tutor-prefill` (`src/features/tutor/tutorPrefill.ts`)
  that TutorChatPage consumes on mount (switches to Ask mode, prefills the
  textarea, clears the key).
- **Tests**: content contract (3 lessons, topic ids exist in
  SEED_GRAMMAR_TOPICS, tables rectangular, checkpoints valid/unique, German
  orthography present) + engine tests — 460/460 total.
- **Lesson learned**: keep checkpoint answers in component state only
  (pilot decision) — persistence/mastery wiring is deferred to M16 when
  lessons become Roadmap nodes. The M15 curriculum engine can key off
  `lessonForTopic()` to mark which topics have teaching content.

## Resume protocol for a new agent

1. `git log --oneline -8` + read `ROADMAP.md` → know exactly what's done and what's next.
2. Run the verification gate — it must already be green before you change anything.
3. Build the next unchecked item from `ROADMAP.md` (Phase 2 milestones: `docs/PHASE2_PLAN.md`).
   Update ROADMAP + relevant docs as you go.
4. Gate → docs → secrets scan → commit → `git push origin main --tags` → verify CI+deploy green
   (`/opt/homebrew/bin/gh run list --limit 3`) → verify live URL.
