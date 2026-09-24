/**
 * Client transport for the M8 platform-AI teaser: talks to the `ai-proxy`
 * Supabase Edge Function with the signed-in user's session token. The owner's
 * provider key NEVER reaches the browser — it lives as an Edge Function secret.
 *
 * Pure TS (no React). `fetch` is injectable for tests. The function returns the
 * provider's JSON verbatim plus metering headers:
 *   x-dm-credit-usd  remaining budget in micro-USD AFTER this call
 *   x-dm-cap-usd     total budget in micro-USD
 */
import { classifyPlatformFailure, type PlatformErrorKind } from './entitlement'

export interface PlatformAuth {
  /** Full function URL: https://<ref>.supabase.co/functions/v1/ai-proxy */
  endpoint: string
  /** Signed-in user's Supabase access token (proves the account; drives metering). */
  token: string
}

export interface UsageMeter {
  remainingUsdMicros: number
  capUsdMicros: number
}

/** Context the adapter attaches to an LlmConfig to route calls through the proxy. */
export interface PlatformCallContext {
  /** Coarse feature label for the usage log ('conversation' | 'explain' | …). */
  feature: string
  getAuth: () => PlatformAuth | null | Promise<PlatformAuth | null>
  onUsage?: (meter: UsageMeter) => void
}

export class PlatformAiError extends Error {
  readonly kind: PlatformErrorKind
  readonly hint?: string

  constructor(kind: PlatformErrorKind, message: string, hint?: string) {
    super(message)
    this.name = 'PlatformAiError'
    this.kind = kind
    this.hint = hint
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export interface ChatProxyInput {
  feature: string
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  maxTokens?: number
  temperature?: number
}

async function callProxy(
  type: string,
  payload: Record<string, unknown>,
  auth: PlatformAuth,
  fetchImpl?: FetchLike,
): Promise<Response> {
  const impl: FetchLike = fetchImpl ?? ((input, init) => fetch(input, init))
  let res: Response
  try {
    res = await impl(auth.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ type, ...payload }),
    })
  } catch {
    const f = classifyPlatformFailure(0, null)
    throw new PlatformAiError(f.kind, f.message)
  }
  if (!res.ok) {
    let code: string | null = null
    try {
      code = ((await res.clone().json()) as { error?: string }).error ?? null
    } catch {
      // non-JSON body — status alone decides
    }
    const f = classifyPlatformFailure(res.status, code)
    throw new PlatformAiError(f.kind, f.message, f.hint)
  }
  return res
}

function readMeter(res: Response, onUsage?: (m: UsageMeter) => void): void {
  const remaining = Number(res.headers.get('x-dm-credit-usd'))
  const cap = Number(res.headers.get('x-dm-cap-usd'))
  if (onUsage && Number.isFinite(remaining) && Number.isFinite(cap)) {
    onUsage({ remainingUsdMicros: remaining, capUsdMicros: cap })
  }
}

/** One chat turn through the proxy; returns the assistant text (rawChat contract). */
export async function platformChat(
  input: ChatProxyInput,
  auth: PlatformAuth,
  opts: { fetchImpl?: FetchLike; onUsage?: (m: UsageMeter) => void } = {},
): Promise<string> {
  const res = await callProxy('chat', { ...input }, auth, opts.fetchImpl)
  const data = (await res.json()) as {
    choices?: { message?: { content?: string }; finish_reason?: string }[]
  }
  readMeter(res, opts.onUsage)
  const choice = data.choices?.[0]
  const content = choice?.message?.content
  if (typeof content !== 'string') throw new Error('Unexpected response shape from the AI service')
  if (choice?.finish_reason === 'length') {
    throw new Error('Output truncated (finish_reason=length): the reply exceeded the token cap')
  }
  return content
}

/** One HD TTS synthesis through the proxy (same JSON shape as Google: { audioContent }). */
export async function platformTts(
  input: { text: string; voice: string; rate?: number },
  auth: PlatformAuth,
  opts: { fetchImpl?: FetchLike; onUsage?: (m: UsageMeter) => void } = {},
): Promise<{ audioContent: string }> {
  const res = await callProxy('tts', { ...input }, auth, opts.fetchImpl)
  const data = (await res.json()) as { audioContent?: string }
  readMeter(res, opts.onUsage)
  if (!data.audioContent) throw new Error('The AI voice service returned no audio.')
  return data as { audioContent: string }
}

export interface UsageSummary extends UsageMeter {
  spendUsdMicros: number
  plan: string
  /** Live pricing config (M8.1) — present once the deployed function publishes it. */
  model?: string
  prices?: Record<string, { in: number; out: number }>
}

/** Budget snapshot for the Settings meter. */
export async function platformUsageSummary(
  auth: PlatformAuth,
  opts: { fetchImpl?: FetchLike } = {},
): Promise<UsageSummary> {
  const res = await callProxy('usage', {}, auth, opts.fetchImpl)
  return (await res.json()) as UsageSummary
}
