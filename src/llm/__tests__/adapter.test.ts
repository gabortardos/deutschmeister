import { describe, expect, it, vi, afterEach } from 'vitest'
import { buildRequestBody, chatJSON, hintForLlmError, isOpenAiReasoningModel } from '../adapter'

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
    expect(body.reasoning_effort).toBeUndefined()
  })

  it('uses max_completion_tokens, low reasoning effort and no temperature for gpt-5 family', () => {
    const body = buildRequestBody(cfg('gpt-5-nano'), [msg], { maxTokens: 8, temperature: 0 })
    expect(body.max_completion_tokens).toBeGreaterThanOrEqual(2048)
    expect(body.reasoning_effort).toBe('low')
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

describe('chatJSON robustness', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const cfg = (model: string) => ({ baseUrl: 'https://x.example/v1', apiKey: 'k', model })
  const msgs = [{ role: 'user' as const, content: 'hi' }]
  const res = (payload: unknown): Response =>
    ({ ok: true, json: async () => payload, text: async () => '' }) as unknown as Response
  const completion = (content: string, finish_reason = 'stop') => ({
    choices: [{ message: { content }, finish_reason }],
  })

  it('throws a clear error when the provider truncates the reply (finish_reason=length)', async () => {
    const fetchMock = vi.fn(async () => res(completion('{"reply": "abc', 'length')))
    vi.stubGlobal('fetch', fetchMock)
    await expect(chatJSON(cfg('gpt-4o-mini'), msgs)).rejects.toThrow(/truncated/i)
    expect(fetchMock).toHaveBeenCalledTimes(3) // retried, still truncated
  })

  it('recovers on retry by telling the model what was invalid', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(completion('Sorry, I would rather chat freely.'))) // no JSON at all
      .mockResolvedValueOnce(res(completion('{"reply": "Hallo"}')))
    vi.stubGlobal('fetch', fetchMock)
    const out = await chatJSON<{ reply: string }>(cfg('gpt-4o-mini'), msgs)
    expect(out).toEqual({ reply: 'Hallo' })
    const secondBody = JSON.parse((fetchMock.mock.calls[1]?.[1] as { body: string }).body) as {
      messages: { role: string; content: string }[]
    }
    const corrective = secondBody.messages.find((m) => m.content.includes('ONLY raw JSON'))
    expect(corrective?.role).toBe('user')
    expect(secondBody.messages[secondBody.messages.length - 2]?.role).toBe('assistant') // the bad reply is shown
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