# DeutschMeister 🇩🇪

A local-first, single-user browser app for learning German — daily vocabulary with spaced
repetition, interactive grammar drills (written **and** spoken), and LLM-powered role-play
conversations with structured feedback. No backend, no accounts: all data lives in your
browser (IndexedDB), and your API key never leaves your browser's localStorage. (Optional
accounts and cloud sync arrive in Phase 2 — see the Roadmap below — while the app stays fully
usable without them.)

## Live URL

https://gabortardos.github.io/deutschmeister/

Every push to `main` is auto-deployed by GitHub Actions.

## Quickstart (local development)

```bash
npm install
npm run dev        # dev server
npm test           # unit tests (engine)
npm run typecheck  # strict TypeScript check
npm run build      # production build
npm run preview    # serve the production build
```

Requires Node 20+.

## Configuring the AI (Settings → AI Model, in-app)

All AI configuration happens inside the app — no code editing needed:

| Provider | Default base URL | Default model | Where to get a key |
|---|---|---|---|
| Zhipu GLM (bigmodel.cn) | `https://open.bigmodel.cn/api/paas/v4` | `glm-4.5-flash` | https://open.bigmodel.cn/usercenter/apikeys |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | https://platform.openai.com/api-keys |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` | https://platform.deepseek.com/api_keys |

Notes:
- **CORS reality (verified 2026-09-20 via OPTIONS preflight):** `api.z.ai` (both the Coding Plan
  and pay-as-you-go endpoints) sends **no CORS headers**, so z.ai keys — including GLM Coding
  Plan (Lite) keys — **cannot be used from this browser app at all** (the browser blocks every
  request: "Failed to fetch"). The coding endpoint does work server-side (`glm-4.6` via curl,
  ~1.3 s replies, thinking mode auto-disabled by the app).
- GLM in the browser works only via `https://open.bigmodel.cn/api/paas/v4` (Zhipu's BigModel
  platform, full CORS support) with a **bigmodel.cn API key** — z.ai keys are platform-specific
  and rejected there. `glm-4.5-flash` is free-tier; `glm-4-flash` is retired; `glm-5.3-flash`
  needs a paid balance. No bigmodel.cn key? Use OpenAI or DeepSeek — both are browser-compatible.
- The model lineup changes over time. Pick a model from the dropdown (or *Custom…* to paste any
  ID) — the app never needs a code change for that. OpenAI reasoning models (gpt-5+, o-series)
  are auto-handled: the adapter sends `max_completion_tokens` and omits `temperature` for them.
- Tip: you can load a key without typing it — open
  `https://gabortardos.github.io/deutschmeister/#/settings?key=YOUR_KEY`. The URL fragment
  never reaches a server; the app stores the key in localStorage and cleans the URL instantly.

## Browser support

- **Chrome / Edge (recommended):** full experience including speech input (microphone).
- **Safari:** text-to-speech works; microphone input is limited.
- **Firefox:** no microphone support — the app automatically falls back to typing.

## Install as an app (PWA)

DeutschMeister is an installable PWA, scoped to `/deutschmeister/`:

- **Chrome / Edge:** menu → *Install DeutschMeister…* (or the install icon in the address bar).
- **Safari (iOS 16.4+):** Share → *Add to Home Screen*.
- **Offline:** after the first visit, the app shell and assets are cached by a small
  dependency-free service worker (`public/sw.js`). Vocab SRS, grammar drills, the word bank,
  Speak & Listen and your reviews keep working offline; AI conversation features need a
  connection (your LLM API traffic is never intercepted by the service worker).
- **Updates:** the app shell is fetched network-first, so new deploys are picked up on the next
  online visit — the cache only kicks in when you are offline.

## Your data

- Stored locally in IndexedDB (per browser profile). Nothing is sent anywhere except your own
  LLM API requests.
- **Settings → Data** offers full JSON export/import backup, progress reset, and factory reset.
- Use export regularly if you clear browser data.

## Handoff to any AI agent or developer

This repo is set up so **any** AI coding agent (Claude, GPT, Gemini, DeepSeek, Copilot…) or
human can take over development with zero tribal knowledge:

1. Read `AGENT.md` — commands, conventions, verification gate, environment quirks.
2. Read `ROADMAP.md` — current milestone status and next checklist items.
3. Full product spec: `docs/MASTER_PROMPT.md`.
4. Run the gate: `npx tsc --noEmit && npm test -- --run && npm run build` — must be green
   before you change anything. Git tags `m0…` + `last-working` mark verified states.

## Roadmap

- **M0** Foundation: scaffold, DB, Settings & Admin hub, LLM adapter + test connection, speech
  adapters, CI/CD, GitHub Pages. ✅
- **M1** Vocabulary core: 1,000+-word seed corpus (A1–B1, frequency-ordered), SRS engine, daily lesson
  planner, flashcards/drills — plus anytime **practice** of learned words and **extra new-word
  sessions** beyond the daily goal. New words show their **forms** (noun plurals; verbs: Präsens
  conjugation for all six persons, Präteritum and Perfekt), and the **Word bank** page
  (browse/search/filter learned words, expand any word for forms + SRS status, practice the
  current selection). ✅
- **M2** Grammar core: topic tree, exercise runner + rule-based grader, placement quiz. ✅
- **M3** AI layer: conversation role-plays (incl. Fitnessstudio), feedback reports, LLM
  drill-item generation. ✅
- **M4** Polish: speaking/listening drills, PWA install + offline shell, data export/import
  (Settings → Data), README/browser notes, final QA. ✅

**Phase 2 (v2.x, planned — full plan: `docs/PHASE2_PLAN.md`):** M4.2 UX cleanup ✅ → M5 B2
content ✅ (B2 vocab corpus → 1,902 words · grammar 35 → 50 topics A1–B2 · conversation scenarios
11 → 20) → M6 speech (voice-quality fix, HD TTS option,
hands-free conversation) → M7 accounts (Supabase: Google + email with verification and password
reset; guest mode stays) → M8 platform-AI teaser ($1 free AI for verified accounts; your own key
stays free forever) → M9 hybrid payments (subscription and/or top-ups via Paddle/Stripe) →
M10 graphics/UI → M11 learning depth.

A future iOS app will wrap this same UI via Capacitor with native speech and iCloud sync.
