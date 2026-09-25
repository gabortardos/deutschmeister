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

export type PlanId = 'free' | 'basic' | 'plus' | 'pro'
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
   * Fair-use monthly platform-AI budget. Values below are for the ACTIVE
   * gpt-5-mini backend ($2 Basic / $3.5 Plus); the coding-plan backend would be
   * $3 / $5 — the webhook's PLANS table is the authority either way.
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
      'Browser voices + your own API keys: free forever',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'The managed AI tutor',
    monthlyEur: 3.99,
    annualEur: 29.99,
    allowanceUsdMicros: 2_000_000,
    ttsCharCap: 0,
    features: [
      'Everything in Free',
      'Managed AI tutor — no API key needed ($2/mo fair-use budget)',
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
    allowanceUsdMicros: 3_500_000,
    ttsCharCap: 150_000,
    badge: 'Most popular',
    features: [
      'Everything in Basic',
      'Platform HD voice — ~150k characters/month',
      'Bigger fair-use AI budget ($3.5/mo)',
      'Priority email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For dedicated learners (coming with the M11 content expansion)',
    monthlyEur: 9.99,
    annualEur: 89.99,
    allowanceUsdMicros: 8_000_000,
    ttsCharCap: 400_000,
    hidden: true, // dormant until M11 fills it — never sell promises
    features: [
      'Everything in Plus',
      'Larger HD-voice allowance',
      'Premium tutoring features (in development)',
      'Priority support',
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
