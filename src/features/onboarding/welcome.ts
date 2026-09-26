import type { CefrLevel } from '../../db/types'

/**
 * M9.5 first-visit welcome flow — completion flag + pure validation.
 * The flag lives in localStorage (not Dexie) on purpose: it marks "this browser
 * has seen the tour", so a fresh browser on an existing synced account still
 * gets the tour exactly once. "Replay welcome tour" (Settings → Getting started)
 * clears it and navigates to /welcome.
 */

const WELCOME_STORAGE_KEY = 'dm-welcome-done'

/** True once this browser finished the welcome flow. localStorage errors → false. */
export function welcomeDone(): boolean {
  try {
    return localStorage.getItem(WELCOME_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markWelcomeDone(): void {
  try {
    localStorage.setItem(WELCOME_STORAGE_KEY, '1')
  } catch {
    // Private-mode quirks — worst case the tour shows again next visit.
  }
}

export function resetWelcome(): void {
  try {
    localStorage.removeItem(WELCOME_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Levels offered in the tour. Content exists A1–B2; C1/C2 arrive with M11's
 * vocab expansion, so the tour deliberately shows only what the app can teach.
 */
export const WELCOME_LEVELS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2']

export const WELCOME_GOALS: readonly number[] = [5, 10, 15, 20]

export interface BasicsDraft {
  name: string
  level: CefrLevel
  dailyWordGoal: number
}

/** Returns an error message for the Basics step, or null when valid (unit-tested). */
export function validateBasics(d: BasicsDraft): string | null {
  if (!d.name.trim()) return 'Please enter a name — a nickname works fine.'
  if (d.name.trim().length > 40) return 'Keep the name under 40 characters.'
  if (!WELCOME_LEVELS.includes(d.level)) return 'Pick your rough level.'
  if (!WELCOME_GOALS.includes(d.dailyWordGoal)) return 'Pick a daily word goal.'
  return null
}

export function normalizeName(raw: string): string {
  return raw.trim().slice(0, 40)
}
