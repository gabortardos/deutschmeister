import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  buildRequestBody,
  chatJSON,
  hintForLlmError,
  isOpenAiReasoningModel,
  llmConfigFromSettings,
  RELAY_BASE_PREFIX,
  resolveRelayBaseUrl,
} from '../adapter'
import { getProvider, PROVIDERS } from '../providers'

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

describe('resolveRelayBaseUrl (M8.2 BYO relay)', () => {
  it('passes plain base URLs through unchanged', () => {
    expect(resolveRelayBaseUrl('https://api.deepseek.com', 'https://x.supabase.co/functions/v1')).toBe(
      'https://api.deepseek.com',
    )
  })

  it('expands relay sentinels under the Edge Function URL', () => {
    expect(resolveRelayBaseUrl('relay:zai-coding', 'https://x.supabase.co/functions/v1')).toBe(
      'https://x.supabase.co/functions/v1/ai-proxy/byo/zai-coding',
    )
  })

  it('keeps the sentinel when the build has no functions URL', () => {
    expect(resolveRelayBaseUrl('relay:zai-coding', null)).toBe('relay:zai-coding')
  })
})

describe('glm-zai provider (M8.2)', () => {
  it('is the first provider, relay-flagged, with sentinel base + alt route', () => {
    expect(PROVIDERS[0]?.id).toBe('glm-zai')
    const p = getProvider('glm-zai')
    expect(p.relay).toBe(true)
    expect(p.baseUrl.startsWith(RELAY_BASE_PREFIX)).toBe(true)
    expect(p.altBaseUrls).toEqual(['relay:zai-api'])
    expect(p.extraBody).toEqual({ thinking: { type: 'disabled' } })
    expect(p.defaultModel).toBe('glm-4.6')
  })

  it('llmConfigFromSettings marks relay configs and builds a classic GLM body', () => {
    const cfg = llmConfigFromSettings(
      { provider: 'glm-zai', baseUrl: 'relay:zai-coding', model: 'glm-4.6' },
      'a-zai-user-key',
    )
    expect(cfg.relay).toBe(true)
    const body = buildRequestBody(cfg, [{ role: 'user', content: 'hi' }], { maxTokens: 8, temperature: 0 })
    expect(body.max_tokens).toBe(8) // GLM wants max_tokens, never max_completion_tokens
    expect(body.thinking).toEqual({ type: 'disabled' })
  })
})

describe('provider model annotations (M8.3)', () => {
  it('bigmodel.cn marks the free-tier model and the balance-needed ones', () => {
    const p = getProvider('glm')
    expect(p.modelNotes?.['glm-4.5-flash']).toMatch(/free/i)
    for (const m of ['glm-4.6', 'glm-4.7', 'glm-5.3', 'glm-5.3-flash']) {
      expect(p.modelNotes?.[m]).toMatch(/balance/i)
    }
    // every suggested model that has a note must be in the suggestions list (no stale notes)
    for (const noted of Object.keys(p.modelNotes ?? {})) expect(p.modelSuggestions).toContain(noted)
  })

  it('z.ai provider notes its Coding-Plan models and the app has the 5 public legal pages', async () => {
    const p = getProvider('glm-zai')
    expect(p.modelNotes?.['glm-4.6']).toMatch(/Coding Plan/i)
    const legal = await import('../../features/legal/LegalPages')
    for (const fn of ['AboutPage', 'ContactPage', 'TermsPage', 'PrivacyPage', 'RefundPage']) {
      expect(typeof (legal as Record<string, unknown>)[fn]).toBe('function')
    }
    expect(legal.CONTACT_EMAIL).toBe('gabor@deutschmeister.gaborscreation.space')
  })
})