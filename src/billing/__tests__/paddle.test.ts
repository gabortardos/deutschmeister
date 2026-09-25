import { describe, expect, it } from 'vitest'
import {
  hmacSha256Hex,
  parsePaddleSignature,
  parsePriceMap,
  PADDLE_SIGNATURE_MAX_AGE_SEC,
  signedPayload,
  signatureTimestampFresh,
  subscriptionPlanOf,
  timingSafeEqualHex,
  verifyPaddleSignature,
} from '../paddle'

const SECRET = 'pdl_ntfset_test_secret_0123456789'
const BODY = JSON.stringify({ event_id: 'evt_01abc', event_type: 'subscription.activated' })

async function sign(ts: string, body: string, secret = SECRET): Promise<string> {
  return (await hmacSha256Hex(secret, signedPayload(ts, body))).toLowerCase()
}

describe('Paddle signature verification (webhook twin)', () => {
  const NOW = 1_800_000_000
  const freshTs = String(NOW - 10)

  it('parses the ts/h1 header pair and rejects malformed headers', () => {
    expect(parsePaddleSignature(`ts=${freshTs};h1=deadbeef`)).toEqual({ ts: freshTs, h1: 'deadbeef' })
    expect(parsePaddleSignature(null)).toBeNull()
    expect(parsePaddleSignature('h1=deadbeef')).toBeNull()
    expect(parsePaddleSignature('ts=123')).toBeNull()
    expect(parsePaddleSignature('garbage')).toBeNull()
  })

  it('signs exactly ts:rawBody', () => {
    expect(signedPayload('123', '{"a":1}')).toBe('123:{"a":1}')
  })

  it('compares hex without length or early-exit leaks', () => {
    expect(timingSafeEqualHex('aabb', 'aabb')).toBe(true)
    expect(timingSafeEqualHex('aabb', 'aabc')).toBe(false)
    expect(timingSafeEqualHex('aabb', 'aab')).toBe(false)
    expect(timingSafeEqualHex('', '')).toBe(false)
  })

  it('accepts a recent, correctly-signed webhook', async () => {
    const h1 = await sign(freshTs, BODY)
    const header = `ts=${freshTs};h1=${h1}`
    expect(await verifyPaddleSignature(header, BODY, SECRET, NOW)).toBe(true)
  })

  it('rejects a tampered body, wrong secret, stale ts, and bad header', async () => {
    const h1 = await sign(freshTs, BODY)
    const header = `ts=${freshTs};h1=${h1}`
    expect(await verifyPaddleSignature(header, BODY + ' ', SECRET, NOW)).toBe(false)
    expect(await verifyPaddleSignature(header, BODY, 'wrong-secret', NOW)).toBe(false)
    expect(await verifyPaddleSignature(header, BODY, '', NOW)).toBe(false)
    expect(await verifyPaddleSignature(null, BODY, SECRET, NOW)).toBe(false)

    const staleTs = String(NOW - PADDLE_SIGNATURE_MAX_AGE_SEC - 5)
    const staleH1 = await sign(staleTs, BODY)
    expect(await verifyPaddleSignature(`ts=${staleTs};h1=${staleH1}`, BODY, SECRET, NOW)).toBe(false)
  })

  it('treats ts as seconds within ±300s of now', () => {
    expect(signatureTimestampFresh(String(NOW - 10), NOW)).toBe(true)
    expect(signatureTimestampFresh(String(NOW - 301), NOW)).toBe(false)
    expect(signatureTimestampFresh(String(NOW + 301), NOW)).toBe(false)
    expect(signatureTimestampFresh('not-a-number', NOW)).toBe(false)
  })
})

describe('PADDLE_PRICE_MAP parsing', () => {
  const mapRaw = JSON.stringify({
    pri_basic_m: { plan: 'basic', kind: 'subscription', interval: 'month' },
    pri_plus_y: { plan: 'plus', kind: 'subscription', interval: 'year' },
    pri_credit3: { kind: 'credit', creditUsdMicros: 3_000_000 },
  })

  it('parses the secret JSON and resolves subscription plans', () => {
    const map = parsePriceMap(mapRaw)!
    expect(map).not.toBeNull()
    expect(subscriptionPlanOf(map, 'pri_basic_m')).toBe('basic')
    expect(subscriptionPlanOf(map, 'pri_plus_y')).toBe('plus')
    expect(subscriptionPlanOf(map, 'pri_credit3')).toBeNull() // credit, not a plan
    expect(subscriptionPlanOf(map, 'pri_unknown')).toBeNull()
    expect(subscriptionPlanOf(map, undefined)).toBeNull()
  })

  it('returns null for unset or invalid JSON (function replies not-configured)', () => {
    expect(parsePriceMap(undefined)).toBeNull()
    expect(parsePriceMap('')).toBeNull()
    expect(parsePriceMap('{not json')).toBeNull()
  })
})
