import { create } from 'zustand'
import { getProfile, updateProfile } from '../db/repositories/profileRepo'
import { getSettings, updateSettings } from '../db/repositories/settingsRepo'
import { getOrCreateTodayLog, recordDrill } from '../db/repositories/lessonRepo'
import { dueCards, vocabStats, type VocabStats } from '../db/repositories/vocabRepo'
import type { AppSettings, LessonLog, UserProfile } from '../db/types'
import { getApiKey, setApiKey } from '../llm/keyStore'

interface AppStore {
  hydrated: boolean
  profile: UserProfile | null
  settings: AppSettings | null
  /** Kept in localStorage only (see src/llm/keyStore.ts) — never in IndexedDB. */
  apiKey: string
  todayLog: LessonLog | null
  dueCount: number
  stats: VocabStats | null
  hydrate: () => Promise<void>
  patchProfile: (patch: Partial<UserProfile>) => Promise<void>
  patchSettings: (patch: Partial<AppSettings>) => Promise<void>
  patchApiKey: (key: string) => void
  refreshToday: () => Promise<void>
  bumpDrills: () => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
  hydrated: false,
  profile: null,
  settings: null,
  apiKey: '',
  todayLog: null,
  dueCount: 0,
  stats: null,
  hydrate: async () => {
    const [profile, settings] = await Promise.all([getProfile(), getSettings()])
    set({ profile, settings, apiKey: getApiKey(), hydrated: true })
    await get().refreshToday()
  },
  patchProfile: async (patch) => {
    const profile = await updateProfile(patch)
    set({ profile })
    if (patch.dailyWordGoal !== undefined || patch.currentGrammarTopicId !== undefined) {
      await get().refreshToday()
    }
  },
  patchSettings: async (patch) => {
    const settings = await updateSettings(patch)
    set({ settings })
  },
  patchApiKey: (key) => {
    setApiKey(key)
    set({ apiKey: key })
    // M9.6 Supporter gate: stamp the BYO trial clock the first time a key is
    // saved (idempotent — later key changes never restart it). Fire-and-forget:
    // the gate graces an unstamped value as "trial" until this write lands.
    const s = get().settings
    if (key.trim() && s && s.byoKeyFirstSeenAt == null) {
      void updateSettings({ byoKeyFirstSeenAt: Date.now() }).then((settings) => {
        set({ settings })
      })
    }
  },
  refreshToday: async () => {
    const { profile } = get()
    if (!profile) return
    const [todayLog, due, stats] = await Promise.all([getOrCreateTodayLog(profile), dueCards(), vocabStats()])
    set({ todayLog, dueCount: due.length, stats })
  },
  bumpDrills: async () => {
    const { todayLog } = get()
    if (!todayLog) return
    const next = await recordDrill(todayLog.id)
    set({ todayLog: next })
  },
}))

