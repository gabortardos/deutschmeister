/**
 * The M8 entitlement seam: ONE hook replaces the per-feature
 * `settings && apiKey ? llmConfigFromSettings(settings, apiKey) : null` builders.
 *
 *   BYO key set        → the user's provider/model, exactly as before (free, unmetered).
 *   No key, signed in  → platform teaser: model fixed server-side (TEASER_MODEL),
 *                        every call metered by the ai-proxy Edge Function.
 *   Neither            → null deps: features show their "needs AI" hint.
 */
import { useMemo } from 'react'
import { useAppStore } from './store'
import { useAuthStore } from '../sync/authStore'
import { llmConfigFromSettings, type LlmConfig } from '../llm/adapter'
import { resolveAiRoute, TEASER_MODEL, type AiRoute } from '../llm/entitlement'
import type { LlmServiceDeps } from '../llm/services'
import { llmCachePort } from '../db/repositories/llmCacheRepo'
import { currentPlatformAuth, usePlatformStore } from './platformStore'

/** Route only (no config construction) — for UI gating like the conversation list. */
export function useAiRoute(): AiRoute {
  const apiKey = useAppStore((s) => s.apiKey)
  const user = useAuthStore((s) => s.user)
  return resolveAiRoute({ hasByoKey: apiKey.trim().length > 0, signedIn: user !== null })
}

export interface AiDeps {
  deps: LlmServiceDeps | null
  route: AiRoute
}

export function useLlmDeps(feature: string, opts: { cache?: boolean } = {}): AiDeps {
  const settings = useAppStore((s) => s.settings)
  const apiKey = useAppStore((s) => s.apiKey)
  const user = useAuthStore((s) => s.user)
  const applyUsage = usePlatformStore((s) => s.applyUsage)
  const useCache = opts.cache !== false
  const route = resolveAiRoute({ hasByoKey: apiKey.trim().length > 0, signedIn: user !== null })

  return useMemo(() => {
    if (route === 'none' || !settings) return { deps: null, route }
    if (route === 'byo') {
      const config = llmConfigFromSettings(settings, apiKey)
      return { deps: { config, ...(useCache ? { cache: llmCachePort } : {}) }, route }
    }
    const config: LlmConfig = {
      // baseUrl/apiKey are unused on the platform path (kept schema-valid + log-friendly)
      baseUrl: 'platform://ai-proxy',
      apiKey: 'platform',
      model: TEASER_MODEL,
      platform: { feature, getAuth: currentPlatformAuth, onUsage: applyUsage },
    }
    return { deps: { config, ...(useCache ? { cache: llmCachePort } : {}) }, route }
  }, [settings, apiKey, route, feature, applyUsage, useCache])
}
