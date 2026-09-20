/**
 * Per-topic mastery from drill attempt history.
 * Pure module — no React, no browser APIs.
 */

export const MASTERY_WINDOW = 8
export const MASTERY_MIN_ATTEMPTS = 6
export const MASTERY_RATIO = 0.75

export interface MasteryInfo {
  attempts: number
  correct: number
  /** Correct answers among the most recent `window` attempts. */
  recentCorrect: number
  window: number
  /** recentCorrect / min(attempts, window), 0 when no attempts. */
  ratio: number
  mastered: boolean
}

/**
 * A topic counts as mastered once the learner has made at least
 * `MASTERY_MIN_ATTEMPTS` attempts and answered ≥ 75 % of the last
 * `MASTERY_WINDOW` attempts correctly. Early failures age out of the window,
 * so one bad first round does not block mastery forever.
 */
export function computeMastery(
  results: readonly boolean[],
  window: number = MASTERY_WINDOW,
): MasteryInfo {
  const attempts = results.length
  const correct = results.filter(Boolean).length
  const recent = results.slice(-window)
  const recentCorrect = recent.filter(Boolean).length
  const k = Math.min(attempts, window)
  const ratio = k === 0 ? 0 : recentCorrect / k
  const mastered = attempts >= MASTERY_MIN_ATTEMPTS && ratio >= MASTERY_RATIO
  return { attempts, correct, recentCorrect, window, ratio, mastered }
}

/** 0–100 integer for progress bars. */
export function masteryPercent(info: MasteryInfo): number {
  return Math.round(info.ratio * 100)
}
