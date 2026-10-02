import type { CefrLevel, GoalMotivation } from '../../db/types'

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
 * Levels offered in the tour. Vocab now reaches C1 (M12.3) and grammar A1–C2,
 * but the tour deliberately stays A1–B2: C1 vocab is only three batches old and
 * C2 vocab is empty — revisit once C-level coverage is broad enough to teach
 * end to end.
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

/* ------------------------------------------------------------------ */
/* M15 goal interview (welcome step + roadmap inline editor).           */
/* ------------------------------------------------------------------ */

export const GOAL_MOTIVATIONS: readonly { id: GoalMotivation; label: string; emoji: string }[] = [
  { id: 'work', label: 'Work or study', emoji: '💼' },
  { id: 'life', label: 'Life in Germany', emoji: '🏡' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'exam', label: 'An exam (Goethe, TELC…)', emoji: '📝' },
  { id: 'culture', label: 'Culture & fun', emoji: '🎭' },
]

export const HORIZON_OPTIONS: readonly number[] = [12, 26, 52, 104]

export const MINUTES_OPTIONS: readonly number[] = [5, 10, 15, 30, 45]

export interface GoalDraft {
  motivation: GoalMotivation | null
  targetLevel: CefrLevel
  horizonWeeks: number
  minutesPerDay: number
}

/** Returns an error message for the goal step, or null when valid (unit-tested). */
export function validateGoal(d: GoalDraft): string | null {
  if (d.motivation === null || !GOAL_MOTIVATIONS.some((m) => m.id === d.motivation)) {
    return 'Pick what German is for.'
  }
  if (!WELCOME_LEVELS.includes(d.targetLevel)) return 'Pick a target level.'
  if (!HORIZON_OPTIONS.includes(d.horizonWeeks)) return 'Pick a time horizon.'
  if (!MINUTES_OPTIONS.includes(d.minutesPerDay)) return 'Pick your daily minutes.'
  return null
}
