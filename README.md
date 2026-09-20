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
| Zhipu GLM | `https://api.z.ai/api/paas/v4` | `glm-4-flash` | https://z.ai / https://open.bigmodel.cn → API Keys |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | https://platform.openai.com/api-keys |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` | https://platform.deepseek.com/api_keys |

Notes:
- **GLM Coding Plan members** (e.g. the Lite plan): your plan key uses a dedicated endpoint —
  set the base URL to `https://api.z.ai/api/coding/paas/v4` in Settings.
- Keys obtained on the **international Z.AI platform** use the `api.z.ai` base; keys from the
  **Chinese BigModel platform** use `https://open.bigmodel.cn/api/paas/v4`.
- The Flash model lineup changes over time (e.g. `glm-5.3-flash`). If *Test connection* fails,
  copy the exact model ID shown in your provider console and paste it into the Model field —
  the app never needs a code change for that.

## Browser support

- **Chrome / Edge (recommended):** full experience including speech input (microphone).
- **Safari:** text-to-speech works; microphone input is limited.
- **Firefox:** no microphone support — the app automatically falls back to typing.

## Your data

- Stored locally in IndexedDB (per browser profile). Nothing is sent anywhere except your own
  LLM API requests.
- **Settings → Data** offers full JSON export/import backup, progress reset, and factory reset.
- Use export regularly if you clear browser data.

## Roadmap

- **M0** Foundation: scaffold, DB, Settings & Admin hub, LLM adapter + test connection, speech
  adapters, CI/CD, GitHub Pages. ✅
- **M1** Vocabulary core: seed corpus, SRS engine, daily lesson planner, flashcards/drills.
- **M2** Grammar core: topic tree, exercise runner + rule-based grader, placement quiz.
- **M3** AI layer: conversation role-plays (incl. Fitnessstudio), feedback reports, LLM
  drill-item generation.
- **M4** Polish: speaking/listening drills, PWA/offline, final QA.

A future iOS app will wrap this same UI via Capacitor with native speech and iCloud sync.
