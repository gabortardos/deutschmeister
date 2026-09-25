import { describe, expect, it } from 'vitest'
import {
  annualSavingPercent,
  formatEur,
  FREE_TTS_CHAR_CAP,
  planById,
  visiblePlans,
} from '../plans'

describe('plan catalog (M9, membership v3)', () => {
  it('sells exactly Basic and Plus; Pro stays dormant, Free is not a purchase', () => {
    const visible = visiblePlans().map((p) => p.id)
    expect(visible).toEqual(['free', 'basic', 'plus'])
    const purchasable = visiblePlans().filter((p) => p.monthlyEur !== null).map((p) => p.id)
    expect(purchasable).toEqual(['basic', 'plus'])
    expect(planById('pro')?.hidden).toBe(true)
    expect(planById('free')?.monthlyEur).toBeNull()
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

  it('only Plus gets bigger budgets than Basic (fair-use ceilings)', () => {
    expect(planById('free')?.allowanceUsdMicros).toBe(0)
    expect(planById('basic')?.allowanceUsdMicros).toBe(2_000_000)
    expect(planById('plus')?.allowanceUsdMicros).toBe(3_500_000)
    expect((planById('plus')?.allowanceUsdMicros ?? 0)).toBeGreaterThan(
      planById('basic')?.allowanceUsdMicros ?? 0,
    )
  })

  it('formats EUR display prices', () => {
    expect(formatEur(3.99)).toBe('€3.99')
    expect(formatEur(29.99)).toBe('€29.99')
  })
})
