import { create } from 'zustand'
import { getProfile, updateProfile } from '../db/repositories/profileRepo'
import { getSettings, updateSettings } from '../db/repositories/settingsRepo'
import type { AppSettings, UserProfile } from '../db/types'

interface AppStore {
  hydrated: boolean
  profile: UserProfile | null
  settings: AppSettings | null
  hydrate: () => Promise<void>
  patchProfile: (patch: Partial<UserProfile>) => Promise<void>
  patchSettings: (patch: Partial<AppSettings>) => Promise<void>
}

export const useAppStore = create<AppStore>((set) => ({
  hydrated: false,
  profile: null,
  settings: null,
  hydrate: async () => {
    const [profile, settings] = await Promise.all([getProfile(), getSettings()])
    set({ profile, settings, hydrated: true })
  },
  patchProfile: async (patch) => {
    const profile = await updateProfile(patch)
    set({ profile })
  },
  patchSettings: async (patch) => {
    const settings = await updateSettings(patch)
    set({ settings })
  },
}))
