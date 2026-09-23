// Supabase Edge Function: ai-proxy (M8) — the platform-AI teaser backend.
//
// What it does (Deno runtime, ZERO external imports — dashboard-paste friendly):
//   • Verifies the caller is a signed-in (JWT role=authenticated), email-verified user.
//   • Rate-limits per user (≤10 metered requests/minute, checked via ai_usage).
//   • Budget check: Pro allowance + credit (ai_entitlements, 0 until M9) + $1 teaser,
//     spend = SUM(ai_usage.cost_usd_micros).
//   • type=chat → forwards to OpenAI on the OWNER's key (secret OPENAI_PLATFORM_KEY),
//     model fixed SERVER-side; meters tokens × price table.
//   • type=tts → forwards to Google Cloud TTS on the OWNER's key (secret
//     PLATFORM_TTS_KEY, optional); meters characters (price $0 while Google's
//     Neural2 free tier covers it — see src/llm/entitlement.ts) with a monthly
//     char cap as the abuse guard.
//   • type=usage → budget snapshot for the Settings meter.
//   • Returns provider JSON verbatim + metering headers x-dm-credit-usd / x-dm-cap-usd.
//
// Deploy (owner): Dashboard → Edge Functions → New function → name "ai-proxy" → paste
// this file → Secrets: OPENAI_PLATFORM_KEY (+ PLATFORM_TTS_KEY if HD voice included).
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected automatically. Keep
// "Verify JWT with Supabase" ENABLED (the signature check happens platform-side;
// this code re-checks sub/role because the anon key is also a valid JWT).
//
// Prices/model are mirrored in src/llm/entitlement.ts — keep both in sync.
// (Later switch to glm-4.5-flash: change TEASER_MODEL + PRICES + the forwarder.)

const TEASER_MODEL = 'gpt-5-mini'
const PRICES_USD_PER_M: Record<string, { input: number; output: number }> = {
  // gpt-5-mini launch pricing ($0.25/$2 per 1M tokens) — verify at M9.
  'gpt-5-mini': { input: 0.25, output: 2 },
}
const TEASER_CAP_USD_MICROS = 1_000_000 // $1
const RATE_LIMIT_PER_MIN = 10
const TTS_MONTHLY_CHAR_CAP = 200_000
const MAX_MESSAGES = 40
const MAX_MSG_CHARS = 8_000
const MAX_TTS_CHARS = 500
const DEFAULT_TTS_VOICE = 'de-DE-Neural2-A'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const OPENAI_KEY = Deno.env.get('OPENAI_PLATFORM_KEY') ?? ''
const TTS_KEY = Deno.env.get('PLATFORM_TTS_KEY') ?? ''

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
}

interface Budget {
  spendUsdMicros: number
  capUsdMicros: number
  remainingUsdMicros: number
  plan: string
}

async function budgetOf(userId: string): Promise<Budget> {
  const [spendRes, entRes] = await Promise.all([
    rest(`/ai_usage?select=cost_usd_micros&user_id=eq.${userId}`),
    rest(
      `/ai_entitlements?select=plan,monthly_allowance_usd_micros,credit_usd_micros&user_id=eq.${userId}`,
    ),
  ])
  let spend = 0
  if (spendRes.ok) {
    const rows = (await spendRes.json()) as { cost_usd_micros: number }[]
    for (const r of rows) spend += Number(r.cost_usd_micros ?? 0)
  }
  let ent: Entitlement = { plan: 'free', monthly_allowance_usd_micros: 0, credit_usd_micros: 0 }
  if (entRes.ok) {
    const rows = (await entRes.json()) as Entitlement[]
    if (rows.length > 0) ent = rows[0]
  }
  const cap = TEASER_CAP_USD_MICROS +
    Number(ent.monthly_allowance_usd_micros) + Number(ent.credit_usd_micros)
  return {
    spendUsdMicros: spend,
    capUsdMicros: cap,
    remainingUsdMicros: Math.max(0, cap - spend),
    plan: ent.plan,
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
    'access-control-allow-headers': 'authorization, content-type, apikey',
    'access-control-allow-methods': 'POST, GET, OPTIONS',
  }
  const respond = (status: number, body: unknown, extra: Record<string, string> = {}): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', ...cors, ...extra },
    })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

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
      if (!messages || !SUPABASE_URL || !OPENAI_KEY) {
        return respond(503, { error: 'not-configured', message: 'Platform AI is not configured yet.' })
      }
      const budget = await budgetOf(userId)
      if (budget.remainingUsdMicros <= 0) {
        return respond(402, { error: 'exhausted', message: 'Your free $1 AI credit is used up.', ...budget })
      }
      const maxTokens = Math.min(4000, Math.max(64, body.maxTokens ?? 1024))
      const providerRes = await fetch('https://api.openai.com/v1/chat/completions', {
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
      if ((await monthCharTotal(userId)) + text.length > TTS_MONTHLY_CHAR_CAP) {
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
