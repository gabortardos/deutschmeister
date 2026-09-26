/**
 * Paddle.js overlay-checkout glue (M9, v2.4.1) — lazy, zero-dependency.
 *
 * Why this exists: Paddle Billing (unlike old Paddle Classic) has NO standalone
 * hosted checkout page for API-created transactions. The `checkout.url` the API
 * returns is just `<default payment link>?_ptxn=<txn id>` — a page on OUR site
 * that is supposed to include Paddle.js, which then opens the real checkout as
 * an overlay. The canonical flow is therefore:
 *
 *   1. `paddle-checkout` (Edge Function) creates a draft transaction server-side
 *      and returns `{ transactionId, clientToken, env, url }`.
 *   2. We lazy-load https://cdn.paddle.com/paddle/v2/paddle.js (only when a
 *      purchase is actually attempted — everyone else never downloads it).
 *   3. `Paddle.Environment.set('sandbox')` (sandbox only) followed by
 *      `Paddle.Initialize({ token })` — once per page (Paddle throws if called
 *      twice; we remember the token we initialized with). NOTE (v2.4.3): the CDN
 *      SDK no longer accepts `environment` inside Initialize — it throws
 *      "Unknown option parameter 'environment'" (that's what the npm wrapper
 *      still allows, but we load the script global).
 *   4. `Paddle.Checkout.open({ transactionId })` — Paddle's overlay checkout;
 *      card data goes straight to Paddle (MoR), never through this app.
 *   5. `checkout.completed` (via the Initialize `eventCallback`) → we close the
 *      overlay and poll the meter until the webhook grants the plan.
 *
 * The client-side token is public by design (it can only open checkouts); it
 * still arrives via the Edge Function so the sandbox→live switch stays a pure
 * secret-value swap. Every failure returns a typed reason (OverlayResult) —
 * v2.4.2 removed the old silent redirect to checkout.url: for API-created
 * transactions that URL is OUR OWN homepage with ?_ptxn appended, so the
 * BillingSection now surfaces the reason instead of navigating nowhere.
 */

export type PaddleEnv = 'sandbox' | 'live'

export interface PaddleEvent {
  name?: string
  data?: unknown
  /** checkout.error/checkout.warning diagnostics (Paddle's documented payloads). */
  type?: string
  code?: string
  detail?: string
  errors?: { field?: string; message?: string }[]
}

export interface PaddleInitializeOptions {
  token: string
  eventCallback?: (event: PaddleEvent) => void
}

export interface PaddleCheckoutOpenOptions {
  transactionId?: string
  settings?: Record<string, unknown>
}

export interface PaddleSdk {
  Initialize?: (options: PaddleInitializeOptions) => void
  /** Current CDN SDK: sandbox selection lives here (Initialize rejects `environment`). */
  Environment?: { set?: (environment: 'sandbox' | 'production') => void }
  Checkout?: {
    open?: (options: PaddleCheckoutOpenOptions) => void
    close?: () => void
  }
}

declare global {
  interface Window {
    Paddle?: PaddleSdk
  }
}

// --- pure helpers (unit-tested in __tests__/paddleClient.test.ts) ----------------------------

/** Anything that is not exactly 'live' is treated as sandbox (the safe/test env). */
export function normalizePaddleEnv(raw: unknown): PaddleEnv {
  return raw === 'live' ? 'live' : 'sandbox'
}

/** Shape-checks the `paddle-checkout` response; see `CheckoutSession`. */
export interface CheckoutSession {
  transactionId: string | null
  clientToken: string | null
  env: PaddleEnv
  url: string | null
}

/**
 * Validates the Edge Function response. Needs at least a `transactionId`
 * (overlay flow) or a `url` (redirect fallback) to be useful; null otherwise.
 */
export function parseCheckoutResponse(raw: unknown): CheckoutSession | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const transactionId = typeof r.transactionId === 'string' && r.transactionId ? r.transactionId : null
  const clientToken = typeof r.clientToken === 'string' && r.clientToken ? r.clientToken : null
  const url = typeof r.url === 'string' && r.url ? r.url : null
  if (!transactionId && !url) return null
  return { transactionId, clientToken, env: normalizePaddleEnv(r.env), url }
}

