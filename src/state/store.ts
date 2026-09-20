import { create } from 'zustand'
import { getProfile, updateProfile } from '../db/repositories/profileRepo'
import { getSettings, updateSettings } from '../db/repositories/settingsRepo'
import type { AppSettings, UserProfile } from '../db/types'
import { getApiKey, setApiKey } from '../llm/keyStore'

interface AppStore {
  hydrated: boolean
  profile: UserProfile | null
  settings: AppSettings | null
  /** Kept in localStorage only (see src/llm/keyStore.ts) — never in IndexedDB. */
  apiKey: string
  hydrate: () => Promise<void>
  patchProfile: (patch: Partial<UserProfile>) => Promise<void>
  patchSettings: (patch: Partial<AppSettings>) => Promise<void>
  patchApiKey: (key: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  hydrated: false,
  profile: null,
  settings: null,
  apiKey: '',
  hydrate: async () => {
    const [profile, settings] = await Promise.all([getProfile(), getSettings()])
    set({ profile, settings, apiKey: getApiKey(), hydrated: true })
  },
  patchProfile: async (patch) => {
    const profile = await updateProfile(patch)
    set({ profile })
  },
  patchSettings: async (patch) => {
    const settings = await updateSettings(patch)
    set({ settings })
  },
  patchApiKey: (key) => {
    setApiKey(key)
    set({ apiKey: key })
  },
}))
