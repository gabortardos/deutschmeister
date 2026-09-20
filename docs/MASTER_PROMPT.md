# MASTER PROMPT v2 — Build "DeutschMeister" (German Learning App, Browser MVP)

> v2 changes (2026-09-20), requested by the owner:
> 1. Added **VERSION CONTROL & VERIFICATION GATE** — test after every step; only ship green builds.
> 2. Added **HANDOFF READINESS** — repo must be perfectly usable by ANY other AI agent (Claude, GPT,
>    Gemini, DeepSeek…) or human, with zero tribal knowledge.
> 3. Added **API KEY HANDLING** — keys pasted in chat may be live-verified via curl but NEVER
>    committed; keys enter the app via Settings or the self-cleaning `#/settings?key=` URL fragment.
> 4. GLM provider defaults updated from a LIVE verification with a real GLM Coding Plan (Lite) key.
> Status: **M0 ✅ (commit 8f91ba8, live) · M0.1 ✅ (handoff hardening) · M1 in progress.**

## ROLE
You are a senior full-stack engineer and educational software architect. Build this app
incrementally, milestone by milestone, verifying each before moving on. Work in the current
workspace directory (it is dedicated to this project only — never touch anything outside it).
The project lives in its own fully isolated git repo. **You never need permission for decisions
already locked in this document — build them. If the user gave you a "don't stop" instruction,
continue milestone after milestone until the work or your context budget is exhausted, then
report state.**

## VERSION CONTROL & VERIFICATION GATE (v2 — mandatory)
- After EVERY development step (feature, fix, refactor, content batch): run the full gate:
  `npx tsc --noEmit && npm test -- --run && npm run build`. If anything fails → fix → re-run
  until 100% green. A step is DONE only when the gate is green.
- **Only overwrite the last working version when all tests passed**: never commit, never push,
  and never let CI/deploy see a red build. The live GitHub Pages site is only ever replaced by
  a fully green build.
- Tag `m0`, `m1`, `m2`, … at each verified milestone, and keep a moving tag `last-working` on
  the newest verified commit, so any future agent can diff/rollback mechanically:
  `git tag -f last-working && git push origin main --tags`.
- Update `ROADMAP.md` (status table + verification log) in the SAME commit as the work.
- Before every commit: secrets scan of staged files (see GIT section) — abort on hits.

## HANDOFF READINESS (v2 — mandatory)
The repo must be perfectly set up for a DIFFERENT AI model (OpenAI, Claude, DeepSeek, Gemini…)
or human to take over development at any milestone boundary:
- `AGENT.md` (root) — single source of truth: commands, gate, conventions, architecture map,
  environment quirks (quoted paths with spaces, `/opt/homebrew/bin/gh`, Node 20), provider
  facts, resume protocol. Keep it current.
- `ROADMAP.md` (root) — live ledger: milestone status table, per-milestone checklists with
  file-level pointers, verification log. Update every milestone commit.
- `CLAUDE.md`, `GEMINI.md`, `AGENTS.md` (root) — short pointers to AGENT.md so any agent's
  auto-loaded context file finds the handoff.
- `docs/MASTER_PROMPT.md` — this document, the full product spec, versioned in-repo.
- Conventional commits (`M1: …`), tags per milestone, main-only branch, no force-push.
- README: setup, architecture, provider table, deploy notes — accurate at all times.
- Handoff test: a fresh agent reading only AGENT.md → ROADMAP.md → this file must be able to
  run the gate green and continue the next checklist item without asking the user anything
  that is already decided here.

## API KEY HANDLING (v2 — mandatory)
- Keys exist ONLY in the browser: localStorage via the Settings hub, or the one-time URL
  fragment `#/settings?key=…` (fragment never reaches any server; app stores the key and
  strips the URL immediately). Implementation: `src/llm/keyStore.ts`, storage key `dm.apiKey`.
- If the user pastes a key in chat, the agent MAY use it for live `curl` verification against
  provider endpoints (this is how provider defaults get locked in), but must NEVER write it
  into any file, log, commit, or docs — and must never echo it back in full.
- Never hardcode keys. Never commit them. Grep staged diffs for key-like patterns pre-commit.

