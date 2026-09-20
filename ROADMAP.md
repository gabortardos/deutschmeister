# ROADMAP.md — live milestone ledger

> Update this file in the same commit as the work it describes. It is the shared memory
> between AI agents (and humans) working on this repo. Full spec: `docs/MASTER_PROMPT.md`.

## Status: M0 ✅ · M0.1 ✅ · M1 ✅ · M2 ✅ · M2.1 ✅ · M3 ✅ · M4 ⬜

| Milestone | State | Commit | Notes |
|---|---|---|---|
| M0 Foundation | ✅ done | `8f91ba8` | app shell, Dexie+repos, Settings hub, speech+LLM adapters, CI/CD, live |
| M0.1 Handoff hardening | ✅ done | (this commit) | apiKey→localStorage, `src/components/`, `#/settings?key=` import, live-verified GLM defaults, AGENT/ROADMAP/MASTER_PROMPT docs |
| M1 Vocab core | ✅ done | (this commit) | 449-word corpus (A1 180 / A2 150 / B1 119), SM-2 + planner + grader + matcher engines, vocabRepo/lessonRepo, Vocab/Review/Today UI |
| M1.1 Vocab expansion | ✅ done | (this commit) | corpus 449 → **1,028 words** (A1 381 / A2 345 / B1 302) from German frequency lists, append-stable ids + rank-refresh seeding, Vocab "Want more?" card: anytime practice of learned words + extra new-word sessions (5/10/15/20), v0.6.0 |
| M1.2 Word forms + word bank | ✅ done | (this commit) | `src/engine/verbForms.ts` conjugation engine (Präsens 6 persons, Präteritum, Perfekt; 80-entry irregular table, separable compose, sein/haben choice) shown on flashcards + word bank; new `/words` Word-bank page: search/filter/sort learned words, expandable forms & SRS status, practice-from-filter, v0.7.0 |
| M2 Grammar core | ✅ done | (this commit) | 35 topics (A1 13 / A2 12 / B1 10), runner+mastery+placement engines, grammarRepo, PLACEMENT_BANK 30, Grammar/Topic/Placement UI, v0.4.0-m2 |
| M2.1 Fixes | ✅ done | `aea0bda` | GLM key self-heal (stale-defaults migration, endpoint probe, error hints) + German TTS voice race fix, v0.4.1 |
| M3 LLM layer | ✅ done | (this commit) | 5 zod service contracts + LlmCache, 11 scenarios, conversation UI (STT/TTS/hints/feedback→drills), AI drill gen + "Explain for me" + AI examples, v0.5.0-m3 |
| M4 Polish | ⬜ | — | speak/listen drills, PWA, README |

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

- [ ] Speaking drills (see English → say German, diff feedback), listening drills (TTS)
- [ ] PWA: manifest + service worker scoped to `/deutschmeister/`
- [ ] README final (setup, env, browsers); clean build

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
