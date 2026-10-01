import { describe, expect, it } from 'vitest'
import type { LessonCheckpoint } from '../../content/grammar/lessons/types'
import { gradeCheckpoint, lessonProgress } from '../lessons'

function cp(over: Partial<LessonCheckpoint> = {}): LessonCheckpoint {
  return { id: 'cp-1', question: 'q?', options: ['a', 'b', 'c'], answer: 1, explain: 'because', ...over }
}

describe('gradeCheckpoint', () => {
  it('grades the picked option against the answer index', () => {
    const item = cp()
    expect(gradeCheckpoint(item, 1).correct).toBe(true)
    expect(gradeCheckpoint(item, 0).correct).toBe(false)
    expect(gradeCheckpoint(item, 2).correct).toBe(false)
  })

  it('returns the teaching explanation with every graded pick', () => {
    expect(gradeCheckpoint(cp(), 1).explanation).toBe('because')
    expect(gradeCheckpoint(cp(), 0).explanation).toBe('because')
  })

  it('treats a missing pick (null) as not-correct with a hint', () => {
    const outcome = gradeCheckpoint(cp(), null)
    expect(outcome.correct).toBe(false)
    expect(outcome.explanation).toBe('Pick an answer first.')
  })
})

describe('lessonProgress', () => {
  const checkpoints = [cp({ id: 'cp-1' }), cp({ id: 'cp-2', answer: 0 }), cp({ id: 'cp-3', answer: 2 })]

  it('counts nothing answered initially', () => {
    expect(lessonProgress(checkpoints, {})).toEqual({ total: 3, answered: 0, correct: 0, solvedAll: false })
  })

  it('counts partial progress (wrong answers count as answered, not correct)', () => {
    const p = lessonProgress(checkpoints, { 'cp-1': 1, 'cp-2': 1 })
    expect(p.answered).toBe(2)
    expect(p.correct).toBe(1)
    expect(p.solvedAll).toBe(false)
  })

  it('solvedAll only when every checkpoint is correct', () => {
    expect(lessonProgress(checkpoints, { 'cp-1': 1, 'cp-2': 0, 'cp-3': 2 }).solvedAll).toBe(true)
    expect(lessonProgress(checkpoints, { 'cp-1': 1, 'cp-2': 0, 'cp-3': 0 }).solvedAll).toBe(false)
  })

  it('ignores answers for unknown ids and handles empty checkpoints', () => {
    expect(lessonProgress([], { 'cp-x': 1 })).toEqual({ total: 0, answered: 0, correct: 0, solvedAll: false })
    const p = lessonProgress(checkpoints, { 'cp-9': 1, 'cp-1': 1 })
    expect(p.answered).toBe(1)
  })
})
