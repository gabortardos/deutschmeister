import type { ZodType, ZodTypeDef } from 'zod'
import { extractJsonObject } from '../utils/json'
import { getProvider, type ProviderId } from './providers'

export interface LlmConfig {
  baseUrl: string
  apiKey: string
  model: string
  /** Provider-specific extra request-body fields (e.g. GLM thinking mode off). */
  extraBody?: Record<string, unknown>
}

/** Builds the adapter config from stored settings; the key comes from localStorage. */
export function llmConfigFromSettings(
  settings: { provider: ProviderId; baseUrl: string; model: string },
  apiKey: string,
): LlmConfig {
  const info = getProvider(settings.provider)
  return {
    baseUrl: settings.baseUrl,
    apiKey,
    model: settings.model,
    ...(info.extraBody ? { extraBody: info.extraBody } : {}),
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmLogEntry {
  at: number
  ok: boolean
  model: string
  baseUrl: string
  ms: number
  error?: string
}

export const LLM_LOG_KEY = 'dm-llm-log'
const LOG_LIMIT = 10

function logCall(entry: LlmLogEntry): void {
  try {
    const raw = localStorage.getItem(LLM_LOG_KEY)
    const list: LlmLogEntry[] = raw ? (JSON.parse(raw) as LlmLogEntry[]) : []
    list.unshift(entry)
    localStorage.setItem(LLM_LOG_KEY, JSON.stringify(list.slice(0, LOG_LIMIT)))
  } catch {
    // logging must never break the app
  }
}

export function getLlmLog(): LlmLogEntry[] {
  try {
    const raw = localStorage.getItem(LLM_LOG_KEY)
    return raw ? (JSON.parse(raw) as LlmLogEntry[]) : []
  } catch {
    return []
  }
}

export function clearLlmLog(): void {
  try {
    localStorage.removeItem(LLM_LOG_KEY)
  } catch {
    // ignore
  }
}

interface ChatOptions {
  maxTokens?: number
  temperature?: number
}

/**
 * OpenAI reasoning models (gpt-5 and later, o1/o3/o4 series) only support the default
 * temperature and bill thinking against the completion budget, so they must not receive
 * `temperature` and need `max_completion_tokens` instead of `max_tokens`.
 */
export function isOpenAiReasoningModel(model: string): boolean {
  return /^(gpt-[5-9]|o[134])/i.test(model.trim())
}

/**
 * Pure request-body builder (unit-tested): maps ChatOptions to provider-correct fields.
 * Classic chat models get `max_tokens` + `temperature`; reasoning models get
 * `max_completion_tokens` with headroom for thinking and no `temperature`.
 */
export function buildRequestBody(
  config: LlmConfig,
  messages: ChatMessage[],
  opts?: ChatOptions,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    ...(config.extraBody ?? {}),
  }
  if (isOpenAiReasoningModel(config.model)) {
    body.max_completion_tokens = Math.max(opts?.maxTokens ?? 1024, 2048)
  } else {
    body.max_tokens = opts?.maxTokens ?? 1024
    body.temperature = opts?.temperature ?? 0.7
  }
  return body
}

async function rawChat(config: LlmConfig, messages: ChatMessage[], opts?: ChatOptions): Promise<string> {
  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(buildRequestBody(config, messages, opts)),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('Unexpected response shape from provider')
  return content
}

/** Plain text completion with call logging. */
export async function chatText(
  config: LlmConfig,
  messages: ChatMessage[],
  opts?: ChatOptions,
): Promise<string> {
  const started = performance.now()
  try {
    const text = await rawChat(config, messages, opts)
    logCall({
      at: Date.now(),
      ok: true,
      model: config.model,
      baseUrl: config.baseUrl,
      ms: Math.round(performance.now() - started),
    })
    return text
  } catch (e) {
    logCall({
      at: Date.now(),
      ok: false,
      model: config.model,
      baseUrl: config.baseUrl,
      ms: Math.round(performance.now() - started),
      error: e instanceof Error ? e.message : String(e),
    })
    throw e
  }
}

/**
 * JSON completion: asks the model for JSON, defensively parses, validates with zod,
 * retries on invalid output (default 2 retries). Calls are logged for Diagnostics.
 */
export async function chatJSON<T>(
  config: LlmConfig,
  messages: ChatMessage[],
  schema?: ZodType<T, ZodTypeDef, unknown>,
  opts?: ChatOptions & { retries?: number },
): Promise<T> {
  const started = performance.now()
  const log = (ok: boolean, error?: string): void => {
    logCall({
      at: Date.now(),
      ok,
      model: config.model,
      baseUrl: config.baseUrl,
      ms: Math.round(performance.now() - started),
      ...(error !== undefined ? { error } : {}),
    })
  }
  try {
    const value = await chatJSONInner(config, messages, schema, opts)
    log(true)
    return value
  } catch (e) {
    log(false, e instanceof Error ? e.message : String(e))
    throw e
  }
}

async function chatJSONInner<T>(
  config: LlmConfig,
  messages: ChatMessage[],
  schema?: ZodType<T, ZodTypeDef, unknown>,
  opts?: ChatOptions & { retries?: number },
): Promise<T> {
  const retries = opts?.retries ?? 2
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const text = await rawChat(config, messages, opts)
      const parsed = extractJsonObject(text)
      if (parsed === null) throw new Error('Model did not return parseable JSON')
      if (schema) {
        const result = schema.safeParse(parsed)
        if (!result.success) {
          throw new Error(`Schema validation failed: ${result.error.issues[0]?.message ?? 'unknown issue'}`)
        }
        return result.data
      }
      return parsed as T
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
    }
  }
  throw lastError ?? new Error('chatJSON failed')
}

