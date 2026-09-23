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
- Provider facts, live-verified 2026-09-20 (curl OPTIONS preflights from github.io + localhost origins):
  api.z.ai (coding AND paas endpoints) answers preflight 200 but sends NO access-control-allow-origin
  → z.ai keys (incl. GLM Coding Plan Lite) CANNOT be used from the browser app ("Failed to fetch").
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

## Resume protocol for a new agent

1. `git log --oneline -8` + read `ROADMAP.md` → know exactly what's done and what's next.
2. Run the verification gate — it must already be green before you change anything.
3. Build the next unchecked item from `ROADMAP.md` (Phase 2 milestones: `docs/PHASE2_PLAN.md`).
   Update ROADMAP + relevant docs as you go.
4. Gate → docs → secrets scan → commit → `git push origin main --tags` → verify CI+deploy green
   (`/opt/homebrew/bin/gh run list --limit 3`) → verify live URL.
