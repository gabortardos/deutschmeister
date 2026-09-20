import { describe, expect, it } from 'vitest'
import { buildRequestBody, hintForLlmError, isOpenAiReasoningModel } from '../adapter'

describe('isOpenAiReasoningModel', () => {
  it('matches the gpt-5 family and o-series', () => {
    expect(isOpenAiReasoningModel('gpt-5-mini')).toBe(true)
    expect(isOpenAiReasoningModel('gpt-5-nano')).toBe(true)
    expect(isOpenAiReasoningModel('gpt-5.6-luna')).toBe(true)
    expect(isOpenAiReasoningModel('o4-mini')).toBe(true)
  })

  it('does not match classic chat models', () => {
    expect(isOpenAiReasoningModel('gpt-4o-mini')).toBe(false)
    expect(isOpenAiReasoningModel('gpt-4.1-mini')).toBe(false)
    expect(isOpenAiReasoningModel('glm-4.5-flash')).toBe(false)
    expect(isOpenAiReasoningModel('deepseek-chat')).toBe(false)
  })
})

describe('buildRequestBody', () => {
  const msg = { role: 'user' as const, content: 'hi' }
  const cfg = (model: string) => ({ baseUrl: 'https://x.example/v1', apiKey: 'k', model })

  it('sends max_tokens + temperature for classic models', () => {
    const body = buildRequestBody(cfg('gpt-4o-mini'), [msg], { maxTokens: 8, temperature: 0 })
    expect(body.max_tokens).toBe(8)
    expect(body.temperature).toBe(0)
    expect(body.max_completion_tokens).toBeUndefined()
  })

  it('uses max_completion_tokens and omits temperature for gpt-5 family', () => {
    const body = buildRequestBody(cfg('gpt-5-nano'), [msg], { maxTokens: 8, temperature: 0 })
    expect(body.max_completion_tokens).toBeGreaterThanOrEqual(2048)
    expect(body.temperature).toBeUndefined()
    expect(body.max_tokens).toBeUndefined()
  })

  it('merges provider extraBody (GLM thinking off) with defaults', () => {
    const body = buildRequestBody(
      { ...cfg('glm-4.5-flash'), extraBody: { thinking: { type: 'disabled' } } },
      [msg],
    )
    expect(body).toMatchObject({
      model: 'glm-4.5-flash',
      max_tokens: 1024,
      temperature: 0.7,
      thinking: { type: 'disabled' },
    })
  })
})

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