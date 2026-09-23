import { describe, expect, it, vi } from 'vitest'
import { PlatformAiError, platformChat, platformTts, platformUsageSummary } from '../platform'

const auth = { endpoint: 'https://demo.supabase.co/functions/v1/ai-proxy', token: 'tok' }

function res(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers })
}

describe('platformChat', () => {
  it('returns the assistant text and reports the metering headers', async () => {
    const onUsage = vi.fn()
    const fetchImpl = vi.fn(async () =>
      res(
        200,
        { choices: [{ message: { content: 'Hallo!' } }] },
        { 'x-dm-credit-usd': '950000', 'x-dm-cap-usd': '1000000' },
      ),
    )
    const text = await platformChat(
      { feature: 'conversation', messages: [{ role: 'user', content: 'Guten Tag' }] },
      auth,
      { fetchImpl, onUsage },
    )
    expect(text).toBe('Hallo!')
    expect(onUsage).toHaveBeenCalledWith({ remainingUsdMicros: 950000, capUsdMicros: 1000000 })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(auth.endpoint)
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer tok')
    expect(JSON.parse(String(init.body)).type).toBe('chat')
  })

  it('throws PlatformAiError kind=exhausted on 402', async () => {
    await expect(
      platformChat({ feature: 'x', messages: [] }, auth, {
        fetchImpl: async () => res(402, { error: 'exhausted' }),
      }),
    ).rejects.toMatchObject({ kind: 'exhausted' })
  })

  it('throws PlatformAiError on 429', async () => {
    await expect(
      platformChat({ feature: 'x', messages: [] }, auth, {
        fetchImpl: async () => res(429, { error: 'rate-limited' }),
      }),
    ).rejects.toBeInstanceOf(PlatformAiError)
  })

  it('surfaces finish_reason=length exactly like the direct adapter', async () => {
    await expect(
      platformChat({ feature: 'x', messages: [] }, auth, {
        fetchImpl: async () =>
          res(200, { choices: [{ message: { content: 'x' }, finish_reason: 'length' }] }),
      }),
    ).rejects.toThrow(/truncated/)
  })

  it('network failures become kind=network with friendly copy', async () => {
    await expect(
      platformChat({ feature: 'x', messages: [] }, auth, {
        fetchImpl: async () => {
          throw new TypeError('Failed to fetch')
        },
      }),
    ).rejects.toMatchObject({ kind: 'network' })
  })
})

describe('platformTts', () => {
  it('passes Google-shaped audioContent through', async () => {
    const r = await platformTts({ text: 'Hallo', voice: 'de-DE-Neural2-A', rate: 0.9 }, auth, {
      fetchImpl: async () => res(200, { audioContent: 'SGkh' }),
    })
    expect(r.audioContent).toBe('SGkh')
  })

  it('missing audio is an explicit error', async () => {
    await expect(
      platformTts({ text: 'Hallo', voice: 'v', rate: 1 }, auth, {
        fetchImpl: async () => res(200, {}),
      }),
    ).rejects.toThrow(/no audio/)
  })
})

describe('platformUsageSummary', () => {
  it('returns the budget snapshot for the Settings meter', async () => {
    const s = await platformUsageSummary(auth, {
      fetchImpl: async () =>
        res(200, { spendUsdMicros: 50000, capUsdMicros: 1000000, remainingUsdMicros: 950000, plan: 'free' }),
    })
    expect(s.remainingUsdMicros).toBe(950000)
    expect(s.plan).toBe('free')
  })
})
