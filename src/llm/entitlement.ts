/**
 * Entitlement layer (M8) — the single config-driven place that decides HOW an AI
 * call is routed and what platform usage costs. Pure TS: no React, no network.
 *
 * Routing rules (PHASE2_PLAN decisions #2/#3; #1 amended by owner 2026-09-21):
 *   - BYO key            → 'byo': everything unlocked, direct browser→provider,
 *                          unmetered — BUT since M9.6 gated by the Supporter
 *                          membership (30-day free trial from the first saved
 *                          key, then €11.99/year; see byoAccess below).
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
  /** M9.6: false = key present but the Supporter gate is locked → fall through. */
  byoAllowed?: boolean
}

/** BYO wins whenever it's allowed (it's a feature, not a punishment); the teaser needs an account. */
export function resolveAiRoute(input: RouteInput): AiRoute {
  if (input.hasByoKey && input.byoAllowed !== false) return 'byo'
  return input.signedIn ? 'platform' : 'none'
}

// --- BYO Supporter gate (M9.6) ----------------------------------------------------------------
//
// Owner decision 2026-09-21 (amends the old "BYO free forever" lock): key-bringers
// get the whole system — and that system is worth a little money. Fair model:
// a 30-DAY FREE TRIAL starting the moment the user first saves a key, then the
// €11.99/year "Supporter" membership (Paddle plan 'byo-supporter'; no platform
// allowances — both chat AI and HD voice keep running on the user's own keys).
//
// This is a PRODUCT gate, not a security boundary: the key lives in the user's
// browser and works in any other OpenAI-compatible app regardless; the gate
// protects the value of the tutoring system layered on top of it.

/** Trial length in days from the first saved key (owner pick 2026-09-21: 30). */
export const BYO_TRIAL_DAYS = 30

export type ByoAccess = 'off' | 'member' | 'trial' | 'locked'

export interface ByoGateInput {
  hasKey: boolean
  /** True when ai_entitlements says plan 'byo-supporter' with a live period. */
  member: boolean
  /** Epoch ms of the first key entry (settings.byoKeyFirstSeenAt); null = not yet stamped. */
  trialStartMs: number | null
  nowMs?: number
}

/** Where does this user's BYO usage stand? 'off' = no key saved at all. */
export function byoAccess(input: ByoGateInput): ByoAccess {
  if (!input.hasKey) return 'off'
  if (input.member) return 'member'
  const now = input.nowMs ?? Date.now()
  // Not stamped yet = the write hasn't landed; grace as trial (clock starts now anyway).
  if (input.trialStartMs == null) return 'trial'
  return now < input.trialStartMs + BYO_TRIAL_DAYS * 86_400_000 ? 'trial' : 'locked'
}

/** Whole days of trial left (0 once expired; full length when not stamped). */
export function byoTrialDaysLeft(trialStartMs: number | null, nowMs?: number): number {
  if (trialStartMs == null) return BYO_TRIAL_DAYS
  const now = nowMs ?? Date.now()
  return Math.max(0, Math.ceil((trialStartMs + BYO_TRIAL_DAYS * 86_400_000 - now) / 86_400_000))
}

// --- teaser model + prices -----------------------------------------------------------------

/**
 * FALLBACK copy of the server-fixed teaser model (owner pick 2026-09-21: gpt-5-mini).
 * Since M8.1 the LIVE value arrives in every ai-proxy usage response and the client
 * store adopts it automatically; these bundled constants only serve offline sessions
 * and clients talking to a not-yet-redeployed function.
 */
export const TEASER_MODEL = 'gpt-5-mini'

/** Teaser budget in micro-USD ($1 = 1_000_000 µ$). */
export const TEASER_CAP_USD_MICROS = 1_000_000

/** Price row: USD per 1M tokens, input and output. */
export interface PlatformPriceRow {
  in: number
  out: number
}

/** model → price row. */
export type PlatformPrices = Readonly<Record<string, PlatformPriceRow>>

/** Price row used when a model is missing from the table (gpt-5-mini launch price). */
export const DEFAULT_PLATFORM_PRICE: PlatformPriceRow = { in: 0.25, out: 2 }

/**
 * USD per 1M tokens for platform models — the FALLBACK copy of the Edge Function's
 * PRICES table. Since M8.1 the function PUBLISHES its live model+prices in every
 * usage response and the platform store adopts them, so a provider/price change in
 * the function updates the client meter automatically; this copy only serves
 * offline sessions and older function deployments.
 * gpt-5-mini launch pricing $0.25 in / $2.00 out — revisit at M9 (prices drift).
 */
export const PLATFORM_PRICES_USD_PER_M: PlatformPrices = {
  'gpt-5-mini': { in: 0.25, out: 2 },
}

