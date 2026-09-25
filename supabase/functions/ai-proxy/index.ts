// Supabase Edge Function: ai-proxy (M8/M8.2) — platform-AI teaser backend + BYO relay.
//
// What it does (Deno runtime, ZERO external imports — dashboard-paste friendly):
//   • PLATFORM paths (caller must be a signed-in, email-verified user):
//     - Rate-limits per user (≤10 metered requests/minute, checked via ai_usage).
//     - Budget check (M9): LIFETIME pools ($1 teaser + credit_usd_micros) plus the
//       MONTHLY subscription allowance — which only counts while now < valid_until.
//       Spend = SUM(ai_usage.cost_usd_micros): lifetime total + this calendar
//       month's slice (mirror of remainingBudgetWithMonthly in src/llm/entitlement.ts).
//     - type=tts → Google Cloud TTS on PLATFORM_TTS_KEY (optional); meters chars
//       ($0 while Google's Neural2 free tier covers it) against the PER-PLAN
//       monthly cap (ai_entitlements.tts_char_cap; default free taste 20k, Basic 0
//       → 403 hd-voice-not-in-plan, Plus 150k).
//     - type=usage → budget snapshot + live model/prices + plan envelope
//       (plan, ttsCharsUsed/ttsCharCap, validUntil, cancelAtPeriodEnd) for the
//       Settings meter and the Account & Billing section.
//     - Returns provider JSON verbatim + metering headers x-dm-credit-usd / x-dm-cap-usd.
//   • BYO relay (M8.2, NO account needed): POST /byo/<route>/chat/completions
//     forwards to a HARD-CODED allowlisted host with the caller's OWN key from the
//     x-dm-byo-key header. Exists because api.z.ai sends no CORS headers (verified
//     2026-09-20, re-checked 2026-09-24), so z.ai keys — GLM Coding Plan included —
//     cannot be used browser-direct; server-side they work fine. The user's key is
//     used for this one request only, never stored or logged; unmetered (their own
//     provider quota applies). Guards: POST-only, JSON body ≤ 64 KB, ≤ 30 req/min
//     per IP (best-effort, per isolate), 60 s upstream timeout, routes host-locked.
//
// Deploy (owner): Dashboard → Edge Functions → New function → name "ai-proxy" → paste
// this file → Secrets: OPENAI_PLATFORM_KEY or ZAI_PLATFORM_KEY (chat; the z.ai one
// wins when both exist) (+ PLATFORM_TTS_KEY if HD voice included).
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected automatically. Keep
// "Verify JWT with Supabase" ENABLED (the signature check happens platform-side;
// this code re-checks sub/role because the anon key is also a valid JWT — BYO relay
// callers legitimately send the PUBLIC anon key as their Authorization JWT and their
// real provider key in x-dm-byo-key).
//
// Prices/model are PUBLISHED in every usage response (M8.1); src/llm/entitlement.ts
// keeps only a bundled FALLBACK for offline clients / older deployments. Any swap
// here (secrets/model/prices) updates every client meter on its next usage refresh.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const OPENAI_KEY = Deno.env.get('OPENAI_PLATFORM_KEY') ?? ''
const ZAI_KEY = Deno.env.get('ZAI_PLATFORM_KEY') ?? ''
const TTS_KEY = Deno.env.get('PLATFORM_TTS_KEY') ?? ''

// Active platform chat target: z.ai (owner's GLM Coding Plan key) when configured,
// else OpenAI. TEASER_MODEL/PRICES always match the active target — they are
// published to clients (M8.1), so switching = set/delete the secret + redeploy.
const CHAT_TARGET: 'zai' | 'openai' = ZAI_KEY ? 'zai' : 'openai'
const TEASER_MODEL = CHAT_TARGET === 'zai' ? 'glm-4.6' : 'gpt-5-mini'
const PRICES_USD_PER_M: Record<string, { input: number; output: number }> = CHAT_TARGET === 'zai'
  ? {
    // Nominal z.ai list prices for bookkeeping — the real cost is the owner's Coding
    // Plan subscription, so the $1 teaser cap remains an abuse guard, not recovery.
    'glm-4.6': { input: 0.6, output: 2.2 },
  }
  : {
    // gpt-5-mini launch pricing ($0.25/$2 per 1M tokens) — verify at M9.
    'gpt-5-mini': { input: 0.25, output: 2 },
  }
