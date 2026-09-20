import type { ZodType } from 'zod'
import { extractJsonObject } from '../utils/json'

export interface LlmConfig {
  baseUrl: string
  apiKey: string
  model: string
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

async function rawChat(config: LlmConfig, messages: ChatMessage[], opts?: ChatOptions): Promise<string> {
  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: opts?.maxTokens ?? 1024,
      temperature: opts?.temperature ?? 0.7,
    }),
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
 * retries on invalid output. Retries default to 2.
 */
export async function chatJSON<T>(
  config: LlmConfig,
  messages: ChatMessage[],
  schema?: ZodType<T>,
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
    return { ok: false, ms: ms(), model: config.model, baseUrl: config.baseUrl, error }
  }
}
