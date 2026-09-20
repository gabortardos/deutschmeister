import { db } from '../dexie'
import type { AppSettings } from '../types'
import { getProvider, PROVIDERS } from '../../llm/providers'
import { getApiKey, setApiKey } from '../../llm/keyStore'

const SETTINGS_ID = 'app' as const

function defaultSettings(): AppSettings {
  const provider = getProvider('glm')
  return {
    id: SETTINGS_ID,
    updatedAt: Date.now(),
    provider: provider.id,
    baseUrl: provider.baseUrl,
    model: provider.defaultModel,
    ttsVoice: null,
    ttsRate: 0.9,
    sttEnabled: true,
  }
}

function normalize(row: AppSettings): AppSettings {
  const providerValid = PROVIDERS.some((p) => p.id === row.provider)
  return { ...row, provider: providerValid ? row.provider : 'glm' }
}

export async function getSettings(): Promise<AppSettings> {
  const raw = await db.settings.get(SETTINGS_ID)
  if (!raw) {
    const settings = defaultSettings()
    await db.settings.put(settings)
    return settings
  }

  const row = raw as AppSettings & { apiKey?: unknown }
  let needsWrite = false

  // M0 → M0.1 migration: the API key now lives ONLY in localStorage.
  if (typeof row.apiKey === 'string' && row.apiKey.length > 0) {
    if (!getApiKey()) setApiKey(row.apiKey)
    delete row.apiKey
    needsWrite = true
  }

  // Refresh stale GLM defaults written before the live verification. These exact
  // values were only ever written by our own M0 defaults ("glm-4-flash" is retired
  // on every endpoint — error 1211; the pay-as-you-go URLs reject Coding Plan keys
  // with error 1113, which looks like an auth failure), so refreshing them cannot
  // override deliberate user input. Runs even when a key is set: that is exactly
  // the "user pasted a key and the test fails" case it must heal.
  if (row.provider === 'glm') {
    const defaults = getProvider('glm')
    if (row.model === 'glm-4-flash') {
      row.model = defaults.defaultModel
      needsWrite = true
    }
    if (
      row.baseUrl === 'https://api.z.ai/api/paas/v4' ||
      row.baseUrl === 'https://open.bigmodel.cn/api/paas/v4'
    ) {
      row.baseUrl = defaults.baseUrl
      needsWrite = true
    }
  }

  const settings = normalize(row)
  if (needsWrite) {
    await db.settings.put({ ...settings, updatedAt: Date.now() })
  }
  return settings
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings()
  const next: AppSettings = {
    ...current,
    ...patch,
    id: SETTINGS_ID, // never allow id changes
    updatedAt: Date.now(),
  }
  await db.settings.put(next)
  return next
}
