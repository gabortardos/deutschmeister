# ROADMAP.md — live milestone ledger

> Update this file in the same commit as the work it describes. It is the shared memory
> between AI agents (and humans) working on this repo. Full spec: `docs/MASTER_PROMPT.md`.

## Status: M0 ✅ · M0.1 ✅ · M1 ✅ · M2 ✅ · M2.1 ✅ · M2.2 ✅ · M2.3 ✅ · M3 ✅ · M4.1 ✅ · M4 ✅ — **v1.0.0 complete** 🎉 · **Phase 2 underway: M4.2 ✅ (v1.0.1) · M5.1 ✅ (v1.1.0)** — full plan: `docs/PHASE2_PLAN.md`

| Milestone | State | Commit | Notes |
|---|---|---|---|
| M0 Foundation | ✅ done | `8f91ba8` | app shell, Dexie+repos, Settings hub, speech+LLM adapters, CI/CD, live |
| M0.1 Handoff hardening | ✅ done | (this commit) | apiKey→localStorage, `src/components/`, `#/settings?key=` import, live-verified GLM defaults, AGENT/ROADMAP/MASTER_PROMPT docs |
| M1 Vocab core | ✅ done | (this commit) | 449-word corpus (A1 180 / A2 150 / B1 119), SM-2 + planner + grader + matcher engines, vocabRepo/lessonRepo, Vocab/Review/Today UI |
| M1.1 Vocab expansion | ✅ done | (this commit) | corpus 449 → **1,028 words** (A1 381 / A2 345 / B1 302) from German frequency lists, append-stable ids + rank-refresh seeding, Vocab "Want more?" card: anytime practice of learned words + extra new-word sessions (5/10/15/20), v0.6.0 |
| M1.2 Word forms + word bank | ✅ done | (this commit) | `src/engine/verbForms.ts` conjugation engine (Präsens 6 persons, Präteritum, Perfekt; 80-entry irregular table, separable compose, sein/haben choice) shown on flashcards + word bank; new `/words` Word-bank page: search/filter/sort learned words, expandable forms & SRS status, practice-from-filter, v0.7.0 |
| M2 Grammar core | ✅ done | (this commit) | 35 topics (A1 13 / A2 12 / B1 10), runner+mastery+placement engines, grammarRepo, PLACEMENT_BANK 30, Grammar/Topic/Placement UI, v0.4.0-m2 |
| M2.1 Fixes | ✅ done | `aea0bda` | GLM key self-heal (stale-defaults migration, endpoint probe, error hints) + German TTS voice race fix, v0.4.1 |
| M2.2 LLM compat | ✅ done | (this commit) | gpt-5/o-series support (max_completion_tokens, no temperature, reasoning headroom), Model picker dropdown (datalist→select+Custom…, fixes password-manager popup), GLM default → browser-usable bigmodel.cn endpoint + self-heal migration (api.z.ai sends no CORS — preflight-verified), honest CORS error hint, v0.8.0 |
| M2.3 Chat reliability | ✅ done | (this commit) | conversation-turn failures fixed (truncation at maxTokens 600→1400 mid-JSON = "not parseable JSON"/"Required"; blind retries → corrective retries showing the bad reply; finish_reason=length detected), gpt-5 latency fix (reasoning_effort low), prompt hardening (latest-message mistakes only, ≤80-word replies, JSON shape), hint 200→300, session feedback 700→1200, 2 new adapter tests, v0.8.1 |
| M3 LLM layer | ✅ done | (this commit) | 5 zod service contracts + LlmCache, 11 scenarios, conversation UI (STT/TTS/hints/feedback→drills), AI drill gen + "Explain for me" + AI examples, v0.5.0-m3 |
| M4.1 Speak & Listen drills | ✅ done | (this commit) | `/practice` page: listening (TTS word → type it, replay + 🐢 slower) and speaking (English cue → mic → matcher verdict/similarity, best-attempt-wins retries, typed fallback when mic fails), interleaved 10-word sessions from the learned bank feeding SM-2, engine `speakListen.ts` + 9 tests, nav + vocab cross-link, v0.9.0 |
| M4 Polish | ✅ done | (this commit) | PWA: manifest + dependency-free SW scoped to `/deutschmeister/` (network-first shell, cache-first hashed assets, SWR statics, cross-origin LLM traffic never intercepted), icons 192/512/maskable via `scripts/gen-icons.mjs`, prod-only registration `src/pwa.ts`; export/import verified (`backupRepo` + Settings→Data, shipped M0); README final (PWA install/offline); 7 PWA integrity tests, v1.0.0 |
| M4.2 UX cleanup | ✅ done | `86c5a38` | Setup checklist → Settings (`GettingStartedSection`, auto-hides), API-key manuals per provider, Roadmap card out of dashboard, version footer, dashboard focus CTA, v1.0.1 |
| M5.1 B2 vocab corpus | ✅ done | (this commit) | corpus 1,028 → **1,902** (B2 874: abstract/work/media/law/science/environment/health nouns, 130 verbs, 186 adjectives, 39 connectors, 94-phrase pack); verbForms +26 irregulars, +25 separables, +11 sein-verbs; multi-word headwords exempt from conjugation; v1.1.0 |
| M5 B2 content | ⬜ planned | — | M5.2 grammar → ~50 topics · M5.3 +8–10 B1/B2 scenarios |
| M6 Speech | ⬜ planned | — | TTS voice-quality fix + previews, optional HD cloud TTS, hands-free voice conversation, v1.2 |
| M7 Accounts | ⬜ planned | — | Supabase: Google + email/password (verification, forgot-password, fallback), RLS, sync, data-claim, guest mode, v2.0 |
| M8 Platform AI teaser | ⬜ planned | — | `ai-proxy` Edge Function, $1 metered teaser, rate limits, paywall + BYO escape hatch |
| M9 Payments (hybrid) | ⬜ planned | — | Paddle checkout (subscription + top-ups), webhooks → entitlements, Account & Billing UI |
| M10 Graphics/UI | ⬜ planned | — | design system, dark mode, code-splitting, mobile nav, `progressStats` engine + stats zone |
| M11 Learning depth | ⬜ planned | — | mistake bank, custom scenarios, tutor chat, sentence listening, cloze reviews, insights, placement, free writing |

