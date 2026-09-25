import { describe, expect, it } from 'vitest'
import {
  chatCostUsdMicros,
  chatCostUsdMicrosWith,
  classifyPlatformFailure,
  formatUsdMicros,
  remainingBudgetWithMonthly,
  remainingUsdMicros,
  resolveAiRoute,
  TEASER_CAP_USD_MICROS,
} from '../entitlement'

describe('resolveAiRoute (entitlement layer)', () => {
  it('a BYO key always wins, even when signed in', () => {
    expect(resolveAiRoute({ hasByoKey: true, signedIn: true })).toBe('byo')
    expect(resolveAiRoute({ hasByoKey: true, signedIn: false })).toBe('byo')
  })

  it('signed-in keyless users get the platform teaser', () => {
    expect(resolveAiRoute({ hasByoKey: false, signedIn: true })).toBe('platform')
  })

  it('guests without a key get no AI layer (deterministic core only)', () => {
    expect(resolveAiRoute({ hasByoKey: false, signedIn: false })).toBe('none')
  })
})

describe('platform pricing', () => {
  it('prices a gpt-5-mini call in micro-USD (mirror of the Edge Function)', () => {
    // 4000 in × $0.25/1M = 1000 µ$ ; 500 out × $2/1M = 1000 µ$ → 2000 µ$
    expect(chatCostUsdMicros('gpt-5-mini', 4000, 500)).toBe(2000)
  })

  it('unknown models fall back to the gpt-5-mini price row', () => {
    expect(chatCostUsdMicros('glm-4.5-flash', 4000, 500)).toBe(2000)
  })

  it('prices a call against a server-published price table', () => {
    const serverPrices = { 'glm-4.5-flash': { in: 0.11, out: 0.6 } }
    // 1M in × $0.11 + 1M out × $0.60 = 710_000 µ$
    expect(chatCostUsdMicrosWith(serverPrices, 'glm-4.5-flash', 1_000_000, 1_000_000)).toBe(
      710_000,
    )
  })

  it('unknown models fall back to the default row in server tables too', () => {
    expect(chatCostUsdMicrosWith({}, 'whatever', 4000, 500)).toBe(2000)
  })
})

describe('budget math + formatting', () => {
  it('remaining never goes below zero', () => {
    expect(remainingUsdMicros(1_000_000, 1_500_000)).toBe(0)
  })

  it('formats micro-USD as dollars', () => {
    expect(formatUsdMicros(TEASER_CAP_USD_MICROS)).toBe('$1.00')
    expect(formatUsdMicros(630_000)).toBe('$0.63')
  })
})

describe('classifyPlatformFailure', () => {
  it('maps 402/exhausted to the paywall message with the BYO escape hatch', () => {
    const f = classifyPlatformFailure(402, 'exhausted')
    expect(f.kind).toBe('exhausted')
    expect(f.hint).toContain('own API key')
  })

  it('maps 429 and the rate-limited code', () => {
    expect(classifyPlatformFailure(429, null).kind).toBe('rate-limited')
    expect(classifyPlatformFailure(200, 'rate-limited').kind).toBe('rate-limited')
  })

  it('maps 403 to verify-email and 401 to re-auth', () => {
    expect(classifyPlatformFailure(403, null).kind).toBe('verify-email')
    expect(classifyPlatformFailure(401, null).kind).toBe('auth')
  })

  it('maps network failure and everything else', () => {
    expect(classifyPlatformFailure(0, null).kind).toBe('network')
    expect(classifyPlatformFailure(500, null).kind).toBe('server')
  })
})

describe('remainingBudgetWithMonthly (M9 lifetime + monthly pools)', () => {
  const base = {
    teaserCapUsdMicros: 1_000_000, // $1 teaser
    creditUsdMicros: 0,
    monthlyAllowanceUsdMicros: 0,
    allowanceActive: true,
  }

  it('reduces to the M8 teaser math when there is no allowance (free tier)', () => {
    expect(
      remainingBudgetWithMonthly({ ...base, lifetimeSpendUsdMicros: 400_000, monthSpendUsdMicros: 400_000 }),
    ).toEqual({ capUsdMicros: 1_000_000, remainingUsdMicros: 600_000 })
    expect(
      remainingBudgetWithMonthly({ ...base, lifetimeSpendUsdMicros: 1_500_000, monthSpendUsdMicros: 0 }),
    ).toEqual({ capUsdMicros: 1_000_000, remainingUsdMicros: 0 })
  })

  it('gives a fresh Plus subscriber their full allowance even with the teaser long gone', () => {
    // Lifetime spend $1 (the whole teaser), nothing this month, $3.5 allowance.
    expect(
      remainingBudgetWithMonthly({
        ...base,
        monthlyAllowanceUsdMicros: 3_500_000,
        lifetimeSpendUsdMicros: 1_000_000,
        monthSpendUsdMicros: 0,
      }),
    ).toEqual({ capUsdMicros: 4_500_000, remainingUsdMicros: 3_500_000 })
  })

  it('spends this month against the allowance without double-counting the teaser', () => {
    // Teaser burned earlier ($1 lifetime before this month); $2 spent THIS month.
    expect(
      remainingBudgetWithMonthly({
        ...base,
        monthlyAllowanceUsdMicros: 3_500_000,
        lifetimeSpendUsdMicros: 3_000_000, // 1M old teaser + 2M this month
        monthSpendUsdMicros: 2_000_000,
      }),
    ).toEqual({ capUsdMicros: 4_500_000, remainingUsdMicros: 1_500_000 })
  })

  it('never lets a past month\u2019s allowance spend eat this month\u2019s allowance', () => {
    // $4 lifetime spend all in PREVIOUS paid months; this month: nothing yet.
    expect(
      remainingBudgetWithMonthly({
        ...base,
        monthlyAllowanceUsdMicros: 3_500_000,
        lifetimeSpendUsdMicros: 4_000_000,
        monthSpendUsdMicros: 0,
      }),
    ).toEqual({ capUsdMicros: 4_500_000, remainingUsdMicros: 3_500_000 })
  })

  it('drops the allowance when the subscription lapsed (valid_until in the past)', () => {
    expect(
      remainingBudgetWithMonthly({
        ...base,
        monthlyAllowanceUsdMicros: 3_500_000,
        lifetimeSpendUsdMicros: 4_000_000,
        monthSpendUsdMicros: 1_000_000,
        allowanceActive: false,
      }),
    ).toEqual({ capUsdMicros: 1_000_000, remainingUsdMicros: 0 })
  })

  it('stacks credit packs on top and clamps at zero', () => {
    expect(
      remainingBudgetWithMonthly({
        ...base,
        creditUsdMicros: 3_000_000,
        monthlyAllowanceUsdMicros: 2_000_000,
        lifetimeSpendUsdMicros: 2_500_000,
        monthSpendUsdMicros: 2_500_000,
      }),
    ).toEqual({ capUsdMicros: 6_000_000, remainingUsdMicros: 3_500_000 })
  })
})

