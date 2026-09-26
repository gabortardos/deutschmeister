// Supabase Edge Function: paddle-webhook (M9) — signature-verified entitlement writer.
//
// Paddle (Billing) calls this endpoint for lifecycle events; we verify the
// Paddle-Signature HMAC, dedupe by event_id, then upsert ai_entitlements.
// Provisioning model (Paddle docs "Provision your app"):
//   subscription.activated/.updated/.resumed/.past_due → grant the plan of
//     items[0].price.id until current_billing_period.ends_at (past_due keeps
//     access as a grace period — dunning may still recover the payment).
//   subscription.canceled → keep until period end (scheduled_change), then
//     webhook or the ai-proxy valid_until check downgrades to free.
//   subscription.paused → keep until period end (owner policy: pause ≠ revoke).
//   transaction.completed + kind=credit price → creditUsdMicros top-up
//     (AI Credit Packs — M9 phase 2, products optional).
//
// SECURITY:
//   • Deploy with "Verify JWT with Supabase" DISABLED — Paddle servers send no
//     Supabase JWT; the Paddle-Signature HMAC is the auth here.
//   • Signature scheme (developer.paddle.com → verify webhook signatures):
//     header `Paddle-Signature: ts=<unix-sec>;h1=<hex>`; signed string is
//     `${ts}:${rawBody}`; HMAC-SHA256 with the destination's endpoint secret;
//     lowercase hex; constant-time compare; ts within ±300 s.
//   • Idempotency: unique billing_events.paddle_event_id — replays (Paddle
//     retries up to 3 days) are logged and skipped.
//   • SANDBOX GUARD (locked decision): while PADDLE_ENV != 'live', events only
//     grant entitlements to PADDLE_SANDBOX_TEST_USER (the owner's uuid). Any
//     other target user_id is logged to billing_events with outcome
//     'sandbox-blocked' and never written — a sandbox checkout link can never
//     mint real entitlements for real users.
//
// Secrets (owner, Supabase dashboard):
//   PADDLE_WEBHOOK_SECRET      the notification destination's secret key
//   PADDLE_PRICE_MAP           JSON {priceId: {plan, kind, interval, creditUsdMicros}}
//   PADDLE_ENV                 'sandbox' (default) | 'live'
//   PADDLE_SANDBOX_TEST_USER   owner's auth.users uuid (sandbox guard allowlist)
// Go-live = set live secret values + PADDLE_ENV=live + recreate price IDs in the
// map → redeploy. No code change.
//
// PLANS below mirror membership v3 (2026-09-21): allowances are the gpt-5-mini
// backend numbers ($2 / $3.5); a coding-plan-backend swap = edit these two rows.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WEBHOOK_SECRET = Deno.env.get('PADDLE_WEBHOOK_SECRET') ?? ''
const PADDLE_ENV = (Deno.env.get('PADDLE_ENV') ?? 'sandbox').toLowerCase()
const SANDBOX_TEST_USER = Deno.env.get('PADDLE_SANDBOX_TEST_USER') ?? ''
const SIGNATURE_MAX_AGE_SEC = 300

/** Fair-use monthly AI budget + HD-voice chars per plan (gpt-5-mini backend). */
const PLANS: Record<string, { allowanceUsdMicros: number; ttsCharCap: number }> = {
  basic: { allowanceUsdMicros: 2_000_000, ttsCharCap: 0 },
  plus: { allowanceUsdMicros: 3_500_000, ttsCharCap: 150_000 },
  pro: { allowanceUsdMicros: 8_000_000, ttsCharCap: 400_000 },
  // M9.6 Supporter (owner decision 2026-09-21): yearly €11.99 for key-bringers —
  // zero platform allowances; the value is the system itself (chat AI + HD voice
  // run on the user's own keys). A Supporter row intentionally REPLACES any prior
  // plan in ai_entitlements (single row per user, on_conflict=user_id).
  'byo-supporter': { allowanceUsdMicros: 0, ttsCharCap: 0 },
}
const FREE_TTS_CHAR_CAP = 20_000

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

// --- signature verification (tested twin: src/billing/paddle.ts) ------------------------------

function parsePaddleSignature(header: string | null): { ts: string; h1: string } | null {
  if (!header) return null
  const parts: Record<string, string> = {}
  for (const segment of header.split(';')) {
    const eq = segment.indexOf('=')
    if (eq > 0) parts[segment.slice(0, eq).trim()] = segment.slice(eq + 1).trim()
  }
  if (!parts.ts || !parts.h1) return null
  return { ts: parts.ts, h1: parts.h1 }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  let hex = ''
  for (const b of new Uint8Array(sig)) hex += b.toString(16).padStart(2, '0')
  return hex
}

