import { describe, expect, it } from 'vitest'
import {
  chatCostUsdMicros,
  classifyPlatformFailure,
  formatUsdMicros,
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