## PRODUCT VISION
A local-first, single-user browser app that takes a re-lapping learner (known A1–A2, rusty)
from review level to solid B1 German, and is architecturally ready to extend to C2 and to a
future iOS app. Core learning loop: every day the app serves 3–5 new German words plus the
grammar point that belongs to them, drills them with interactive exercises (written AND
spoken), schedules spaced repetition, and provides LLM-powered role-play conversations with
structured feedback. NO gamification (no XP, streaks, leagues, hearts). The metric is learning.
The app is hosted on a free public HTTPS URL (GitHub Pages) from the very first working version,
and ALL configuration is done in-app via a Settings & Admin hub — the user never edits code.
## LOCKED DECISIONS — do not revisit, do not ask again
1. Single user (no auth), but all data lives under a single profile entity so multi-user and
   cloud sync can be added later without schema rewrites. On the public URL every browser gets
   its own private local profile — nothing is shared server-side.
2. Hybrid architecture: DETERMINISTIC core (curated vocab + grammar syllabus + rule-based
   grading + SRS scheduling, all offline and free) + LLM dynamism (conversation role-play,
   example sentences, personalized grammar explanations, generation of NEW drill items that
   are schema-validated then cached as durable data). The LLM never grades closed drills.
3. LLM access: provider-agnostic OpenAI-compatible adapter. Providers (user brings own key,
   entered in-app, stored in localStorage): OpenAI (base https://api.openai.com/v1, default
   model gpt-4o-mini), Zhipu GLM, DeepSeek (base https://api.deepseek.com, default model
   deepseek-chat). **GLM defaults are LIVE-VERIFIED (2026-09-20) with a GLM Coding Plan (Lite)
   key: base https://api.z.ai/api/coding/paas/v4, model glm-4.6 (endpoint serves current
   glm-5.3-flash), request extra body `thinking:{type:"disabled"}` → ~1.3 s replies. Findings:
   glm-4-flash retired (code 1211); glm-5.3-flash on standard endpoints needs balance (1113);
   standard pay-as-you-go endpoints remain https://api.z.ai/api/paas/v4 and
   https://open.bigmodel.cn/api/paas/v4.** The provider BASE URL and MODEL ID are always
   editable free-text in Settings, so endpoint/name changes never require a code change.
   No backend server, ever.
4. Speech (oral exercises, input AND output): Web Speech API only. TTS via speechSynthesis
   (prefer de-DE voice, default rate 0.9, configurable). STT via SpeechRecognition/
   webkitSpeechRecognition (lang de-DE). ALWAYS feature-detect and degrade gracefully to text
   input; recommend Chrome/Edge in the UI when STT is unavailable. ALL speech code lives in
   src/speech/ behind interfaces so the future iOS (Capacitor) build can swap native speech in.
5. Daily goal: N new words (default 5, configurable 1–10) + 1 active grammar topic. Grammar
   topic advances when its drills reach mastery, otherwise stays in rotation.
6. Curriculum data model covers CEFR A1–C2; seeded content covers A1–B1 (≥400 vocab items,
   ~35 grammar topics). Level tags on everything.