Phase 2 detail (tiers, meter order, dormant options, security rules): `docs/PHASE2_PLAN.md`.

## M1 checklist (vocab core)

- [x] `src/content/vocab/` seed corpus ≥400 words A1–B1 (themes, frequencyRank, examples) — 449 words at M1; extended to 1,028 in M1.1, integrity-tested (uniqueness + noun-in-example)
- [x] `src/engine/srs.ts` SM-2 (quality 0–5, ease ≥1.3, fail→relearn) + unit tests
- [x] `src/engine/text.ts` + `src/engine/grader.ts` (normalization + umlaut variants ae/oe/ue/ss both directions, article-optional) + unit tests
- [x] `src/engine/matcher.ts` (Levenshtein ≥0.85 ok / 0.7–0.85 almost / else wrong) + unit tests
- [x] `src/engine/lessonPlanner.ts` (daily goal, frequency order, theme bias, idempotent per date) + unit tests
- [x] `src/db/repositories/vocabRepo.ts` (cards, due queue, stats, idempotent seeding) + `lessonRepo.ts` (daily log)
- [x] VocabPage: flashcards de→en + en→de, multiple choice, typing with article, TTS play
- [x] ReviewPage: mixed due queue (alternating direction DE→EN / EN→DE)
- [x] Dashboard "Today": new words X/N, due-review count, continue buttons
- [x] DoD: full study day simulatable; due dates advance; tests cover srs+grader+matcher (44 total)

## M2 checklist (grammar core)

