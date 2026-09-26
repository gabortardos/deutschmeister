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
 *   3. `Paddle.Initialize({ token, environment })` — once per page (Paddle
 *      throws if called twice; we remember the token we initialized with).
 *   4. `Paddle.Checkout.open({ transactionId })` — Paddle's overlay checkout;
 *      card data goes straight to Paddle (MoR), never through this app.
 *   5. `checkout.completed` (via the Initialize `eventCallback`) → we close the
 *      overlay and poll the meter until the webhook grants the plan.
 *
 * The client-side token is public by design (it can only open checkouts); it
 * still arrives via the Edge Function so the sandbox→live switch stays a pure
 * secret-value swap. Everything is defensive: any failure returns `false` and
 * BillingSection falls back to redirecting to `checkout.url`.
 */

export type PaddleEnv = 'sandbox' | 'live'

export interface PaddleEvent {
  name?: string
  data?: unknown
}

export interface PaddleInitializeOptions {
  token: string
  environment?: string
  eventCallback?: (event: PaddleEvent) => void
}

export interface PaddleCheckoutOpenOptions {
  transactionId?: string
  settings?: Record<string, unknown>
}

export interface PaddleSdk {
  Initialize?: (options: PaddleInitializeOptions) => void
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

/**
 * Loads Paddle.js and calls `Paddle.Initialize` exactly once per page load.
 * Returns false when the script or the init fails (blocked, offline, bad token…).
 */
export async function ensurePaddleReady(env: PaddleEnv, clientToken: string): Promise<boolean> {
  if (!clientToken) return false
  const sdk = await loadPaddleSdk()
  if (!sdk || typeof sdk.Initialize !== 'function') return false
  if (initializedToken === clientToken) return true
  try {
    sdk.Initialize({
      token: clientToken,
      ...(env === 'sandbox' ? { environment: 'sandbox' } : {}),
      eventCallback: (event: PaddleEvent) => {
        if (event?.name === 'checkout.completed' && completedHandler) {
          const fn = completedHandler
          completedHandler = null
          fn()
        }
      },
    })
    initializedToken = clientToken
    return true
  } catch {
    return false
  }
}

export interface OpenOverlayOptions {
  env: PaddleEnv
  clientToken: string
  transactionId: string
  customerEmail?: string
  onCompleted?: () => void
}

/**
 * Opens Paddle's overlay checkout for an existing transaction, in this page.
 * Returns false when Paddle.js could not be used (caller should fall back to
 * redirecting to `checkout.url`). `onCompleted` fires on `checkout.completed`.
 */
export async function openTransactionCheckout(opts: OpenOverlayOptions): Promise<boolean> {
  if (!opts.clientToken || !opts.transactionId) return false
  if (!(await ensurePaddleReady(opts.env, opts.clientToken))) return false
  const sdk = window.Paddle
  if (!sdk || typeof sdk.Checkout?.open !== 'function') return false
  try {
    completedHandler = opts.onCompleted ?? null
    sdk.Checkout.open({
      transactionId: opts.transactionId,
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: 'en',
        allowLogout: false,
        ...(opts.customerEmail ? { customer: { email: opts.customerEmail } } : {}),
      },
    })
    return true
  } catch {
    completedHandler = null
    return false
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