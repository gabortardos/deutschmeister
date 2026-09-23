/**
 * Entitlement layer (M8) — the single config-driven place that decides HOW an AI
 * call is routed and what platform usage costs. Pure TS: no React, no network.
 *
 * Routing rules (PHASE2_PLAN locked decisions #2/#3):
 *   - BYO key            → 'byo': everything unlocked, direct browser→provider,
 *                          free, unmetered (unchanged M3 behavior).
 *   - No key but signed in → 'platform': calls go through the `ai-proxy` Supabase
 *                          Edge Function with the owner's key (never in the client),
 *                          metered server-side: Pro allowance + credit + $1 teaser.
 *   - Neither            → 'none': deterministic core only.
 * Dormant option #1 door: per-feature gating later is a config change HERE.
 */

export type AiRoute = 'byo' | 'platform' | 'none'

export interface RouteInput {
  hasByoKey: boolean
  signedIn: boolean
}

/** BYO always wins (it's a feature, not a punishment); the teaser needs an account. */
export function resolveAiRoute(input: RouteInput): AiRoute {
  if (input.hasByoKey) return 'byo'
  return input.signedIn ? 'platform' : 'none'
}

// --- teaser model + prices -----------------------------------------------------------------

/**
 * Server-fixed model of the platform teaser (owner pick 2026-09-21: gpt-5-mini;
 * the later switch to glm-4.5-flash is this constant + the Edge Function's twin).
 */
export const TEASER_MODEL = 'gpt-5-mini'

/** Teaser budget in micro-USD ($1 = 1_000_000 µ$). */
export const TEASER_CAP_USD_MICROS = 1_000_000

/**
 * USD per 1M tokens for platform models — mirror of the Edge Function's PRICES
 * table (the function is authoritative for billing; this copy drives UI display).
 * gpt-5-mini launch pricing $0.25 in / $2.00 out — revisit at M9 (prices drift).
 */
export const PLATFORM_PRICES_USD_PER_M: Readonly<Record<string, { in: number; out: number }>> = {
  'gpt-5-mini': { in: 0.25, out: 2 },
}

/**
 * HD TTS is metered in characters. Google Neural2's free tier (~1M chars/month)
 * comfortably covers teaser usage → priced $0 for now; flip at M9 if it outgrows
 * the free tier. The server separately caps chars (see PLATFORM_TTS_MONTHLY_CHAR_CAP).
 */
export const PLATFORM_TTS_PRICE_USD_PER_M_CHARS = 0

/** Server-side monthly char guard for platform TTS (abuse limit at the $0 price). */
export const PLATFORM_TTS_MONTHLY_CHAR_CAP = 200_000

/** Cost of one metered chat call in micro-USD. Pure — mirrored in the Edge Function. */
export function chatCostUsdMicros(model: string, tokensIn: number, tokensOut: number): number {
  const price = PLATFORM_PRICES_USD_PER_M[model] ?? { in: 0.25, out: 2 }
  return Math.round(tokensIn * price.in + tokensOut * price.out)
}

/** Remaining budget in micro-USD, never below zero. */
export function remainingUsdMicros(capUsdMicros: number, spendUsdMicros: number): number {
  return Math.max(0, capUsdMicros - Math.max(0, spendUsdMicros))
}

/** '$0.87' from micro-USD. */
export function formatUsdMicros(micros: number): string {
  return `$${(micros / 1_000_000).toFixed(2)}`
}

// --- failure classification -----------------------------------------------------------------

export type PlatformErrorKind =
  | 'exhausted'
  | 'rate-limited'
  | 'verify-email'
  | 'auth'
  | 'network'
  | 'server'

export interface PlatformFailure {
  kind: PlatformErrorKind
  message: string
  hint?: string
}

/** Maps an ai-proxy failure (HTTP status + the function's `error` code) to UI copy. */
export function classifyPlatformFailure(status: number, code: string | null): PlatformFailure {
  if (status === 402 || code === 'exhausted') {
    return {
      kind: 'exhausted',
      message: 'Your free $1 AI credit is used up.',
      hint: 'Add your own API key in Settings → AI Model (free, unlimited) — paid plans arrive soon.',
    }
  }
  if (status === 429 || code === 'rate-limited') {
    return {
      kind: 'rate-limited',
      message: 'Too many AI requests in a short time — wait a few seconds and try again.',
    }
  }
  if (status === 403 || code === 'verify-email') {
    return {
      kind: 'verify-email',
      message: 'Verify your email address to use the free AI credit.',
    }
  }
  if (status === 401) {
    return { kind: 'auth', message: 'Please sign in again to use the free AI credit.' }
  }
  if (status === 0) {
    return { kind: 'network', message: 'Could not reach the DeutschMeister AI service.' }
  }
  return { kind: 'server', message: 'The DeutschMeister AI service had a problem — please try again.' }
}