- [x] `src/content/grammar/` 35 topics A1→B1 (A1 13 / A2 12 / B1 10; explanationMd, focus, relatedVocabTheme, ≥6 seed drills each) — integrity-tested
- [x] `src/engine/exerciseRunner.ts` (deterministic option/token shuffles, needsGermanKeys, gradeDrill) + unit tests
- [x] `src/engine/mastery.ts` (8-attempt window, ≥6 attempts, ≥75 % → mastered) + unit tests
- [x] `src/engine/placement.ts` (A1→B1 staircase, promote 5/≥4, fail-stop 5/≤2, cap 20, ≥60 % pass) + unit tests
- [x] `src/content/grammar/placement.ts` PLACEMENT_BANK: 30 items (10/level, vocab+grammar alternating, all germanWord in corpus) — integrity-tested
- [x] `src/db/repositories/grammarRepo.ts` (idempotent seed, getters, attempt recording, masteryByTopic, nextTopic) + `markWordKnown` in vocabRepo; seeding piggybacks on `getOrCreateTodayLog`
- [x] GrammarPage: CEFR tree with mastery %, placement banner, Continue button
- [x] GrammarTopicPage: markdown explanation, drill practice round, sets `currentGrammarTopicId`
- [x] DrillRunner: all 6 types, Enter submits, 1–4 keys pick options, ä ö ü ß keys, show-answer counts wrong
- [x] PlacementPage: skippable adaptive quiz → writes level + placementResult
- [x] Dashboard wiring + APP_VERSION `0.4.0-m2`
- [x] DoD: gate green (tsc + vitest 80 + build)

## M3 checklist (LLM layer)

- [x] `src/llm/services.ts` — 5 service contracts with zod schemas + LlmCache via injectable
      `LlmCachePort` (`src/db/repositories/llmCacheRepo.ts`): conversationTurn (+ opener mode),
      sessionFeedback (category normalization → gender/case/word-order/vocab/verb-form/other),
      generateDrillItems (over-generation n+3 → deterministic sanitize → DrillItem[]),
      explainGrammar (mistakes-tailored markdown, cache-keyed by context hash),
      exampleSentences (level-tagged) + suggestReply (Hint) + pure mistakesToDrills;
      chatJSON now logs every call for Diagnostics
- [x] `src/content/scenarios/index.ts` — 11 seed scenarios (incl. Fitnessstudio A2 with
      Gerät/Beinpresse/Gewicht/Sätze/Wiederholungen/duration/partner phrases), integrity-tested;
      seeded idempotently via `src/db/repositories/scenarioRepo.ts`
- [x] Conversation UI: `ConversationPage` (library + recent sessions + drill replay) and
      `ConversationSessionPage` (chat bubbles, STT mic, per-message TTS 🔊 + EN toggle,
      Hint panel marked ✨ assisted, mistake chips under user turns, end-of-session report)
      + `src/db/repositories/conversationRepo.ts` (sessions/turns, `assisted` flag)
- [x] End-of-session feedback → "Add mistakes as drills" (transform drills owned by the
      scenario) → practice via DrillRunner (`?practice=1`); "Explain for me" + "Generate 5
      more drills" on `GrammarTopicPage` (recent-wrong-answers context via
      `grammarRepo.recentWrongAnswers`); ✨ AI examples in StudySession flashcards
- [x] Content Studio: per-topic "Generate 5 more drills with AI" + cache stats + clear cache
      (moved to llmCacheRepo); `generateAndSaveDrills` dedupes prompts per topic
- [x] DoD: gate green (tsc + vitest 100 + build 540 KB/169 KB gzip + dev-smoke 200);
      invalid JSON recovers (retry test); no-key mode fully offline (AI buttons hidden,
      conversation shows key notice); live-key verification tracked in M3.1 below

## M4 checklist (polish)