/**
 * Extracts the `?_ptxn=txn_…` parameter (Paddle's checkout payment links) from
 * a `location.search` string. Returns null when absent or not a transaction id.
 */
export function ptxnFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get('_ptxn')
  return value && value.startsWith('txn_') ? value : null
}
/**
 * True when a checkout URL points back at THIS site. Paddle Billing payment
 * links are `<default payment link>?_ptxn=…` — i.e. our own homepage — so
 * redirecting to them is a dead end (v2.4.1 did exactly that, "silently").
 * Used to decide fallback-redirect vs. surfacing an explicit error.
 */
export function isOwnSiteUrl(url: string, origin: string): boolean {
  if (url.startsWith('/')) return true
  try {
    return new URL(url, origin).origin === origin
  } catch {
    return false
  }
}

// --- side-effectful Paddle.js glue ------------------------------------------------------------

const PADDLE_JS_SRC = 'https://cdn.paddle.com/paddle/v2/paddle.js'
const SCRIPT_TIMEOUT_MS = 10_000

let scriptPromise: Promise<PaddleSdk | null> | null = null
let initializedToken = ''
let completedHandler: (() => void) | null = null

function loadPaddleSdk(): Promise<PaddleSdk | null> {
  if (window.Paddle) return Promise.resolve(window.Paddle)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = PADDLE_JS_SRC
      script.async = true
      const timer = window.setTimeout(() => resolve(null), SCRIPT_TIMEOUT_MS)
      script.onload = () => {
        window.clearTimeout(timer)
        resolve(window.Paddle ?? null)
      }
      script.onerror = () => {
        window.clearTimeout(timer)
        resolve(null)
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

/** Why an overlay open failed — mapped to actionable guidance by BillingSection. */
export type OverlayFailReason =
  | 'client-token-missing'
  | 'script-load-failed'
  | 'sdk-invalid'
  | 'initialize-failed'
  | 'open-failed'

export type OverlayResult = { ok: true } | { ok: false; reason: OverlayFailReason; detail?: string }

/**
 * Loads Paddle.js and calls `Paddle.Initialize` exactly once per page load.
 * Returns a typed failure reason (blocked, offline, bad token…).
 */
export async function ensurePaddleReady(env: PaddleEnv, clientToken: string): Promise<OverlayResult> {
  if (!clientToken) return { ok: false, reason: 'client-token-missing' }
  const sdk = await loadPaddleSdk()
  if (!sdk) return { ok: false, reason: 'script-load-failed', detail: PADDLE_JS_SRC }
  if (typeof sdk.Initialize !== 'function') return { ok: false, reason: 'sdk-invalid' }
  if (initializedToken === clientToken) return { ok: true }
  try {
    // Sandbox is selected BEFORE Initialize via Paddle.Environment.set() — the
    // CDN SDK rejects `environment` inside Initialize ("Unknown option parameter
    // 'environment'", the v2.4.2 live failure). Live needs no call (production
    // is the default).
    if (env === 'sandbox') {
      try {
        sdk.Environment?.set?.('sandbox')
      } catch {
        // SDK build without Environment.set — best effort; Initialize's own
        // validation will surface any problem as initialize-failed.
      }
    }
    sdk.Initialize({
      token: clientToken,
      eventCallback: (event: PaddleEvent) => {
        // v2.4.4: surface Paddle's own diagnostics — checkout.error /
        // checkout.warning carry {type, code, detail, errors[]} and are the
        // documented first stop when the overlay misbehaves (e.g. it opens,
        // then shows Paddle's "Something went wrong" popup). Console-only:
        // paste these lines verbatim when reporting.
        const name = event?.name ?? ''
        if (name.endsWith('.error')) {
          console.error(`[PADDLE] ${name}: ${event.type ?? ''}/${event.code ?? ''} — ${event.detail ?? ''}`, event.errors ?? '')
        } else if (name.endsWith('.warning')) {
          console.warn(`[PADDLE] ${name}: ${event.type ?? ''}/${event.code ?? ''} — ${event.detail ?? ''}`, event.errors ?? '')
        }
        if (name === 'checkout.completed' && completedHandler) {
          const fn = completedHandler
          completedHandler = null
          fn()
        }
      },
    })
    initializedToken = clientToken
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: 'initialize-failed', detail: e instanceof Error ? e.message : String(e) }
  }
}

export interface OpenOverlayOptions {
  env: PaddleEnv
  clientToken: string
  transactionId: string
  onCompleted?: () => void
}

/**
 * Opens Paddle's overlay checkout for an existing transaction, in this page.
 * Returns `{ ok: false, reason }` when Paddle.js could not be used — the caller
 * surfaces the error (only redirect when `checkout.url` is a genuine EXTERNAL
 * page; never to our own site, see `isOwnSiteUrl`). `onCompleted` fires on
 * `checkout.completed`.
 */
export async function openTransactionCheckout(opts: OpenOverlayOptions): Promise<OverlayResult> {
  if (!opts.clientToken || !opts.transactionId) return { ok: false, reason: 'client-token-missing' }
  const ready = await ensurePaddleReady(opts.env, opts.clientToken)
  if (!ready.ok) return ready
  const sdk = window.Paddle
  if (!sdk || typeof sdk.Checkout?.open !== 'function') return { ok: false, reason: 'sdk-invalid' }
  try {
    completedHandler = opts.onCompleted ?? null
    sdk.Checkout.open({
      transactionId: opts.transactionId,
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: 'en',
        // v2.4.5: deliberately NO `customer` prefill (and no `allowLogout`).
        // Paddle's transaction-checkout service rejects settings.customer.email
        // with checkout.error `validation.no_validation_set`
        // (/data/settings/customer/email) — the field has no validation ruleset
        // in this context (Paddle's own prefill examples are items-based only).
        // The buyer types their email in Paddle's form instead; entitlement
        // routing is unaffected — paddle-webhook maps by custom_data.user_id set
        // server-side at transaction creation, never by email.
      },
    })
    return { ok: true }
  } catch (e) {
    completedHandler = null
    return { ok: false, reason: 'open-failed', detail: e instanceof Error ? e.message : String(e) }
  }
}

