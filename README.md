# DeutschMeister 🇩🇪

A local-first, single-user browser app for learning German — daily vocabulary with spaced
repetition, interactive grammar drills (written **and** spoken), and LLM-powered role-play
conversations with structured feedback. No backend, no accounts: all data lives in your
browser (IndexedDB), and your API key never leaves your browser's localStorage.

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
| Zhipu GLM (Coding Plan) | `https://api.z.ai/api/coding/paas/v4` | `glm-4.6` | https://z.ai (Coding Plan keys) |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | https://platform.openai.com/api-keys |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` | https://platform.deepseek.com/api_keys |

Notes:
- GLM defaults above were **live-verified** (2026-09-20) with a GLM Coding Plan (Lite) key:
  the coding endpoint serves `glm-4.6` as the current flash model, and the app automatically
  disables GLM "thinking mode" for fast replies (~1.3 s). `glm-4-flash` is retired; `glm-5.3-flash`
  on the standard endpoints requires a paid balance.
- **Pay-as-you-go GLM keys** instead use `https://api.z.ai/api/paas/v4` (international Z.AI)
  or `https://open.bigmodel.cn/api/paas/v4` (Chinese BigModel platform).
- The model lineup changes over time. If *Test connection* fails, copy the exact model ID
  shown in your provider console and paste it into the Model field — the app never needs a
  code change for that.
- Tip: you can load a key without typing it — open
  `https://gabortardos.github.io/deutschmeister/#/settings?key=YOUR_KEY`. The URL fragment
  never reaches a server; the app stores the key in localStorage and cleans the URL instantly.

## Browser support

- **Chrome / Edge (recommended):** full experience including speech input (microphone).
- **Safari:** text-to-speech works; microphone input is limited.
- **Firefox:** no microphone support — the app automatically falls back to typing.

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
- **M1** Vocabulary core: seed corpus, SRS engine, daily lesson planner, flashcards/drills.
- **M2** Grammar core: topic tree, exercise runner + rule-based grader, placement quiz.
- **M3** AI layer: conversation role-plays (incl. Fitnessstudio), feedback reports, LLM
  drill-item generation.
- **M4** Polish: speaking/listening drills, PWA/offline, final QA.

A future iOS app will wrap this same UI via Capacitor with native speech and iCloud sync.