- [x] Speaking drills (see English → say German, matcher diff feedback), listening drills (TTS) — M4.1: `/practice`, engine `speakListen.ts`, SM-2 integrated
- [x] PWA: manifest + service worker scoped to `/deutschmeister/` — `public/manifest.webmanifest`
      (standalone, indigo theme, 192/512/maskable icons) + hand-rolled `public/sw.js`
      (plain JS, no deps; network-first navigations with offline fallback, cache-first for
      content-hashed `/assets/`, stale-while-revalidate for manifest/icons; skips non-GET and
      cross-origin requests so LLM API calls are never touched), registration prod-only in
      `src/pwa.ts` (dev server stays uncached); `node --check` + 7 integrity tests
      (`src/__tests__/pwa.test.ts`: manifest fields/scope, PNG icon dimensions from IHDR,
      index.html wiring, SW shape)
- [x] Data export/import (JSON backup of all local data) — `backupRepo.exportAll/importAll`
      (transactional replace, 12 tables) + Settings→Data UI (export download, import with
      confirm, progress reset, factory reset) — shipped with M0, verified + README-documented in M4
- [x] README final (setup, env, browsers, PWA install/offline, data/privacy); clean build

## M4.2 checklist (UX cleanup — v1.0.1)

- [x] Setup checklist moved from dashboard to Settings (`GettingStartedSection.tsx`, auto-hides
      when complete; dashboard shows a one-line "Finish setup" hint linking to it until done)
- [x] Dashboard "What's next" focus: exactly one primary CTA by priority — placement → today's
      new words → due reviews → grammar of the day
