# ROADMAP.md — live milestone ledger

> Update this file in the same commit as the work it describes. It is the shared memory
> between AI agents (and humans) working on this repo. Full spec: `docs/MASTER_PROMPT.md`.

## Status: M0 ✅ · M0.1 ✅ · M1 ✅ · M2–M4 ⬜

| Milestone | State | Commit | Notes |
|---|---|---|---|
| M0 Foundation | ✅ done | `8f91ba8` | app shell, Dexie+repos, Settings hub, speech+LLM adapters, CI/CD, live |
| M0.1 Handoff hardening | ✅ done | (this commit) | apiKey→localStorage, `src/components/`, `#/settings?key=` import, live-verified GLM defaults, AGENT/ROADMAP/MASTER_PROMPT docs |
| M1 Vocab core | ✅ done | (this commit) | 461-word corpus (A1 184 / A2 154 / B1 123), SM-2 + planner + grader + matcher engines, vocabRepo/lessonRepo, Vocab/Review/Today UI |
| M2 Grammar core | ⬜ | — | topic tree, drill runner, grader, placement |
| M3 LLM layer | ⬜ | — | adapter features, conversations, feedback, drill gen |
| M4 Polish | ⬜ | — | speak/listen drills, PWA, README |

## M1 checklist (vocab core)

- [x] `src/content/vocab/` seed corpus ≥400 words A1–B1 (themes, frequencyRank, examples) — 461 words, integrity-tested
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

- [ ] `src/content/grammar/` ~35 topics A1→B1 (explanationMd, focus, relatedVocabTheme, ≥6 seed drills each)
- [ ] Exercise runner: cloze | choice | transform | wordorder | translate_de_en | translate_en_de; Enter submits
- [ ] Mastery tracking per topic; topic tree grouped by CEFR
- [ ] Placement quiz (15–20 adaptive items → level + known words), skippable

## M3 checklist (LLM layer)

- [ ] 5 service contracts with zod schemas + LlmCache: conversationTurn, sessionFeedback,
      generateDrillItems, explainGrammar, exampleSentences
- [ ] Scenario library: 11 seed scenarios (incl. Fitnessstudio A2/B1 — machines, duration,
      weights/reps/sets, training partner)
- [ ] Conversation UI: text + STT mic + TTS speaker + Hint button (marked assisted)
- [ ] End-of-session feedback + "add mistakes as drills"; "Explain for me" on grammar pages
- [ ] Content Studio: "Generate 5 more drills with AI" per topic; cache stats
- [ ] DoD: verified with GLM coding-plan key via Test Connection; invalid JSON recovers; no-key mode fully offline

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