/** Closes the overlay checkout (no-op when Paddle.js never loaded). */
export function closePaddleCheckout(): void {
  try {
    window.Paddle?.Checkout?.close?.()
  } catch {
    // closing is best-effort — never let it break the post-purchase flow
  }
}

// --- checkout-session stash + ?_ptxn resume (v2.4.2) -----------------------------------------

const STASH_KEY = 'dm.paddle.checkout'

export interface StashedCheckout {
  transactionId: string
  clientToken: string
  env: PaddleEnv
}

/** Remembers the open checkout so a reload/redirect with ?_ptxn can resume it. */
export function rememberCheckoutSession(s: StashedCheckout): void {
  try {
    sessionStorage.setItem(STASH_KEY, JSON.stringify(s))
  } catch {
    // private mode / storage disabled — resume just won't be possible
  }
}

export function recallCheckoutSession(): StashedCheckout | null {
  try {
    const raw = sessionStorage.getItem(STASH_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Partial<StashedCheckout>
    if (typeof s.transactionId === 'string' && s.transactionId && typeof s.clientToken === 'string' && s.clientToken) {
      return { transactionId: s.transactionId, clientToken: s.clientToken, env: normalizePaddleEnv(s.env) }
    }
  } catch {
    // corrupt or unavailable — ignore
  }
  return null
}

export function clearCheckoutSession(): void {
  try {
    sessionStorage.removeItem(STASH_KEY)
  } catch {
    // ignore
  }
}

/**
 * Landing on the site with `?_ptxn=txn_…` in the URL means a checkout came
 * through Paddle's payment-link flow (the pre-2.4.2 redirect fallback did
 * exactly this). Strips the parameter and, when we stashed this exact
 * transaction, re-opens it as an overlay. Returns the transaction id found
 * (null = nothing to resume).
 */
export async function resumePaddleCheckoutFromUrl(onCompleted: () => void): Promise<string | null> {
  const txn = ptxnFromSearch(window.location.search)
  if (!txn) return null
  try {
    window.history.replaceState(null, '', window.location.pathname + window.location.hash)
  } catch {
    // history API unavailable (rare) — a leftover param is cosmetic only
  }
  const saved = recallCheckoutSession()
  if (!saved || saved.transactionId !== txn) return txn
  await openTransactionCheckout({
    env: saved.env,
    clientToken: saved.clientToken,
    transactionId: txn,
    onCompleted,
  })
  return txn
}