- [x] Per-provider API-key manuals in Settings → AI Model (`PROVIDER_MANUALS`, native
      `<details>`: GLM bigmodel.cn incl. z.ai-won't-work warning, OpenAI, DeepSeek)
- [x] Roadmap card removed from dashboard (repo docs are the roadmap); dead `MilestoneStub`
      removed from `src/components/ui.tsx`
- [x] Version footer in Settings (`v1.0.1` from `src/version.ts`); `package.json` bumped
- [x] DoD: gate green (tsc + vitest 142 + build + dev-smoke 200)

## M5.1 checklist (B2 vocab corpus — v1.1.0)

- [x] `src/content/vocab/b2.ts` — 874 B2 rows appended after the A1–B1 bank (1,028 → **1,902
      total headwords**): abstract/society/law/science/environment/health/economy/travel/city
      nouns, 3 curated verb blocks + final verb pack (130 verbs incl. separables &
      `sich `-reflexives), 186 adjectives, 39 connectors/adverbs, 94-row phrase pack
      (opinion/discussion, work/everyday function, idioms) — every row a full SeedRow
      (article, plural, meaning, theme, DE+EN example)
- [x] Headword hygiene: zero duplicates vs A1–B1 and within B2 (scripted collision checks +
      `vocab.test.ts` uniqueness test as the safety net); early-chunk collisions replaced
      in-place with same-theme words (e.g. Kündigung→Aufhebungsvertrag, Rechnung→Preissteigerung)
- [x] `index.ts` wires `B2_ROWS` (ids `w-b2-0001…`, ranks continue after B1);
      `SEED_VOCAB_COUNTS.B2` live; `vocab.test.ts` per-level count test extended
- [x] `verbForms.ts` curation: +26 IRREGULAR entries (B2 strong verbs: entstehen, geraten,
      misslingen, übernehmen, übertragen, unternehmen, unterschreiben, verschieben, versehen,
      vertreten, verhalten, verschwinden, schweigen, beißen, betreiben, beziehen, entziehen,
      ertragen, genießen, bestreiten + bases treten/weisen/lassen/brechen/schmeißen),
      +25 SEPARABLE entries (auftreten, ausschließen, wahrnehmen, hervorheben, einreichen,
      zurückgehen, zusammenbrechen, zurechtweisen …), +11 SEIN_VERBS (entstehen, geraten,
      misslingen, scheitern, verschwinden, verhungern, auftreten, aufkommen, zurückgehen,
      zusammenbrechen, erscheinen); `isVerbWord` now skips multi-word headwords (phrase pack
      never shows a conjugation table); weakBases in tests +reichen/beugen/bauen/handeln
- [x] DoD: gate green (tsc + vitest 142 + build + dev-smoke 200); v1.1.0

## Verification log (append after every gate run)

| Date | Gate | Result |
|---|---|---|
| 2026-09-20 | M0: tsc+vitest(6)+build+dev-smoke | ✅ green, deployed |
| 2026-09-20 | M0.1: tsc+vitest(6)+build | ✅ green (299 KB / 98.5 KB gzip) |
| 2026-09-20 | M1: tsc+vitest(44)+build | ✅ green (361 KB / 118 KB gzip) |
| 2026-09-20 | M2: tsc+vitest(80)+build | ✅ green (443 KB / 142 KB gzip) |
| 2026-09-20 | M2.1 fixes: tsc+vitest(85)+build | ✅ green — GLM key self-heal (stale-defaults migration even with key set, endpoint probe, error hints) + German TTS voice race fix |
| 2026-09-20 | M3: tsc+vitest(100)+build(540 KB/169 KB gzip)+dev-smoke 200 | ✅ green — LLM services, 11 scenarios, conversation UI, AI drill gen / explain / examples |
| 2026-09-20 | M1.1: tsc+vitest(101)+build+dev-smoke | ✅ green — vocab corpus 449→1,028 (A1 381/A2 345/B1 302, unique headwords), rank-refresh seeding, anytime practice + extra new-word sessions |
| 2026-09-20 | M1.2: tsc+vitest(119)+build(620.7 KB/193.4 KB gzip)+dev-smoke 200 | ✅ green — verbForms engine (255 corpus verbs: Präsens/Präteritum/Perfekt, 18 new tests incl. full-corpus coverage), noun plurals + verb conjugation on flashcards, `/words` word-bank page with search/filter/sort + practice |
| 2026-09-20 | M2.2: tsc+vitest(124)+build+dev-smoke 200 | ✅ green — CORS root cause found via curl preflights (api.z.ai unusable from browsers; bigmodel.cn OK), GLM default endpoint healed, gpt-5/o-series adapter params, model dropdown (no more password-manager popup), 5 new adapter tests |
| 2026-09-20 | M2.3: tsc+vitest(126)+build+dev-smoke 200 | ✅ green — role-play JSON failures root-caused (600-token cap truncated growing replies; identical-message retries), corrective retry loop + truncation detection + bigger caps, gpt-5 reasoning_effort low |
| 2026-09-20 | M4.1: tsc+vitest(135)+build+dev-smoke 200 | ✅ green — Speak & Listen trainer at `/practice`: TTS listening drills + mic speaking drills with matcher feedback, SM-2 integrated, 9 new engine tests |
| 2026-09-21 | M4: tsc+vitest(142)+build(634.1 KB/196.8 KB gzip)+dev-smoke 200+node --check sw.js+dist PWA assets | ✅ green — PWA (manifest + subpath-scoped SW, 192/512/maskable icons), export/import verified, README final, v1.0.0 |
| 2026-09-21 | Docs: Phase 2 plan committed (M4.2→M11, accounts/teaser/payments) + tsc+vitest(142)+build | ✅ green — `docs/PHASE2_PLAN.md`, ROADMAP/AGENT/MASTER_PROMPT/README updated |
| 2026-09-21 | M4.2: tsc+vitest(142)+build+dev-smoke 200 | ✅ green — Getting-started card in Settings, API-key manuals, dashboard focus CTA + setup hint, Roadmap card & MilestoneStub removed, version footer, v1.0.1 |
| 2026-09-21 | M5.1: tsc+vitest(142)+build(732.8 KB JS)+dev-smoke 200 | ✅ green — B2 vocab corpus 1,028→1,902 headwords (874 B2 rows incl. 94 phrases, zero collisions), B2 wired into seed/index + counts test, verbForms +26 irregulars/+25 separables/+11 sein-verbs, phrase headwords excluded from conjugation, v1.1.0 |