7. UI language: English. Learning content: German with English translations.
8. Responsive, mobile-friendly layout (becomes the iOS app's web view later).
9. Routing: HashRouter (required for SPA reliability on GitHub Pages subpath hosting).
10. Hosting: GitHub Pages, public repo named "deutschmeister", auto-deployed by GitHub Actions
    on every push to main. Vite base path must be "/deutschmeister/".

## TECH STACK (fixed)
- React 18 + Vite + TypeScript (strict, no `any`), Tailwind CSS
- Routing: react-router (HashRouter) · State: Zustand · DB: Dexie.js (IndexedDB)
- Validation of all LLM output: zod · Tests: Vitest (+ React Testing Library where useful)
- Node 20+, npm · CI: GitHub Actions · Hosting: GitHub Pages via Actions
- PWA (manifest + service worker respecting the /deutschmeister/ subpath) in M4.

## ARCHITECTURE / FOLDER STRUCTURE
src/app (routing, layout) · src/components (UI primitives, exercise components) ·
src/features/{dashboard,vocab,grammar,review,conversation,placement,settings} ·
src/engine (pure TS: srs, grader, lessonPlanner, textMatcher) ·
src/llm (adapter, provider registry, prompts, zod schemas, cache, keyStore) ·
src/content (seed vocab, seed grammar, scenario library) ·
src/db (Dexie schema + repositories — features never touch Dexie directly) ·
src/speech (tts/stt adapters) · src/utils ·
.github/workflows/ci.yml and deploy.yml (defined in GIT & DEPLOYMENT section).
Engine, llm, and speech modules must be pure/testable with no React imports.

## DATA MODEL (Dexie tables; every row: string UUID pk via crypto.randomUUID, updatedAt)
- UserProfile: name, level (A1..C2), dailyWordGoal, currentGrammarTopicId, placementResult
- VocabWord (seed corpus): german, article?, plural?, english, cefr, theme, frequencyRank,
  exampleSentenceDe, exampleSentenceEn, custom (bool)
- VocabCard (SRS state per word): wordId, ease, intervalDays, repetitions, dueDate, lapses,
  state (new/learning/review), introducedDate
- GrammarTopic: title, cefr, order, explanationMd (seed), focus, relatedVocabTheme
- DrillItem: ownerId (grammarTopicId or wordId), type
  (cloze|choice|transform|wordorder|translate_de_en|translate_en_de|listen|speak),
  prompt, promptData?, acceptedAnswers[], cefr, source (seed|llm), validated
- DrillAttempt: itemId, correct, userAnswer, transcript?, at
- ConversationSession: scenarioId, startedAt, endedAt, summary?
- ConversationTurn: sessionId, role (user|tutor), text, mistakes[]?, translation?
- LessonLog: date, newWordIds[], grammarTopicId, drillsDone
- Scenario: id, title, cefr, emoji, description, goal, keyPhrases[{de,en}], custom (bool)
- Settings: provider, baseUrl, model, ttsVoice, ttsRate, sttEnabled (API key in localStorage)
- LlmCache: key (hash of request), payload, createdAt
## ENGINE SPECS (pure TS, unit-tested)
- SRS: SM-2 (quality 0–5, ease factor ≥1.3, fail → relearn same/next day). Schema migratable
  to FSRS later. Due queue = all cards with dueDate ≤ today.
- Grader (closed drills): normalize both sides (trim, lowercase, collapse whitespace, strip
  trailing punctuation; accept umlaut variants ä→ae, ö→oe, ü→ue, ß→ss in BOTH directions;
  accept article-optional answers when the drill targets the noun). Correct if normalized
  answer ∈ acceptedAnswers (normalized).
- Speech matcher: same normalization + Levenshtein similarity ≥0.85 → correct; 0.7–0.85 →
  "almost" with target-vs-heard diff; <0.7 → incorrect.
- LessonPlanner (daily): pick dailyWordGoal unseen words ordered by frequencyRank, biased
  toward the current grammar topic's theme; attach current grammar topic; emit today's plan;
  idempotent per calendar date; manually regenerable from Settings.

## LLM SERVICE CONTRACTS
One adapter: chatJSON(provider, baseUrl, key, model, messages, schema) calling the
OpenAI-compatible /chat/completions endpoint at the configured base URL. Request JSON output
in the prompt (and response_format where supported), parse defensively, validate with zod,
retry up to 2× on invalid JSON, then surface a friendly error. Cache successful generations
in LlmCache. All LLM features hide themselves gracefully when no key is set or the network
fails — drills and SRS keep working fully offline. Functions (system prompt + zod schema each):
1. conversationTurn(scenario, level, history, userText) → { reply (German, level-appropriate,
   natural), mistakes[] ({said, corrected, type}), replyTranslationEn, tutorQuestion } —
   persona: friendly patient German speaker, stays in character, does NOT interrupt with
   corrections but tracks mistakes.
2. sessionFeedback(history) → { overallScore, strengths[], mistakes[] with category
   (gender/case/word-order/vocab/verb-form/other), recommendedDrillTopics[] } → end-of-session
   report with an "Add mistakes as drills" action.
3. generateDrillItems(grammarTopic, words, n) → DrillItem[] (zod-validated, source=llm,
   validated=true, cached). Also exposed as a per-topic button in Content Studio.
4. explainGrammar(topic, mistakesContext) → markdown explanation in English with German
   examples, tailored to recent errors.
5. exampleSentences(word, n) → contextual German sentences + translations, level-tagged.
## SETTINGS & ADMIN HUB (first-class, in-app, from M0 — replaces ALL code editing)
Sections (persisted instantly, effective without reload or rebuild):
- AI Model: provider select (OpenAI / Zhipu GLM / DeepSeek), EDITABLE provider base URL
  (advanced; auto-filled with the per-provider default, user may override), masked API-key
  input (localStorage only, never committed) + self-cleaning `#/settings?key=` URL import,
  model free-text with per-provider defaults, "Test connection" button (minimal real request;
  shows base URL, model, latency, ok/error — this is how the user resolves any provider
  rename/endpoint change themselves).
- Learning: daily word goal (1–10), CEFR level override, re-run placement, regenerate today's
  lesson plan, grammar topic manual advance/reset.
- Speech: TTS voice picker (de-DE voices) + rate slider + preview button, STT availability
  indicator with browser guidance, voice features enable/disable.
- Content Studio: add custom words (all fields) and custom scenarios; per-grammar-topic
  "Generate 5 more drills with AI"; LLM cache stats + clear cache.
- Data: export full backup JSON (all tables), import/restore (with confirm), reset progress
  (keeps content), full factory reset (also clears localStorage key + diagnostics).
- Diagnostics: storage usage, app version, last 10 LLM call statuses (never log keys),
  environment (hosted URL vs localhost).
The same hub ships unchanged in the future iOS app.

## SCREEN SPECS
- Onboarding/Placement: create profile → ~15–20 adaptive mixed quiz (vocab recognition +
  grammar cloze sampled A1→B2, harder while correct) → sets level, marks known words, suggests
  starting topic. Skippable (default A1 start).
- Dashboard "Today": daily goal progress (new words X/N + grammar topic done ✓), due-review
  count, Continue buttons, quick nav. Clean, information-dense, no game visuals.
- Vocab: flashcards both directions (de→en, en→de), multiple choice, typing with article.
  Card detail: article, plural, example sentence, TTS play button.
- Grammar: topic tree grouped by CEFR (A1→B1 seeded); topic page = explanation (seed markdown
  + "Explain for me" LLM button) + drill set; mastery bar per topic.
- Review: mixed due queue across vocab+grammar, all exercise types.
- Conversation: scenario library grid — seed at least: Café bestellen (A1), Bäckerei (A1),
  Supermarkt (A1), Öffentliche Verkehrsmittel/Ticket kaufen (A1), Arzttermin (A2/B1),
  Bürgeramt Anmeldung (B1), Nachbar small talk (A2), Wohnungssuche (B1), Telefonieren (B1),
  Arbeit/Besprechung (B2), Fitnessstudio (A2/B1 — REQUIRED: machine usage, duration, machine
  types, weights/reps/sets, training with a partner; e.g. "Wie funktioniert dieses Gerät?",
  "Wie lange trainierst du schon?", "Kannst du mir zeigen, wie die Beinpresse funktioniert?",
  "Ich mache 3 Sätze mit 12 Wiederholungen", "Wie viel Gewicht soll ich nehmen?") —
  role-play chat: text always; mic button for voice input (STT) and speaker button on tutor
  messages (TTS); "Hint" button (LLM-suggested reply, marked assisted); end session →
  feedback report + "practice mistakes as drills".
- Settings & Admin hub: as specified above.

## SEED CONTENT REQUIREMENTS (author carefully — correct German, real umlauts/ß)
- ≥400 vocab words A1–B1: top-frequency German per schema above, themed (Food, Travel,
  Body/Health, Home, Work, Fitness/Sport, Time, Emotions, Verbs...).
- ~35 grammar topics A1→B1 in CEFR order: pronouns/sein/haben, present tense regular+
  irregular, verb-second word order, questions, akkusativ, dativ, articles, negation
  (nicht/kein), possessives, modal verbs, separable verbs, perfekt, präteritum common verbs,
  wechselpräpositionen, pronouns akk/dat, adjective endings, comparative/superlative,
  subordinating conjunctions (weil/dass), dass-clauses, reflexive verbs, imperativ,
  Konjunktiv II (würde/hätte/wäre), infinitive with zu, relative clauses, genitiv, passive,
  verben mit präpositionen, conjunctive adverbs — each with concise English explanation +
  German examples + ≥6 seed drill items (mixed types).
- The 11 scenarios above with keyPhrases seed.
## GIT, GITHUB, CI & DEPLOYMENT (from M0 onward)
- GitHub CLI is installed at /opt/homebrew/bin/gh and already authenticated as "gabortardos"
  (token scopes include repo + workflow). If a shell cannot find gh, use the full path.
- Workspace path contains spaces — ALWAYS quote it in shell commands.
- M0 step 1: git init in the workspace; set repo-local identity if global user.name/email are
  missing; write .gitignore (node_modules, dist, .DS_Store, *.local, .env*); first commit.
- Remote: gabortardos/deutschmeister (public), Pages via Actions (build_type=workflow).
- Per milestone: conventional commit (e.g. "M1: vocab SRS engine, drills, dashboard"), tags
  `m1` + moving `last-working`, push to origin main — ONLY after the verification gate is green.
- .github/workflows/ci.yml — on push/PR to main: Node 20, npm ci, npx tsc --noEmit,
  npm test -- --run, npm run build.
- .github/workflows/deploy.yml — on push to main: build (vite base "/deutschmeister/"),
  upload dist via actions/upload-pages-artifact, deploy via actions/deploy-pages; workflow
  needs permissions: pages: write, id-token: write; environment: github-pages.
- vite.config.ts: base: "/deutschmeister/". Router: HashRouter. PWA service worker registered
  with correct subpath scope.
- Secrets policy: API keys exist ONLY in the browser's localStorage via the Settings hub;
  never hardcode keys, never commit them; before each commit, grep staged files for key-like
  patterns (sk-, Bearer, api_key) and abort the commit if found.

## MILESTONES — build in order, verify each before the next (commit + push per milestone)
- M0 Foundation ✅ DONE (commit 8f91ba8, live): everything in GIT/GITHUB section; Vite+React+TS+
  Tailwind scaffold; HashRouter routing; layout/nav shell; Dexie schema + repositories +
  profile creation; full Settings & Admin hub; speech adapters with feature detection; CI +
  Pages workflows. DoD: `npm run dev` boots, `npx tsc --noEmit` clean, profile + settings
  persist across reloads, repo pushed, live URL serves the app shell.
- M0.1 Handoff hardening ✅ DONE: apiKey moved to localStorage (keyStore + URL-fragment
  import `#/settings?key=`), UI primitives moved to src/components/, GLM defaults replaced
  with live-verified values (coding endpoint + glm-4.6 + thinking disabled), AGENT.md +
  ROADMAP.md + CLAUDE.md/GEMINI.md/AGENTS.md + docs/MASTER_PROMPT.md (v2) added, git tags m0 +
  last-working. DoD: gate green, deployed, handoff docs complete.
- M1 Vocab core: seed corpus; SRS engine (unit-tested); lesson planner; flashcard/choice/
  typing drills; Dashboard "Today"; due review queue. DoD: a full study day simulatable; due
  dates advance correctly; `npm test` covers srs + grader + matcher.
- M2 Grammar core: topic tree; seed grammar content; exercise runner (cloze/transform/
  wordorder/translate) with rule-based grader; mastery tracking; placement quiz. DoD: all
  exercise types playable via keyboard (Enter submits); grader accepts umlaut variants.
- M3 LLM layer: adapter + provider registry + zod contracts + cache; conversation module with
  scenarios, hints, STT voice input, TTS playback, end-of-session feedback with
  mistakes→drills; LLM drill-item generation (also via Content Studio) + "Explain for me".
  DoD: works with a real key against all three providers (user tests GLM + OpenAI via the
  in-app Test Connection button); invalid JSON recovers; no-key mode fully functional offline.
- M4 Polish: speaking drills (see English → say German, matcher diff feedback), listening
  drills (TTS), PWA manifest + offline caching under the subpath, data export/import,
  README (setup, env, GitHub/Pages notes, browser-support notes), clean `npm run build`.

## QUALITY GUARDRAILS
- TypeScript strict everywhere; zod-validate every LLM response; never log or transmit the
  API key beyond the provider call; German content uses proper orthography (ä ö ü ß).
- Engine modules pure + unit-tested; no React imports in src/engine, src/llm, src/speech.
- No backend, no new paid dependencies, no mock/fake progress masquerading as real.
- No gamification UI. All user-facing configuration happens in the Settings & Admin hub.
- Future iOS path: any Capacitor-incompatible API sits behind an adapter (speech, storage,
  LLM fetch).
- If seed content proves too large for one pass, prioritize depth on A1–A2 first (user is
  re-learning), then B1 — never ship placeholder lorem German.
- The verification gate and handoff rules (see top sections) apply to EVERY step, not just
  milestones.

## OUT OF SCOPE (do not build now)
Auth/accounts, cloud sync, C1–C2 content, native iOS packaging, push notifications,
STT beyond Web Speech API, gamification.
