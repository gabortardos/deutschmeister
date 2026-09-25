// Supabase Edge Function: paddle-checkout (M9) — authenticated billing front door.
//
// What it does (Deno runtime, ZERO external imports — dashboard-paste friendly):
//   • type=plans    → the purchasable catalog from the PADDLE_PRICE_MAP secret
//                     ({options:[{plan, interval, priceId}]}). Price IDs differ
//                     between sandbox and live, so the client bundle never
//                     embeds them — it asks us.
//   • type=checkout → creates a DRAFT transaction via the Paddle Billing API
//                     (POST /transactions with items+custom_data+checkout.success_url)
//                     and returns {url}: Paddle's HOSTED checkout page. Redirect
//                     flow only (locked decision) — no card data ever near us.
//                     custom_data.user_id is how paddle-webhook maps the purchase
//                     back to this Supabase user.
//   • type=portal   → creates a customer-portal session (Paddle-hosted manage/
//                     cancel/update-card pages) for the signed-in user's stored
//                     paddle_customer_id and returns {url}.
//
// Auth: caller must be a signed-in user (JWT verified platform-side; sub+role
// re-checked here like ai-proxy — the anon key is also a valid JWT).
//
// Deploy (owner): Dashboard → Edge Functions → New function → name
// "paddle-checkout" → paste this file → keep "Verify JWT" ENABLED. Secrets:
//   PADDLE_API_KEY     sandbox (sandbox-api.paddle.com) or live API key
//   PADDLE_ENV         'sandbox' (default) | 'live' — picks the API base URL
//   PADDLE_PRICE_MAP   JSON, same shape as paddle-webhook, e.g.
//     {"pri_sandbox123": {"plan":"basic","kind":"subscription","interval":"month"},
//      "pri_sandbox456": {"plan":"basic","kind":"subscription","interval":"year"},
//      "pri_sandbox789": {"plan":"plus","kind":"subscription","interval":"month"},
//      "pri_sandboxabc": {"plan":"plus","kind":"subscription","interval":"year"}}
// Go-live = swap the secret VALUES (live key, PADDLE_ENV=live, live price IDs) +
// redeploy; nothing changes in this file or in the client.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const PADDLE_API_KEY = Deno.env.get('PADDLE_API_KEY') ?? ''
const PADDLE_ENV = (Deno.env.get('PADDLE_ENV') ?? 'sandbox').toLowerCase()
const PADDLE_BASE = PADDLE_ENV === 'live' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com'

interface PriceMapping {
  plan?: string
  kind: 'subscription' | 'credit'
  interval?: 'month' | 'year'
  creditUsdMicros?: number
}

function priceMap(): Record<string, PriceMapping> | null {
  const raw = Deno.env.get('PADDLE_PRICE_MAP')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Record<string, PriceMapping>
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function decodeJwt(token: string): { sub?: string; role?: string } | null {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    return JSON.parse(json) as { sub?: string; role?: string }
  } catch {
    return null
  }
}

async function rest(path: string, init: { method?: string; body?: unknown } = {}): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method: init.method ?? 'GET',
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
}