export interface TestResult {
  ok: boolean
  ms: number
  model: string
  baseUrl: string
  reply?: string
  error?: string
  /** Plain-English next step decoded from the raw provider error. */
  hint?: string
}

/**
 * Maps raw provider errors to a human-readable next step. Zhipu error codes:
 * 401/403 key rejected by that endpoint · 1113 key OK but no balance for it ·
 * 1211 model ID unknown/retired on that endpoint. Pure function (unit-tested).
 */
export function hintForLlmError(error: string): string | undefined {
  if (/\b(401|403)\b/.test(error)) {
    return 'This endpoint rejected the key. Zhipu keys are platform-specific: Coding Plan keys only work on the /api/coding/ endpoint, pay-as-you-go keys on /api/paas/v4 (api.z.ai or open.bigmodel.cn). Try another endpoint — Settings can probe them for you.'
  }
  if (error.includes('1113')) {
    return 'The key was accepted, but this endpoint requires a paid balance or resource package. GLM Coding Plan (Lite) keys work on the /api/coding/ endpoint.'
  }
  if (error.includes('1211')) {
    return 'This model ID is not available on the endpoint (e.g. "glm-4-flash" is retired). Use a current model such as "glm-4.6".'
  }
  if (/failed to fetch|networkerror|load failed|cors/i.test(error)) {
    return 'The browser could not reach the endpoint. If this is api.z.ai (GLM Coding Plan or pay-as-you-go), it blocks browser apps entirely — no CORS headers (verified 2026-09-20) — so z.ai keys cannot be used from this app. GLM works here only via https://open.bigmodel.cn/api/paas/v4 with a bigmodel.cn API key; OpenAI and DeepSeek are browser-compatible too.'
  }
  return undefined
}

/** Minimal real request used by the Settings "Test connection" button. */
export async function testConnection(config: LlmConfig): Promise<TestResult> {
  const started = performance.now()
  const ms = () => Math.round(performance.now() - started)
  try {
    const reply = await rawChat(
      config,
      [{ role: 'user', content: 'Reply with exactly: OK' }],
      { maxTokens: 8, temperature: 0 },
    )
    logCall({ at: Date.now(), ok: true, model: config.model, baseUrl: config.baseUrl, ms: ms() })
    return { ok: true, ms: ms(), model: config.model, baseUrl: config.baseUrl, reply: reply.trim().slice(0, 40) }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    logCall({ at: Date.now(), ok: false, model: config.model, baseUrl: config.baseUrl, ms: ms(), error })
    return { ok: false, ms: ms(), model: config.model, baseUrl: config.baseUrl, error, hint: hintForLlmError(error) }
  }
}
