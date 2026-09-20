import { describe, expect, it } from 'vitest'
import { hintForLlmError } from '../adapter'

describe('hintForLlmError', () => {
  it('flags endpoint auth rejections (401/403)', () => {
    const hint = hintForLlmError('HTTP 401: {"error":{"code":"1002","message":"invalid token"}}')
    expect(hint).toMatch(/platform-specific/i)
  })

  it('flags balance errors (Zhipu 1113) even when HTTP status is 429', () => {
    const hint = hintForLlmError('HTTP 429: {"error":{"code":"1113","message":"Insufficient balance"}}')
    expect(hint).toMatch(/balance/i)
  })

  it('flags retired/unknown models (Zhipu 1211)', () => {
    const hint = hintForLlmError('HTTP 400: {"error":{"code":"1211","message":"Unknown Model"}}')
    expect(hint).toMatch(/glm-4\.6/)
  })

  it('flags network/CORS fetch failures', () => {
    expect(hintForLlmError('TypeError: Failed to fetch')).toMatch(/reach the endpoint/i)
  })

  it('returns undefined for unrecognized errors', () => {
    expect(hintForLlmError('HTTP 500: internal error')).toBeUndefined()
  })
})