async function signatureValid(header: string | null, rawBody: string): Promise<boolean> {
  const parts = parsePaddleSignature(header)
  if (!parts || !WEBHOOK_SECRET) return false
  const ts = Number(parts.ts)
  const now = Math.floor(Date.now() / 1000)
  if (!Number.isFinite(ts) || ts <= 0) return false
  if (ts > now + SIGNATURE_MAX_AGE_SEC || now - ts > SIGNATURE_MAX_AGE_SEC) return false
  const expected = await hmacSha256Hex(WEBHOOK_SECRET, `${parts.ts}:${rawBody}`)
  return timingSafeEqualHex(expected, parts.h1.toLowerCase())
}


// --- entitlement persistence (service role) ----------------------------------------------------

interface EntitlementRow {
  plan: string
  monthly_allowance_usd_micros: number
  credit_usd_micros: number
  tts_char_cap: number
  valid_until: string | null
  cancel_at_period_end: boolean
  paddle_customer_id: string | null
  source: string
}

async function rest(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method: init.method ?? 'GET',
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      ...(init.prefer ? { prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
}

const freeRow = (): EntitlementRow => ({
  plan: 'free',
  monthly_allowance_usd_micros: 0,
  credit_usd_micros: 0,
  tts_char_cap: FREE_TTS_CHAR_CAP,
  valid_until: null,
  cancel_at_period_end: false,
  paddle_customer_id: null,
  source: 'manual',
})

async function readEntitlement(userId: string): Promise<EntitlementRow> {
  const res = await rest(`/ai_entitlements?select=*&user_id=eq.${userId}`)
  if (!res.ok) return freeRow()
  const rows = (await res.json()) as EntitlementRow[]
  return rows[0] ?? freeRow()
}

/** Read-merge-write upsert (preserves fields this event doesn't own, e.g. credit).
 *  POST with on_conflict + Prefer resolution=merge-duplicates = upsert in PostREST. */
async function writeEntitlement(userId: string, row: EntitlementRow): Promise<void> {
  await rest(`/ai_entitlements?on_conflict=user_id`, {
    method: 'POST',
    body: { user_id: userId, ...row, updated_at: new Date().toISOString() },
    prefer: 'resolution=merge-duplicates',
  })
}

// --- idempotency --------------------------------------------------------------------------------

/** Returns true when this event is new (marker inserted); false on duplicate. */

// --- event application ---------------------------------------------------------------------------

interface SubscriptionData {
  status?: string
  customer_id?: string
  scheduled_change?: { action?: string } | null
  current_billing_period?: { ends_at?: string | null } | null
  items?: { price?: { id?: string } }[]
  custom_data?: { user_id?: string } | null
}

interface TransactionData {
  customer_id?: string
  items?: { price?: { id?: string } }[]
  custom_data?: { user_id?: string } | null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Pure grant computation for a subscription event (easy to reason about). */
function subscriptionGrant(
  row: EntitlementRow,
  data: SubscriptionData,
  map: Record<string, PriceMapping>,
): { row: EntitlementRow; outcome: string } {
  const source = PADDLE_ENV === 'live' ? 'paddle-live' : 'paddle-sandbox'
  const priceId = data.items?.[0]?.price?.id
  const mapped = priceId ? map[priceId] : undefined
  const mappedPlan = mapped && mapped.kind === 'subscription' && PLANS[mapped.plan ?? ''] ? mapped.plan! : null
  const endsAt = data.current_billing_period?.ends_at ?? null
  const periodStillRunning = !!endsAt && Date.parse(endsAt) > Date.now()

  // Canceled and the period is over (or unknown) → downgrade now, keep credit.
  if (data.status === 'canceled' && !periodStillRunning) {
    return {
      row: {
        ...freeRow(),
        credit_usd_micros: row.credit_usd_micros, // credit is never revoked
        paddle_customer_id: data.customer_id ?? row.paddle_customer_id,
        source,
      },
      outcome: 'downgraded',
    }
  }

  // Unknown price (e.g. a product created outside this flow): keep current plan
  // and extend the period if we can — never grant a plan we don't know.
  const plan = mappedPlan ?? (row.plan !== 'free' ? row.plan : null)
  if (!plan) return { row, outcome: 'unknown-price-kept' }
  const config = PLANS[plan]
  const canceled = data.status === 'canceled' || data.scheduled_change?.action === 'cancel'
  const paused = data.status === 'paused'
  return {
    row: {
      ...row,
      plan,
      monthly_allowance_usd_micros: config.allowanceUsdMicros,
      tts_char_cap: config.ttsCharCap,
      valid_until: endsAt,
      cancel_at_period_end: paused ? false : canceled,
      paddle_customer_id: data.customer_id ?? row.paddle_customer_id,
      source,
    },
    outcome: canceled ? 'granted-until-period-end' : 'granted',
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('POST only.', { status: 405 })

  // 1) verify Paddle's signature over the RAW body (must read text before JSON).
  const rawBody = await req.text()
  if (!WEBHOOK_SECRET) return new Response('not configured', { status: 503 })
  if (!(await signatureValid(req.headers.get('paddle-signature'), rawBody))) {
    return new Response('invalid signature', { status: 401 })
  }

  let event: {
    event_id?: string
    event_type?: string
    data?: unknown
  }
  try {
    event = JSON.parse(rawBody) as typeof event
  } catch {
    return new Response('bad json', { status: 400 })
  }
  const eventId = event.event_id ?? ''
  const eventType = event.event_type ?? ''
  if (!eventId || !eventType) return new Response('bad event', { status: 400 })

  const map = priceMap()
  if (!map) return new Response('price map not configured', { status: 503 })

  // 2) resolve the target user from custom_data (set by paddle-checkout).
  const data = (event.data ?? {}) as SubscriptionData & TransactionData
  const rawUserId = data.custom_data?.user_id ?? ''
  const userId = UUID_RE.test(rawUserId) ? rawUserId : null
  if (!userId) {
    // Log for manual reconciliation, then 200 so Paddle stops retrying.
    await markEventSeen(eventId, eventType, null, 'no-user')
    return Response.json({ ok: true, skipped: 'no-user' })
  }

  // 3) SANDBOX GUARD: sandbox events may only touch the owner's test account.
  if (PADDLE_ENV !== 'live' && SANDBOX_TEST_USER && userId !== SANDBOX_TEST_USER) {
    await markEventSeen(eventId, eventType, userId, 'sandbox-blocked')
    return Response.json({ ok: true, skipped: 'sandbox-guard' })
  }

  // 4) idempotency — process each Paddle event exactly once.
  if (!(await markEventSeen(eventId, eventType, userId, 'received'))) {
    return Response.json({ ok: true, duplicate: true })
  }

  try {
    let outcome = 'ignored'
    if (eventType.startsWith('subscription.')) {
      const grant = subscriptionGrant(await readEntitlement(userId), data as SubscriptionData, map)
      await writeEntitlement(userId, grant.row)
      outcome = grant.outcome
    } else if (eventType === 'transaction.completed') {
      const priceId = data.items?.[0]?.price?.id
      const mapped = priceId ? map[priceId] : undefined
      if (mapped?.kind === 'credit' && (mapped.creditUsdMicros ?? 0) > 0) {
        const row = await readEntitlement(userId)
        await writeEntitlement(userId, {
          ...row,
          credit_usd_micros: row.credit_usd_micros + Math.round(mapped.creditUsdMicros!),
          paddle_customer_id: data.customer_id ?? row.paddle_customer_id,
        })
        outcome = 'credit-added'
      }
    }
    await rest(`/billing_events?paddle_event_id=eq.${eventId}`, {
      method: 'PATCH',
      body: { outcome },
    })
    return Response.json({ ok: true, outcome })
  } catch (e) {
    // Processing failed → remove the marker so Paddle's retry can redo it.
    await unmarkEvent(eventId)
    return new Response(e instanceof Error ? e.message : 'processing failed', { status: 500 })
  }
})

async function markEventSeen(
  eventId: string,
  eventType: string,
  userId: string | null,
  outcome: string,
): Promise<boolean> {
  const res = await rest('/billing_events', {
    method: 'POST',
    body: {
      paddle_event_id: eventId,
      event_type: eventType,
      user_id: userId,
      source: PADDLE_ENV === 'live' ? 'paddle-live' : 'paddle-sandbox',
      outcome,
    },
  })
  return res.ok // 409 unique violation → already processed
}

async function unmarkEvent(eventId: string): Promise<void> {
  await rest(`/billing_events?paddle_event_id=eq.${eventId}`, { method: 'DELETE' })
}
