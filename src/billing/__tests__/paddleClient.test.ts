import { describe, expect, it } from 'vitest'
import { isOwnSiteUrl, normalizePaddleEnv, parseCheckoutResponse, ptxnFromSearch } from '../paddleClient'

describe('Paddle client pure helpers (overlay checkout, v2.4.1)', () => {
  it('normalizes the env — only exactly "live" counts as live', () => {
    expect(normalizePaddleEnv('live')).toBe('live')
    expect(normalizePaddleEnv('sandbox')).toBe('sandbox')
    expect(normalizePaddleEnv('SANDBOX')).toBe('sandbox')
    expect(normalizePaddleEnv(undefined)).toBe('sandbox')
    expect(normalizePaddleEnv('production')).toBe('sandbox')
    expect(normalizePaddleEnv(42)).toBe('sandbox')
  })

  it('parses a full checkout response (overlay + redirect fallback available)', () => {
    expect(
      parseCheckoutResponse({
        transactionId: 'txn_01abc',
        clientToken: 'test_abc',
        env: 'sandbox',
        url: 'https://gabortardos.github.io/deutschmeister/?_ptxn=txn_01abc',
      }),
    ).toEqual({
      transactionId: 'txn_01abc',
      clientToken: 'test_abc',
      env: 'sandbox',
      url: 'https://gabortardos.github.io/deutschmeister/?_ptxn=txn_01abc',
    })
  })

  it('accepts a response with only a url (redirect fallback) or only a transaction', () => {
    expect(parseCheckoutResponse({ url: 'https://example.com/pay?_ptxn=txn_1' })).toEqual({
      transactionId: null,
      clientToken: null,
      env: 'sandbox',
      url: 'https://example.com/pay?_ptxn=txn_1',
    })
    expect(parseCheckoutResponse({ transactionId: 'txn_2', env: 'live' })).toEqual({
      transactionId: 'txn_2',
      clientToken: null,
      env: 'live',
      url: null,
    })
  })

  it('rejects responses without transaction id or url, and non-objects', () => {
    expect(parseCheckoutResponse(null)).toBeNull()
    expect(parseCheckoutResponse('txn_1')).toBeNull()
    expect(parseCheckoutResponse({})).toBeNull()
    expect(parseCheckoutResponse({ transactionId: '', url: '' })).toBeNull()
    expect(parseCheckoutResponse({ clientToken: 'test_x', env: 'sandbox' })).toBeNull()
  })

  it('extracts the _ptxn checkout parameter from a search string', () => {
    expect(ptxnFromSearch('?_ptxn=txn_01h0j589qt1nee24210teqtz57')).toBe('txn_01h0j589qt1nee24210teqtz57')
    expect(ptxnFromSearch('?a=1&_ptxn=txn_abc&b=2')).toBe('txn_abc')
  })

  it('ignores missing or non-transaction _ptxn values', () => {
    expect(ptxnFromSearch('')).toBeNull()
    expect(ptxnFromSearch('?other=1')).toBeNull()
    expect(ptxnFromSearch('?_ptxn=not-a-txn')).toBeNull()
    expect(ptxnFromSearch('?_ptxn=')).toBeNull()
  })

  it('isOwnSiteUrl: only our own origin (or relative URLs) count as internal (v2.4.2)', () => {
    const origin = 'https://gabortardos.github.io'
    // Paddle Billing payment link → our own homepage with _ptxn: dead end, NOT a checkout page
    expect(isOwnSiteUrl('https://gabortardos.github.io/deutschmeister/?_ptxn=txn_1', origin)).toBe(true)
    expect(isOwnSiteUrl('/deutschmeister/?_ptxn=txn_1', origin)).toBe(true)
    // A genuine external hosted page → redirecting there is fine
    expect(isOwnSiteUrl('https://sandbox.paddle.com/checkout?x=1', origin)).toBe(false)
    expect(isOwnSiteUrl('https://pay.paddle.com/txn_1', origin)).toBe(false)
    expect(isOwnSiteUrl('mailto:support@example.com', origin)).toBe(false)
    // Path-only strings resolve against our own origin → internal (safe default:
    // never "fall back" to a redirect for something that isn't a real page)
    expect(isOwnSiteUrl('deutschmeister/?_ptxn=txn_1', origin)).toBe(true)
  })
})