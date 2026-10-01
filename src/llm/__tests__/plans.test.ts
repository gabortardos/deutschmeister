import { describe, expect, it } from 'vitest'
import {
  annualSavingPercent,
  CREDIT_PACKS,
  formatEur,
  FREE_TTS_CHAR_CAP,
  packForCredit,
  planById,
  visiblePlans,
} from '../plans'

describe('plan catalog (M9, membership v3)', () => {
  it('sells Basic and Plus monthly, Supporter yearly, Pro dormant, Free not a purchase', () => {
    const visible = visiblePlans().map((p) => p.id)
    expect(visible).toEqual(['free', 'basic', 'plus', 'byo-supporter'])
    const purchasable = visiblePlans().filter((p) => p.monthlyEur !== null).map((p) => p.id)
    expect(purchasable).toEqual(['basic', 'plus'])
    expect(planById('pro')?.hidden).toBe(true)
    expect(planById('free')?.monthlyEur).toBeNull()
  })

  it('Supporter is the yearly-only BYO tier (owner decisions 2026-09-21)', () => {
    const s = planById('byo-supporter')
    expect(s).toMatchObject({
      monthlyEur: null,
      annualEur: 11.99,
      allowanceUsdMicros: 0,
      ttsCharCap: 0,
    })
    // must not promise platform HD voice (owner decision c) or "free forever"
    expect(s?.features.join(' ')).not.toMatch(/platform hd voice|free forever/i)
  })

  it('carries the v3 prices: Basic 3.99/29.99, Plus 5.99/49.99, Pro 9.99/89.99', () => {
    expect(planById('basic')).toMatchObject({ monthlyEur: 3.99, annualEur: 29.99 })
    expect(planById('plus')).toMatchObject({ monthlyEur: 5.99, annualEur: 49.99 })
    expect(planById('pro')).toMatchObject({ monthlyEur: 9.99, annualEur: 89.99 })
  })

  it('annual discounts land in the industry-standard 30–37% band', () => {
    expect(annualSavingPercent(3.99, 29.99)).toBeGreaterThanOrEqual(30)
    expect(annualSavingPercent(3.99, 29.99)).toBeLessThanOrEqual(37)
    expect(annualSavingPercent(5.99, 49.99)).toBeGreaterThanOrEqual(30)
    expect(annualSavingPercent(5.99, 49.99)).toBeLessThanOrEqual(35)
  })

  it('splits tiers on the voice boundary: free taste > basic 0 > plus 150k', () => {
    expect(planById('free')?.ttsCharCap).toBe(FREE_TTS_CHAR_CAP)
    expect(FREE_TTS_CHAR_CAP).toBe(20_000)
    expect(planById('basic')?.ttsCharCap).toBe(0)
    expect(planById('plus')?.ttsCharCap).toBe(150_000)
  })

  it('allowances are M13 fair-use guards: $10 / $20 / $40, strictly increasing', () => {
    expect(planById('free')?.allowanceUsdMicros).toBe(0)
    expect(planById('basic')?.allowanceUsdMicros).toBe(10_000_000)
    expect(planById('plus')?.allowanceUsdMicros).toBe(20_000_000)
    expect(planById('pro')?.allowanceUsdMicros).toBe(40_000_000)
    expect((planById('plus')?.allowanceUsdMicros ?? 0)).toBeGreaterThan(
      planById('basic')?.allowanceUsdMicros ?? 0,
    )
  })

  it('formats EUR display prices', () => {
    expect(formatEur(3.99)).toBe('€3.99')
    expect(formatEur(29.99)).toBe('€29.99')
  })
})

describe('M9.8 credit packs', () => {
  it('sells €2.90 → $3 and €5.90 → $7 with 6-month validity copy', () => {
    expect(CREDIT_PACKS.map((p) => [p.priceEur, p.creditUsdMicros])).toEqual([
      [2.9, 3_000_000],
      [5.9, 7_000_000],
    ])
    for (const p of CREDIT_PACKS) {
      expect(p.features.some((f) => f.toLowerCase().includes('6 months'))).toBe(true)
    }
  })

  it('maps checkout credit amounts back to catalog entries', () => {
    expect(packForCredit(3_000_000)?.id).toBe('small')
    expect(packForCredit(7_000_000)?.id).toBe('big')
    expect(packForCredit(123)).toBeUndefined()
  })
})

describe('M13 allowance retune (2026-10-01) — honesty copy', () => {
  it('never shows stale dollar-allowance copy (the old "$2/mo budget" story)', () => {
    const plans = [...visiblePlans(), planById('pro')!]
    for (const plan of plans) {
      for (const feature of plan.features) {
        expect(feature).not.toMatch(/\$\d+(\.\d+)?\/mo/)
        expect(feature).not.toMatch(/fair-use \w+ budget/i)
      }
    }
  })
})
