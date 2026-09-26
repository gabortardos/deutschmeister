/**
 * The M8 entitlement seam: ONE hook replaces the per-feature
 * `settings && apiKey ? llmConfigFromSettings(settings, apiKey) : null` builders.
 *
 *   BYO key set        → the user's provider/model (unmetered — M9.6: after the
 *                        30-day trial this needs the Supporter membership; a
 *                        locked key falls through to the platform/guest path).
 *   No key, signed in  → platform teaser: model fixed server-side (TEASER_MODEL),
 *                        every call metered by the ai-proxy Edge Function.
 *   Neither            → null deps: features show their "needs AI" hint.
 */
import { useMemo } from 'react'
import { useAppStore } from './store'
import { useAuthStore } from '../sync/authStore'
import { llmConfigFromSettings, type LlmConfig } from '../llm/adapter'
import {
  byoAccess,
  byoTrialDaysLeft,
  resolveAiRoute,
  type AiRoute,
  type ByoAccess,
} from '../llm/entitlement'
import type { LlmServiceDeps } from '../llm/services'
import { llmCachePort } from '../db/repositories/llmCacheRepo'
import { currentPlatformAuth, usePlatformStore } from './platformStore'

/** Route only (no config construction) — for UI gating like the conversation list. */
export function useAiRoute(): AiRoute {
  const apiKey = useAppStore((s) => s.apiKey)
  const user = useAuthStore((s) => s.user)
  const { state } = useByoGate()
  return resolveAiRoute({
    hasByoKey: apiKey.trim().length > 0,
    signedIn: user !== null,
    byoAllowed: state !== 'locked',
  })
}

/**
 * M9.6 Supporter gate, shared by the routing hooks and the Settings UI.
 * Membership comes from the Paddle-written entitlement row (plan 'byo-supporter'
 * with a live period, published by the usage response / refresh — a null
 * valid_until only happens on manual owner grants and counts as member). The
 * trial clock is stamped into settings when the first key is saved. Pure
 * derivation — all logic lives in entitlement.ts.
 */
export function useByoGate(): { state: ByoAccess; daysLeft: number } {
  const apiKey = useAppStore((s) => s.apiKey)
  const trialStart = useAppStore((s) => s.settings?.byoKeyFirstSeenAt ?? null)
  const plan = usePlatformStore((s) => s.plan)
  const validUntil = usePlatformStore((s) => s.validUntil)
  const member =
    plan === 'byo-supporter' && (validUntil == null || Date.parse(validUntil) > Date.now())
  return {
    state: byoAccess({ hasKey: apiKey.trim().length > 0, member, trialStartMs: trialStart }),
    daysLeft: byoTrialDaysLeft(trialStart),
  }
}

export interface AiDeps {
  deps: LlmServiceDeps | null
  route: AiRoute
}

export function useLlmDeps(feature: string, opts: { cache?: boolean } = {}): AiDeps {
  const settings = useAppStore((s) => s.settings)
  const apiKey = useAppStore((s) => s.apiKey)
  const applyUsage = usePlatformStore((s) => s.applyUsage)
  const platformModel = usePlatformStore((s) => s.model)
  const useCache = opts.cache !== false
  const route = useAiRoute()

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
      // Server-published model (store), bundled fallback until first usage refresh.
      model: platformModel,
      platform: { feature, getAuth: currentPlatformAuth, onUsage: applyUsage },
    }
    return { deps: { config, ...(useCache ? { cache: llmCachePort } : {}) }, route }
  }, [settings, apiKey, route, feature, applyUsage, platformModel, useCache])
}
