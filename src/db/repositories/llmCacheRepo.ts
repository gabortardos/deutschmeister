import { db } from '../dexie'
import type { LlmCachePort } from '../../llm/services'

/**
 * Persistent LLM generation cache (LlmCache table). The port object is handed
 * to the LLM services so they stay decoupled from Dexie.
 */

export async function cacheGet(key: string): Promise<unknown | null> {
  const row = await db.llmCache.get(key)
  return row ? row.payload : null
}

export async function cachePut(key: string, payload: unknown): Promise<void> {
  await db.llmCache.put({ key, payload, createdAt: Date.now() })
}

export async function cacheCount(): Promise<number> {
  return db.llmCache.count()
}

export async function clearLlmCache(): Promise<void> {
  await db.llmCache.clear()
}

export const llmCachePort: LlmCachePort = { get: cacheGet, put: cachePut }