const TEASER_CAP_USD_MICROS = 1_000_000 // $1
const RATE_LIMIT_PER_MIN = 10
/** M9 free-tier HD-voice taste (~65 spoken replies); Basic = 0, Plus = 150k. */
const FREE_TTS_CHAR_CAP = 20_000
const MAX_MESSAGES = 40
const MAX_MSG_CHARS = 8_000
const MAX_TTS_CHARS = 500
const DEFAULT_TTS_VOICE = 'de-DE-Neural2-A'

// --- BYO relay (M8.2) -------------------------------------------------------------------------

// Host-locked forwarding table. Adding an upstream here is the ONLY way to reach a
// new host from the relay; arbitrary URLs are never accepted.
const BYO_ROUTES: Record<string, string> = {
  'zai-coding': 'https://api.z.ai/api/coding/paas/v4', // GLM Coding Plan (Lite) keys
  'zai-api': 'https://api.z.ai/api/paas/v4', // z.ai pay-as-you-go keys
}
const BYO_BODY_LIMIT = 64_000
const BYO_RATE_LIMIT_PER_MIN = 30
const BYO_TIMEOUT_MS = 60_000

/** Best-effort per-IP window (per isolate — an abuse guard, not a quota). */
const byoHits = new Map<string, { n: number; resetAt: number }>()
function byoAllowed(ip: string): boolean {
  const now = Date.now()
  if (byoHits.size > 10_000) byoHits.clear()
  const hit = byoHits.get(ip)
  if (!hit || hit.resetAt <= now) {
    byoHits.set(ip, { n: 1, resetAt: now + 60_000 })
    return true
  }
  hit.n += 1
  return hit.n <= BYO_RATE_LIMIT_PER_MIN
}

