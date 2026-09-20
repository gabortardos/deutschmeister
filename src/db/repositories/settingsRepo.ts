import { db } from '../dexie'
import type { AppSettings } from '../types'
import { getProvider } from '../../llm/providers'

const SETTINGS_ID = 'app' as const

function defaultSettings(): AppSettings {
  const provider = getProvider('glm')
  return {
    id: SETTINGS_ID,
    updatedAt: Date.now(),
    provider: provider.id,
    baseUrl: provider.baseUrl,
    apiKey: '',
    model: provider.defaultModel,
    ttsVoice: null,
    ttsRate: 0.9,
    sttEnabled: true,
  }
}

export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(SETTINGS_ID)
  if (existing) return existing
  const settings = defaultSettings()
  await db.settings.put(settings)
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
