import type { CefrLevel } from '../db/types'

/**
 * Adaptive placement quiz: a "staircase" over CEFR levels.
 * Pure module — no React, no browser APIs.
 *
 * Rules (bank is sampled A1 → B2 to match the seeded content):
 *  - start at A1; after 5 answers at a level with ≥ 4 correct, move up a level;
 *  - stop failing a level after 5 answers with ≤ 2 correct;
 *  - stop gathering evidence after 7 answers at one level;
 *  - never ask more than 20 items; never re-ask an item.
 */

export interface PlacementQuestion {
  id: string
  kind: 'vocab' | 'grammar'
  cefr: CefrLevel
  prompt: string
  options: readonly string[]
  answer: string
  /** Set on vocab items: the seed-corpus German word to mark as known. */
  germanWord: string | null
}

export interface PlacementAnswer {
  id: string
  cefr: CefrLevel
  correct: boolean
}

export const PLACEMENT_LEVELS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2']

export const PROMOTE_AFTER = 5
export const PROMOTE_CORRECT = 4
export const FAIL_AFTER = 5
export const FAIL_CORRECT = 2
export const EVIDENCE_LIMIT = 7
export const HARD_CAP = 20

function countsAt(history: readonly PlacementAnswer[], cefr: CefrLevel): { asked: number; correct: number } {
  let asked = 0
  let correct = 0
  for (const a of history) {
    if (a.cefr === cefr) {
      asked += 1
      if (a.correct) correct += 1
    }
  }
  return { asked, correct }
}

/** The level the staircase has currently reached, derived from the history. */
export function currentLevel(history: readonly PlacementAnswer[]): CefrLevel {
  let level = PLACEMENT_LEVELS[0]
  for (let i = 0; i < PLACEMENT_LEVELS.length - 1; i += 1) {
    const at = countsAt(history, PLACEMENT_LEVELS[i])
    if (at.asked >= PROMOTE_AFTER && at.correct >= PROMOTE_CORRECT) {
      level = PLACEMENT_LEVELS[i + 1]
    } else {
      break
    }
  }
  return level
}

/**
 * Next question for the adaptive flow, or null when the quiz should stop.
 * Prefers items at the current level, alternating vocab/grammar when possible.
 */
export function nextPlacementQuestion(
  bank: readonly PlacementQuestion[],
  history: readonly PlacementAnswer[],
): PlacementQuestion | null {
  if (history.length >= HARD_CAP) return null
  const level = currentLevel(history)
  const { asked, correct } = countsAt(history, level)
  if (asked >= EVIDENCE_LIMIT) return null
  if (asked >= FAIL_AFTER && correct <= FAIL_CORRECT) return null

  const used = new Set(history.map((a) => a.id))
  const remaining = bank.filter((q) => q.cefr === level && !used.has(q.id))
  if (remaining.length === 0) return null

  let lastQuestion: PlacementQuestion | undefined
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const q = bank.find((b) => b.id === history[i].id)
    if (q !== undefined) {
      lastQuestion = q
      break
    }
  }
  const alternate = lastQuestion ? remaining.find((q) => q.kind !== lastQuestion.kind) : undefined
  return alternate ?? remaining[0] ?? null
}

export interface PlacementAssessment {
  assessedLevel: CefrLevel
  correctByLevel: Record<string, number>
  askedByLevel: Record<string, number>
}

/**
 * A level counts as passed with ≥ 60 % correct over at least 2 answers.
 * The assessed level is the highest passed level (the staircase guarantees
 * lower levels were passed on the way up); default A1.
 */
export function assessPlacement(history: readonly PlacementAnswer[]): PlacementAssessment {
  const correctByLevel: Record<string, number> = {}
  const askedByLevel: Record<string, number> = {}
  let assessed: CefrLevel = 'A1'
  for (const level of PLACEMENT_LEVELS) {
    const { asked, correct } = countsAt(history, level)
    askedByLevel[level] = asked
    correctByLevel[level] = correct
    if (asked >= 2 && correct >= Math.ceil(asked * 0.6)) assessed = level
  }
  return { assessedLevel: assessed, correctByLevel, askedByLevel }
}
