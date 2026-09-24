/**
 * Platform-AI metering state (M8): what the signed-in keyless user has left of
 * their teaser/credit budget, refreshed from `ai-proxy` and live-updated from
 * the metering headers of every metered call. No React — zustand like authStore.
 */
import { create } from 'zustand'
import { platformUsageSummary, type PlatformAuth, type UsageMeter } from '../llm/platform'
import {
  PLATFORM_PRICES_USD_PER_M,
  TEASER_CAP_USD_MICROS,
  TEASER_MODEL,
  type PlatformPrices,
} from '../llm/entitlement'
import { getSupabase, supabaseFunctionsUrl } from '../sync/supabaseClient'

/** Session-token auth for ai-proxy; null when signed out or the build lacks env. */
export async function currentPlatformAuth(): Promise<PlatformAuth | null> {
  const base = supabaseFunctionsUrl()
  const sb = getSupabase()
  if (!base || !sb) return null
  const { data } = await sb.auth.getSession()
  const token = data.session?.access_token
  return token ? { endpoint: `${base}/ai-proxy`, token } : null
}

interface PlatformState {
  loading: boolean
  spendUsdMicros: number
  capUsdMicros: number
  plan: string
  /** Live pricing config adopted from the usage response (M8.1); bundled fallbacks
   *  in src/llm/entitlement.ts serve offline sessions / older function deploys. */
  model: string
  prices: PlatformPrices
  fetchedAt: number | null
  exhausted: boolean
  error: string | null
  refresh: () => Promise<void>
  /** Cheap live update from the response headers after each metered call. */
  applyUsage: (meter: UsageMeter) => void
}

export const usePlatformStore = create<PlatformState>((set, get) => ({
  loading: false,
  spendUsdMicros: 0,
  capUsdMicros: TEASER_CAP_USD_MICROS,
  plan: 'free',
  model: TEASER_MODEL,
  prices: PLATFORM_PRICES_USD_PER_M,
  fetchedAt: null,
  exhausted: false,
  error: null,
  refresh: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      const auth = await currentPlatformAuth()
      if (!auth) {
        // Signed out / no env: keep defaults, nothing to show.
        set({ loading: false, fetchedAt: null, error: null })
        return
      }
      const s = await platformUsageSummary(auth)
      set({
        loading: false,
        spendUsdMicros: s.spendUsdMicros,
        capUsdMicros: s.capUsdMicros,
        plan: s.plan,
        // Adopt the server-published pricing config when present (M8.1); a legacy
        // response simply keeps the previous/fallback values.
        ...(s.model ? { model: s.model } : {}),
        ...(s.prices ? { prices: s.prices } : {}),
        exhausted: s.remainingUsdMicros <= 0,
        fetchedAt: Date.now(),
        error: null,
      })
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) })
    }
  },
  applyUsage: (meter) => {
    const spend = Math.max(0, meter.capUsdMicros - meter.remainingUsdMicros)
    set({
      capUsdMicros: meter.capUsdMicros,
      spendUsdMicros: spend,
      exhausted: meter.remainingUsdMicros <= 0,
      fetchedAt: Date.now(),
    })
  },
}))