Deno.serve(async (req: Request) => {
  const cors: Record<string, string> = {
    'access-control-allow-origin': req.headers.get('origin') ?? '*',
    'access-control-allow-headers': 'authorization, content-type, apikey',
    'access-control-allow-methods': 'POST, OPTIONS',
  }
  const respond = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return respond(405, { error: 'method', message: 'POST only.' })

  // 1) authenticate (anon key is also a valid JWT → re-check role).
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const payload = token ? decodeJwt(token) : null
  if (!payload?.sub || payload.role !== 'authenticated') {
    return respond(401, { error: 'auth', message: 'Sign in to manage a subscription.' })
  }
  const userId = payload.sub

  const map = priceMap()
  if (!PADDLE_API_KEY || !map) {
    return respond(503, { error: 'not-configured', message: 'Billing is not configured yet.' })
  }

  const body = (await req.json().catch(() => ({}))) as { type?: string; priceId?: string }

  // 2) catalog: which plans can this deployment sell right now?
  if (body.type === 'plans' || !body.type) {
    const options: { plan: string; interval: string; priceId: string }[] = []
    for (const [priceId, m] of Object.entries(map)) {
      if (m.kind === 'subscription' && (m.plan === 'basic' || m.plan === 'plus' || m.plan === 'pro')) {
        options.push({ plan: m.plan, interval: m.interval ?? 'month', priceId })
      }
    }
    return respond(200, { options, env: PADDLE_ENV })
  }

  // 3) hosted checkout: create a draft transaction, return its checkout URL.
  if (body.type === 'checkout') {
    const priceId = typeof body.priceId === 'string' ? body.priceId : ''
    const mapping = map[priceId]
    if (!mapping) {
      return respond(400, { error: 'unknown-price', message: 'This plan is not available.' })
    }
    const origin = req.headers.get('origin')
    if (!origin) return respond(400, { error: 'bad-request', message: 'Missing Origin header.' })
    // GitHub Pages base path + hash router: back to Settings with a flag param.
    const successUrl = `${origin}/deutschmeister/#/settings?billing=success`
    try {
      const res = await fetch(`${PADDLE_BASE}/transactions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${PADDLE_API_KEY}` },
        body: JSON.stringify({
          items: [{ price_id: priceId, quantity: 1 }],
          custom_data: { user_id: userId },
          checkout: { success_url: successUrl },
        }),
        signal: AbortSignal.timeout(20_000),
      })
      const raw = await res.text()
      if (!res.ok) {
        return respond(502, {
          error: 'paddle',
          message: `Paddle checkout error ${res.status}: ${raw.slice(0, 180)}`,
        })
      }
      const data = JSON.parse(raw) as { data?: { checkout?: { url?: string } } }
      const url = data.data?.checkout?.url
      if (typeof url !== 'string' || !url) {
        return respond(502, { error: 'paddle', message: 'Paddle returned no checkout URL.' })
      }
      return respond(200, { url })
    } catch {
      return respond(504, { error: 'paddle-timeout', message: 'Paddle did not answer in time.' })
    }
  }

  // 4) customer portal (manage/cancel/update card) — needs a stored ctm_ id.
  if (body.type === 'portal') {
    const entRes = await rest(`/ai_entitlements?select=paddle_customer_id&user_id=eq.${userId}`)
    const rows = entRes.ok ? ((await entRes.json()) as { paddle_customer_id?: string | null }[]) : []
    const customerId = rows[0]?.paddle_customer_id ?? ''
    if (!/^ctm_[a-z\d]+$/.test(customerId)) {
      return respond(409, {
        error: 'no-subscription',
        message: 'No Paddle customer yet — subscribe first (or use the email receipt link).',
      })
    }
    try {
      const res = await fetch(`${PADDLE_BASE}/customers/${customerId}/portal-sessions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${PADDLE_API_KEY}` },
        body: '{}',
        signal: AbortSignal.timeout(20_000),
      })
      const raw = await res.text()
      if (!res.ok) {
        return respond(502, {
          error: 'paddle',
          message: `Paddle portal error ${res.status}: ${raw.slice(0, 180)}`,
        })
      }
      const data = JSON.parse(raw) as { data?: { urls?: { general?: { overview?: string } } } }
      const url = data.data?.urls?.general?.overview
      if (typeof url !== 'string' || !url) {
        return respond(502, { error: 'paddle', message: 'Paddle returned no portal URL.' })
      }
      return respond(200, { url })
    } catch {
      return respond(504, { error: 'paddle-timeout', message: 'Paddle did not answer in time.' })
    }
  }

  return respond(400, { error: 'bad-request', message: 'Unknown request type.' })
})


