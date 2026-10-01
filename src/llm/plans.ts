/**
 * Plan catalog (M9) — the single config file for WHAT we sell and what each
 * tier includes, membership structure v3 (owner-approved 2026-09-21).
 *
 * This module is the CLIENT-side source for pricing UI copy (names, EUR display
 * prices, feature lists, badge). The AUTHORITATIVE per-user numbers (monthly AI
 * budget, HD-voice char cap) live in the `ai_entitlements` row written by the
 * `paddle-webhook` Edge Function and are published live by `ai-proxy` usage
 * responses (M8.1 pattern) — so changing an allowance there never needs a
 * client rebuild, and this catalog never lies to the meter.
 *
 * Pure TS: no React, no network.
 */

export type PlanId = 'free' | 'basic' | 'plus' | 'pro' | 'byo-supporter'
export type BillingInterval = 'month' | 'year'

export interface PlanCatalogEntry {
  id: PlanId
  name: string
  tagline: string
  /** Display-only EUR prices (Paddle is merchant of record; VAT handled there). */
  monthlyEur: number | null
  annualEur: number | null
  features: string[]
  /**
   * Fair-use monthly platform-AI budget (M13 retune, owner-approved 2026-10-01:
   * $10 / $20 / $40). These are ABUSE GUARDS sized 2–6× above a heavy learning
   * month (≈ $1.5–2 normal, ≈ $4–6 heavy at nominal glm-4.6 prices) — a human
   * learner never reaches them; tiers really differ by HD voice. The webhook's
   * PLANS table is the authority either way.
   */
  allowanceUsdMicros: number
  /** Monthly platform HD-voice chars included in the plan. */
  ttsCharCap: number
  badge?: string
  /** Dormant tiers are never rendered (Pro waits for M11 content). */
  hidden?: boolean
}

/** M9 free tier: HD-voice taste ≈ 65 spoken replies/month. */
export const FREE_TTS_CHAR_CAP = 20_000

export const PLAN_CATALOG: readonly PlanCatalogEntry[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'The whole course, forever',
    monthlyEur: null,
    annualEur: null,
    allowanceUsdMicros: 0,
    ttsCharCap: FREE_TTS_CHAR_CAP,
    features: [
      'Full offline course — vocabulary, grammar, SRS review',
      '$1 of managed AI credit (one-time welcome)',
      'HD voice taste: ~20k characters/month',
      'Browser voices free forever · own API key after a 30-day trial (Supporter €11.99/yr)',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'The managed AI tutor',
    monthlyEur: 3.99,
    annualEur: 29.99,
    allowanceUsdMicros: 10_000_000,
    ttsCharCap: 0,
    features: [
      'Everything in Free',
      'Managed AI tutor — no API key needed (generous fair use — normal learning never hits the cap)',
      'Browser voices stay free & unlimited (no platform HD voice)',
      'Progress sync across devices',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    tagline: 'AI tutor + HD voice',
    monthlyEur: 5.99,
    annualEur: 49.99,
    allowanceUsdMicros: 20_000_000,
    ttsCharCap: 150_000,
    badge: 'Most popular',
    features: [
      'Everything in Basic',
      'Platform HD voice — ~150k characters/month',
      'Larger fair-use headroom for heavy practice days',
      'Priority email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For dedicated learners',
    monthlyEur: 9.99,
    annualEur: 89.99,
    allowanceUsdMicros: 40_000_000,
    ttsCharCap: 300_000,
    // Dormant until M11.10b: owner creates the Paddle products → PADDLE_PRICE_MAP
    // in both Paddle functions → remove this flag. Selling promises = refunds.
    hidden: true,
    features: [
      'Everything in Plus',
      'Writing studio: AI prompts + full-rewrite grading (250 words, 5 pieces/day)',
      'Streaming tutor replies',
      '~300k characters/month of platform HD voice',
      'Priority support',
    ],
  },
  {
    id: 'byo-supporter',
    name: 'Supporter',
    tagline: 'For learners with their own API key',
    // Owner decision 2026-09-21: yearly-only, €11.99/yr, NO platform allowances —
    // chat AI and HD voice keep running on the user's own keys (that's the point).
    // monthlyEur null ⇒ rendered on the Annual tab only (BillingSection filter).
    monthlyEur: null,
    annualEur: 11.99,
    allowanceUsdMicros: 0,
    ttsCharCap: 0,
    features: [
      'The whole system on YOUR key — after the 30-day free trial',
      'Your AI runs on your own provider: unmetered, never stored by us',
      'Bring your own Google TTS key for the full HD-voice list',
      'Early access to new features + keeps an indie project alive ❤',
    ],
  },
]

/** Visible plans for pricing UI (hidden tiers excluded). */
export function visiblePlans(): readonly PlanCatalogEntry[] {
  return PLAN_CATALOG.filter((p) => !p.hidden)
}

export function planById(id: string): PlanCatalogEntry | undefined {
  return PLAN_CATALOG.find((p) => p.id === id)
}

/** '€3.99' from a number (EUR is our locked pricing currency). */
export function formatEur(value: number): string {
  return `€${value.toFixed(2)}`
}

/** Annual discount as a whole-percent number (30 for "30% off"). */
export function annualSavingPercent(monthlyEur: number, annualEur: number): number {
  if (monthlyEur <= 0) return 0
  return Math.round((1 - annualEur / (monthlyEur * 12)) * 100)
}

// --- M9.8 one-time AI Credit Packs -------------------------------------------------------------

export interface CreditPackCatalogEntry {
  id: 'small' | 'big'
  name: string
  /** One-time price in EUR (Paddle one-time prices; VAT handled by Paddle). */
  priceEur: number
  /** Platform-AI credit this pack grants (micro-USD). */
  creditUsdMicros: number
  features: string[]
}

/**
 * One-time top-ups (owner-approved: €2.90 → $3 / €5.90 → $7 with a bonus),
 * valid 6 months from purchase. Consumed like the $1 teaser but FIRST among
 * the lifetime pools (soonest-expiring pack first — see entitlement.ts). Sold
 * next to the plans; the price IDs come from the checkout function's catalog.
 */
export const CREDIT_PACKS: readonly CreditPackCatalogEntry[] = [
  {
    id: 'small',
    name: 'Starter credit',
    priceEur: 2.9,
    creditUsdMicros: 3_000_000,
    features: [
      '$3.00 of managed-AI credit — no API key needed',
      'One-time purchase, no subscription',
      'Valid for 6 months · stacks with any plan',
    ],
  },
  {
    id: 'big',
    name: 'Big credit',
    priceEur: 5.9,
    creditUsdMicros: 7_000_000,
    features: [
      '$7.00 of managed-AI credit (bonus vs. Starter)',
      'One-time purchase, no subscription',
      'Valid for 6 months · stacks with any plan',
    ],
  },
]

/** Catalog entry matching a checkout credit amount (the price map owns priceIds). */
export function packForCredit(creditUsdMicros: number): CreditPackCatalogEntry | undefined {
  return CREDIT_PACKS.find((p) => p.creditUsdMicros === creditUsdMicros)
}
