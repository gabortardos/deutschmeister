import type { LessonCheckpoint } from '../content/grammar/lessons/types'

/**
 * M14 lesson checkpoint grading — pure, offline, deterministic.
 * The UI keeps answers as a plain Record so the engine stays trivially testable.
 */

export interface CheckpointOutcome {
  correct: boolean
  explanation: string
}

/** Grades one picked option; `null` = nothing picked yet (never correct). */
export function gradeCheckpoint(cp: LessonCheckpoint, chosenIndex: number | null): CheckpointOutcome {
  if (chosenIndex === null) return { correct: false, explanation: 'Pick an answer first.' }
  return { correct: chosenIndex === cp.answer, explanation: cp.explain }
}

export interface LessonProgress {
  total: number
  answered: number
  correct: number
  solvedAll: boolean
}

/** Aggregates the learner's picks over a lesson's checkpoints. */
export function lessonProgress(
  checkpoints: readonly LessonCheckpoint[],
  answers: Record<string, number>,
): LessonProgress {
  const total = checkpoints.length
  let answered = 0
  let correct = 0
  for (const cp of checkpoints) {
    const chosen = answers[cp.id]
    if (chosen === undefined) continue
    answered += 1
    if (chosen === cp.answer) correct += 1
  }
  return { total, answered, correct, solvedAll: total > 0 && correct === total }
}