/**
 * HD TTS is metered in characters. Google Neural2's free tier (~1M chars/month)
 * comfortably covers teaser usage → priced $0 for now; flip at M9 if it outgrows
 * the free tier. The server separately caps chars (see PLATFORM_TTS_MONTHLY_CHAR_CAP).
 */
export const PLATFORM_TTS_PRICE_USD_PER_M_CHARS = 0

/**
 * Server-side monthly char guard for platform TTS (abuse limit at the $0 price).
 * M9: superseded by PER-PLAN caps (free taste 20k, plus 150k — see
 * src/llm/plans.ts and the ai_entitlements.tts_char_cap column); this constant
 * remains only as the pre-M9 fallback for old deployments.
 */
export const PLATFORM_TTS_MONTHLY_CHAR_CAP = 200_000

/** Cost of one metered chat call in micro-USD against any price table. Pure. */
export function chatCostUsdMicrosWith(
  prices: PlatformPrices,
  model: string,
  tokensIn: number,
  tokensOut: number,
): number {
  const price = prices[model] ?? DEFAULT_PLATFORM_PRICE
  return Math.round(tokensIn * price.in + tokensOut * price.out)
}

/** Cost against the bundled fallback table (offline/tests). */
export function chatCostUsdMicros(model: string, tokensIn: number, tokensOut: number): number {
  return chatCostUsdMicrosWith(PLATFORM_PRICES_USD_PER_M, model, tokensIn, tokensOut)
}

/** Remaining budget in micro-USD, never below zero. */
export function remainingUsdMicros(capUsdMicros: number, spendUsdMicros: number): number {
  return Math.max(0, capUsdMicros - Math.max(0, spendUsdMicros))
}

/** '$0.87' from micro-USD. */
export function formatUsdMicros(micros: number): string {
  return `$${(micros / 1_000_000).toFixed(2)}`
}

// --- M9 monthly budgets -----------------------------------------------------------------------

/**
 * Monthly-aware budget math (M9). The $1 teaser and credit packs are LIFETIME
 * pools; a subscription's monthly allowance is a CALENDAR-MONTH pool that only
 * counts while the subscription is active (`allowanceActive`: valid_until in
 * the future, or null). Consumption order: lifetime pools first, then this
 * month's allowance — so an earlier teaser spend never eats a paid allowance.
 *
 * Pure mirror of the same computation in `ai-proxy`'s budgetOf (kept in sync;
 * unit-tested here because the Edge Function itself has no test harness).
 */
export interface MonthlyBudgetInput {
  teaserCapUsdMicros: number
  creditUsdMicros: number
  monthlyAllowanceUsdMicros: number
  /** All-time metered platform spend (SUM of ai_usage.cost_usd_micros). */
  lifetimeSpendUsdMicros: number
  /** Metered platform spend since the 1st of the current UTC month. */
  monthSpendUsdMicros: number
  /** False when the subscription has lapsed (valid_until in the past). */
  allowanceActive: boolean
}

export interface BudgetResult {
  capUsdMicros: number
  remainingUsdMicros: number
}

export function remainingBudgetWithMonthly(input: MonthlyBudgetInput): BudgetResult {
  const nonMonthly = Math.max(0, input.teaserCapUsdMicros) + Math.max(0, input.creditUsdMicros)
  const lifetimeSpend = Math.max(0, input.lifetimeSpendUsdMicros)
  const coveredByNonMonthly = Math.min(lifetimeSpend, nonMonthly)
  const lifetimeRemaining = nonMonthly - coveredByNonMonthly
  // Spend beyond the lifetime pools can only have come from an allowance — but
  // only THIS month's slice of it may consume this month's allowance window.
  const beyond = lifetimeSpend - coveredByNonMonthly
  const allowance = input.allowanceActive ? Math.max(0, input.monthlyAllowanceUsdMicros) : 0
  const allowanceUsed = Math.min(Math.max(0, input.monthSpendUsdMicros), beyond)
  const allowanceRemaining = Math.max(0, allowance - allowanceUsed)
  return {
    capUsdMicros: nonMonthly + allowance,
    remainingUsdMicros: lifetimeRemaining + allowanceRemaining,
  }
}

// --- failure classification -----------------------------------------------------------------

export type PlatformErrorKind =
  | 'exhausted'
  | 'rate-limited'
  | 'verify-email'
  | 'auth'
  | 'network'
  | 'server'
  | 'hd-voice'

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
      message: 'Your AI budget is used up for now.',
      hint: 'Add your own API key in Settings → AI Model (free, unlimited), or upgrade in Settings → Account & Billing.',
    }
  }
  if (code === 'hd-voice-not-in-plan') {
    return {
      kind: 'hd-voice',
      message: 'HD cloud voice is a Plus feature — browser voices keep working free.',
      hint: 'Upgrade in Settings → Account & Billing, or use your own Google voice key.',
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