/** Relay handler: forwards the caller's own chat request to the allowlisted upstream. */
async function handleByo(req: Request, route: string): Promise<Response> {
  const cors: Record<string, string> = {
    'access-control-allow-origin': req.headers.get('origin') ?? '*',
    'access-control-allow-headers': 'authorization, content-type, apikey, x-dm-byo-key',
    'access-control-allow-methods': 'POST, OPTIONS',
  }
  const reply = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors } })

  const upstream = BYO_ROUTES[route]
  if (!upstream) return reply(404, { error: 'unknown-relay-route' })
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  if (!byoAllowed(ip)) {
    return reply(429, { error: 'rate-limited', message: 'Too many relay requests — wait a minute.' })
  }
  // The caller's provider key (z.ai). Authorization holds the public anon JWT only to
  // pass Supabase's platform-side verify; it is never forwarded upstream.
  const key = req.headers.get('x-dm-byo-key')?.trim() ?? ''
  if (key.length < 16) {
    return reply(401, { error: 'byo-auth', message: 'Missing x-dm-byo-key (your provider API key).' })
  }
  if (req.method !== 'POST') return reply(405, { error: 'method', message: 'POST only.' })
  const raw = await req.text()
  if (raw.length === 0 || raw.length > BYO_BODY_LIMIT) {
    return reply(413, { error: 'bad-request', message: `Body must be 1–${BYO_BODY_LIMIT} bytes.` })
  }
  try {
    JSON.parse(raw)
  } catch {
    return reply(400, { error: 'bad-request', message: 'Body must be JSON.' })
  }
  try {
    const res = await fetch(`${upstream}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: raw,
      signal: AbortSignal.timeout(BYO_TIMEOUT_MS),
    })
    // Verbatim passthrough — status, errors and usage stay the provider's own.
    return new Response(res.body, {
      status: res.status,
      headers: { 'content-type': 'application/json', ...cors },
    })
  } catch {
    return reply(504, { error: 'upstream-timeout', message: 'The provider did not answer in time.' })
  }
}

// --- small helpers ---------------------------------------------------------------------------

interface JwtPayload {
  sub?: string
  role?: string
}

function decodeJwt(token: string): JwtPayload | null {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

function chatCostUsdMicros(tokensIn: number, tokensOut: number): number {
  const price = PRICES_USD_PER_M[TEASER_MODEL] ?? { input: 0.25, output: 2 }
  return Math.round(tokensIn * price.input + tokensOut * price.output)
}

async function rest(
  path: string,
  init: { method?: string; body?: unknown; count?: boolean } = {},
): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method: init.method ?? 'GET',
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      ...(init.count ? { prefer: 'count=exact' } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
}

interface Entitlement {
  plan: string
  monthly_allowance_usd_micros: number
  credit_usd_micros: number
  valid_until?: string | null
  tts_char_cap?: number | null
  cancel_at_period_end?: boolean | null
}

interface Budget {
  spendUsdMicros: number
  capUsdMicros: number
  remainingUsdMicros: number
  plan: string
  // M8.1: publish the live pricing config so client meters follow automatically.
  model: string
  prices: Record<string, { input: number; output: number }>
  // M9 plan envelope (Account & Billing UI + voice meter).
  ttsCharCap: number
  ttsCharsUsed: number
  validUntil: string | null
  cancelAtPeriodEnd: boolean
}

async function budgetOf(userId: string): Promise<Budget> {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
  const [spendRes, monthRes, entRes, charsUsed] = await Promise.all([
    rest(`/ai_usage?select=cost_usd_micros&user_id=eq.${userId}`),
    rest(`/ai_usage?select=cost_usd_micros&user_id=eq.${userId}&created_at=gte.${monthStart}`),
    rest(
      `/ai_entitlements?select=plan,monthly_allowance_usd_micros,credit_usd_micros,valid_until,tts_char_cap,cancel_at_period_end&user_id=eq.${userId}`,
    ),
    monthCharTotal(userId),
  ])
  const sumCosts = async (res: Response): Promise<number> => {
    if (!res.ok) return 0
    const rows = (await res.json()) as { cost_usd_micros: number }[]
    let sum = 0
    for (const r of rows) sum += Number(r.cost_usd_micros ?? 0)
    return sum
  }
  const lifetimeSpend = await sumCosts(spendRes)
  const monthSpend = await sumCosts(monthRes)
  let ent: Entitlement = {
    plan: 'free',
    monthly_allowance_usd_micros: 0,
    credit_usd_micros: 0,
  }
  if (entRes.ok) {
    const rows = (await entRes.json()) as Entitlement[]
    if (rows.length > 0) ent = rows[0]
  }
  // Monthly-aware budget — mirror of remainingBudgetWithMonthly (src/llm/entitlement.ts):
  // lifetime pools ($1 teaser + credit) are consumed first; only this month's
  // spend beyond them may consume the (still-active) monthly allowance.
  const allowanceActive = !ent.valid_until || Date.parse(ent.valid_until) > Date.now()
  const nonMonthly = TEASER_CAP_USD_MICROS + Number(ent.credit_usd_micros ?? 0)
  const coveredByNonMonthly = Math.min(lifetimeSpend, nonMonthly)
  const lifetimeRemaining = nonMonthly - coveredByNonMonthly
  const beyond = lifetimeSpend - coveredByNonMonthly
  const allowance = allowanceActive ? Number(ent.monthly_allowance_usd_micros ?? 0) : 0
  const allowanceUsed = Math.min(monthSpend, beyond)
  const allowanceRemaining = Math.max(0, allowance - allowanceUsed)
  const remaining = lifetimeRemaining + allowanceRemaining
  const cap = nonMonthly + allowance
  const ttsCharCap = Number.isFinite(Number(ent.tts_char_cap))
    ? Math.max(0, Number(ent.tts_char_cap))
    : FREE_TTS_CHAR_CAP
  return {
    spendUsdMicros: cap - remaining,
    capUsdMicros: cap,
    remainingUsdMicros: remaining,
    plan: ent.plan,
    model: TEASER_MODEL,
    prices: PRICES_USD_PER_M,
    ttsCharCap,
    ttsCharsUsed: charsUsed,
    validUntil: ent.valid_until ?? null,
    cancelAtPeriodEnd: allowanceActive && !!ent.cancel_at_period_end,
  }
}

async function requestsLastMinute(userId: string): Promise<number> {
  const since = new Date(Date.now() - 60_000).toISOString()
  const res = await rest(`/ai_usage?select=id&user_id=eq.${userId}&created_at=gte.${since}`, {
    count: true,
  })
  if (!res.ok) return 0
  const range = res.headers.get('content-range') ?? '' // e.g. "0-4/10"
  const total = Number(range.split('/')[1])
  return Number.isFinite(total) ? total : 0
}

async function monthCharTotal(userId: string): Promise<number> {
  const now = new Date()
  const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
  const res = await rest(`/ai_usage?select=chars&user_id=eq.${userId}&created_at=gte.${since}`)
  if (!res.ok) return 0
  const rows = (await res.json()) as { chars: number }[]
  return rows.reduce((sum, r) => sum + Number(r.chars ?? 0), 0)
}

async function meter(
  userId: string,
  row: {
    feature: string
    model: string
    tokens_in?: number
    tokens_out?: number
    chars?: number
    cost_usd_micros: number
  },
): Promise<void> {
  try {
    await rest('/ai_usage', { method: 'POST', body: { user_id: userId, ...row } })
  } catch {
    // metering write failure must not eat a successful provider reply
  }
}

/** auth/users check: email_confirmed_at set, or an OAuth identity (e.g. Google). */
async function emailVerified(userToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, authorization: `Bearer ${userToken}` },
    })
    if (!res.ok) return false
    const u = (await res.json()) as {
      email_confirmed_at?: string | null
      identities?: { provider?: string }[]
    }
    if (u.email_confirmed_at) return true
    return (u.identities ?? []).some((i) => i.provider && i.provider !== 'email')
  } catch {
    return false
  }
}

interface ChatProxyBody {
  feature?: string
  messages?: { role?: string; content?: unknown }[]
  maxTokens?: number
  temperature?: number
}

interface TtsProxyBody {
  text?: string
  voice?: string
  rate?: number
}

function sanitizeMessages(
  raw: ChatProxyBody['messages'],
): { role: 'system' | 'user' | 'assistant'; content: string }[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null
  const out: { role: 'system' | 'user' | 'assistant'; content: string }[] = []
  for (const m of raw) {
    if (m.role !== 'system' && m.role !== 'user' && m.role !== 'assistant') return null
    if (typeof m.content !== 'string' || m.content.length === 0 || m.content.length > MAX_MSG_CHARS) {
      return null
    }
    out.push({ role: m.role, content: m.content })
  }
  return out
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? '*'
  const cors: Record<string, string> = {
    'access-control-allow-origin': origin,
    'access-control-allow-headers': 'authorization, content-type, apikey, x-dm-byo-key',
    'access-control-allow-methods': 'POST, GET, OPTIONS',
  }
  const respond = (status: number, body: unknown, extra: Record<string, string> = {}): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', ...cors, ...extra },
    })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  // 0) BYO relay (M8.2): no Supabase account required — the caller authenticates
  //    with their own provider key in x-dm-byo-key; Authorization carries the
  //    public anon JWT merely to satisfy the platform-side signature check.
  const byoMatch = new URL(req.url).pathname.match(/\/byo\/([a-z0-9-]+)\/chat\/completions$/)
  if (byoMatch) return await handleByo(req, byoMatch[1])

  // 1) authenticate (signature verified platform-side; the anon key is also a
  //    valid JWT, so re-check sub + role here).
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  const payload = token ? decodeJwt(token) : null
  if (!payload?.sub || payload.role !== 'authenticated') {
    return respond(401, { error: 'auth', message: 'Sign in to use the free AI credit.' })
  }
  const userId = payload.sub

  try {
    // 2) budget snapshot (GET, or POST type=usage) — used by the Settings meter.
    let body: { type?: string } & ChatProxyBody & TtsProxyBody = {}
    if (req.method === 'GET') return respond(200, await budgetOf(userId))
    body = (await req.json().catch(() => ({}))) as typeof body
    if (body.type === 'usage') return respond(200, await budgetOf(userId))

    // 3) email-verification gate (spend paths only).
    if (!(await emailVerified(token))) {
      return respond(403, {
        error: 'verify-email',
        message: 'Verify your email address to use the free AI credit.',
      })
    }

    // 4) shared abuse guard: per-user rate limit.
    if (await requestsLastMinute(userId) >= RATE_LIMIT_PER_MIN) {
      return respond(429, {
        error: 'rate-limited',
        message: 'Too many AI requests in a short time — wait a few seconds and try again.',
      })
    }

    if (body.type === 'chat') {
      const messages = sanitizeMessages(body.messages)
      if (!messages || !SUPABASE_URL || (!OPENAI_KEY && !ZAI_KEY)) {
        return respond(503, { error: 'not-configured', message: 'Platform AI is not configured yet.' })
      }
      const budget = await budgetOf(userId)
      if (budget.remainingUsdMicros <= 0) {
        return respond(402, { error: 'exhausted', message: 'Your free $1 AI credit is used up.', ...budget })
      }
      const maxTokens = Math.min(4000, Math.max(64, body.maxTokens ?? 1024))
      const providerRes = CHAT_TARGET === 'zai'
        ? await fetch('https://api.z.ai/api/coding/paas/v4/chat/completions', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${ZAI_KEY}` },
          body: JSON.stringify({
            model: TEASER_MODEL,
            messages,
            // GLM classic chat body: max_tokens (never max_completion_tokens), no
            // reasoning params; thinking off keeps tutor/drill replies fast.
            max_tokens: maxTokens,
            thinking: { type: 'disabled' },
          }),
        })
        : await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: TEASER_MODEL,
            messages,
            // gpt-5-mini is a reasoning model: max_completion_tokens (never max_tokens),
            // no temperature; low effort keeps tutor/drill latency close to classic chat.
            max_completion_tokens: Math.max(maxTokens, 2048),
            reasoning_effort: 'low',
          }),
        })
      const raw = await providerRes.text()
      if (!providerRes.ok) {
        return respond(502, {
          error: 'upstream',
          message: `Provider error ${providerRes.status}: ${raw.slice(0, 180)}`,
        })
      }
      let tokensIn = 0
      let tokensOut = 0
      try {
        const parsed = JSON.parse(raw) as {
          usage?: { prompt_tokens?: number; completion_tokens?: number }
        }
        tokensIn = parsed.usage?.prompt_tokens ?? 0
        tokensOut = parsed.usage?.completion_tokens ?? 0
      } catch {
        // provider returned non-JSON despite 200 — respond verbatim below, cost 0
      }
      const cost = chatCostUsdMicros(tokensIn, tokensOut)
      await meter(userId, {
        feature: typeof body.feature === 'string' ? body.feature.slice(0, 40) : 'chat',
        model: TEASER_MODEL,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_usd_micros: cost,
      })
      const remaining = Math.max(0, budget.remainingUsdMicros - cost)
      return new Response(raw, {
        status: 200,
        headers: {
          'content-type': 'application/json',
          ...cors,
          'x-dm-credit-usd': String(remaining),
          'x-dm-cap-usd': String(budget.capUsdMicros),
        },
      })
    }

    if (body.type === 'tts') {
      if (!TTS_KEY) {
        return respond(503, { error: 'tts-not-configured', message: 'HD voice is not configured yet.' })
      }
      const text = typeof body.text === 'string' ? body.text : ''
      if (!text || text.length > MAX_TTS_CHARS) {
        return respond(400, {
          error: 'bad-request',
          message: `Text must be 1–${MAX_TTS_CHARS} characters.`,
        })
      }
      const voice = typeof body.voice === 'string' && /^de-DE-[A-Za-z0-9-]{1,40}$/.test(body.voice)
        ? body.voice
        : DEFAULT_TTS_VOICE
      const rate = Math.min(1.5, Math.max(0.5, body.rate ?? 1))
      // M9: per-plan monthly HD-voice cap (Basic = 0 → plan gate, not exhaustion).
      const budget = await budgetOf(userId)
      if (budget.ttsCharCap <= 0) {
        return respond(403, {
          error: 'hd-voice-not-in-plan',
          message: 'HD cloud voice is a Plus feature — browser voices keep working free.',
        })
      }
      if (budget.ttsCharsUsed + text.length > budget.ttsCharCap) {
        return respond(402, {
          error: 'exhausted',
          message: 'Your monthly HD voice allowance is used up — the browser voice still works.',
        })
      }
      const googleRes = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': TTS_KEY },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'de-DE', name: voice },
          audioConfig: { audioEncoding: 'MP3', speakingRate: rate },
        }),
      })
      const raw = await googleRes.text()
      if (!googleRes.ok) {
        return respond(502, {
          error: 'upstream',
          message: `HD voice error ${googleRes.status}: ${raw.slice(0, 180)}`,
        })
      }
      // $0 per char while Google's Neural2 free tier covers it (see entitlement.ts)
      await meter(userId, {
        feature: 'hd-tts',
        model: 'google-tts',
        chars: text.length,
        cost_usd_micros: 0,
      })
      return new Response(raw, { status: 200, headers: { 'content-type': 'application/json', ...cors } })
    }

    return respond(400, { error: 'bad-request', message: 'Unknown request type.' })
  } catch (e) {
    return respond(500, { error: 'server', message: e instanceof Error ? e.message : 'Unexpected error.' })
  }
})
