import { describe, expect, it } from 'vitest'
import { PLACEMENT_BANK } from '../../content/grammar/placement'
import {
  assessPlacement,
  currentLevel,
  HARD_CAP,
  nextPlacementQuestion,
  type PlacementAnswer,
  type PlacementQuestion,
} from '../placement'

function miniBank(): PlacementQuestion[] {
  const mk = (id: string, cefr: 'A1' | 'A2' | 'B1', kind: 'vocab' | 'grammar'): PlacementQuestion => ({
    id,
    kind,
    cefr,
    prompt: `P-${id}`,
    options: ['a', 'b', 'c', 'd'],
    answer: 'a',
    germanWord: null,
  })
  return [
    mk('a1-v', 'A1', 'vocab'),
    mk('a1-g', 'A1', 'grammar'),
    mk('a2-v', 'A2', 'vocab'),
    mk('a2-g', 'A2', 'grammar'),
    mk('b1-v', 'B1', 'vocab'),
    mk('b1-g', 'B1', 'grammar'),
  ]
}

describe('nextPlacementQuestion', () => {
  it('starts with an A1 item and never repeats items', () => {
    const bank = miniBank()
    const q1 = nextPlacementQuestion(bank, [])
    if (q1 === null) throw new Error('first question missing')
    expect(q1.cefr).toBe('A1')
    const history: PlacementAnswer[] = [{ id: q1.id, cefr: 'A1', correct: true }]
    const q2 = nextPlacementQuestion(bank, history)
    expect(q2?.id).not.toBe(q1.id)
    expect(q2?.cefr).toBe('A1')
    // prefers alternating kind when possible
    expect(q2?.kind).not.toBe(q1.kind)
  })

  it('stops when the current level is exhausted (mini bank)', () => {
    const bank = miniBank()
    const history: PlacementAnswer[] = [
      { id: 'a1-v', cefr: 'A1', correct: true },
      { id: 'a1-g', cefr: 'A1', correct: true },
    ]
    expect(nextPlacementQuestion(bank, history)).toBeNull()
  })

  it('respects the hard cap of 20 items', () => {
    const big: PlacementAnswer[] = Array.from({ length: HARD_CAP }, (_, i) => ({
      id: `x-${i}`,
      cefr: 'A1',
      correct: true,
    }))
    expect(nextPlacementQuestion(PLACEMENT_BANK, big)).toBeNull()
  })

  it('walks the staircase: A1 → A2 → B1 on a strong run and stops at 17 items', () => {
    const history: PlacementAnswer[] = []
    for (let guard = 0; guard < 30; guard += 1) {
      const q = nextPlacementQuestion(PLACEMENT_BANK, history)
      if (q === null) break
      history.push({ id: q.id, cefr: q.cefr, correct: true })
    }
    // 5 at A1 (promote) + 5 at A2 (promote) + 7 at B1 (last level → evidence-stop)
    expect(history.length).toBe(17)
    expect(currentLevel(history)).toBe('B1')
    expect(assessPlacement(history).assessedLevel).toBe('B1')
  })

  it('stops early on a failing run and stays at A1', () => {
    const history: PlacementAnswer[] = []
    for (let guard = 0; guard < 30; guard += 1) {
      const q = nextPlacementQuestion(PLACEMENT_BANK, history)
      if (q === null) break
      history.push({ id: q.id, cefr: q.cefr, correct: false })
    }
    expect(history.length).toBe(5) // fail-stop after 5 wrong at A1
    expect(assessPlacement(history).assessedLevel).toBe('A1')
  })

  it('lands on A1 when the learner passes A1 but fails A2', () => {
    const history: PlacementAnswer[] = []
    let askedAtA1 = 0
    for (let guard = 0; guard < 30; guard += 1) {
      const q = nextPlacementQuestion(PLACEMENT_BANK, history)
      if (q === null) break
      const correct = q.cefr === 'A1' ? ++askedAtA1 <= 4 : false
      history.push({ id: q.id, cefr: q.cefr, correct })
    }
    // 5 at A1 (4 correct → promote) then 5 wrong at A2 → fail-stop = 10 items
    expect(history.length).toBe(10)
    const assessment = assessPlacement(history)
    expect(assessment.assessedLevel).toBe('A1')
    expect(assessment.correctByLevel.A1).toBe(4)
    expect(assessment.askedByLevel.A2).toBe(5)
  })
})

describe('assessPlacement', () => {
  it('counts per level and defaults to A1 with an empty history', () => {
    const assessment = assessPlacement([])
    expect(assessment.assessedLevel).toBe('A1')
    expect(assessment.askedByLevel).toEqual({ A1: 0, A2: 0, B1: 0 })
    expect(assessment.correctByLevel).toEqual({ A1: 0, A2: 0, B1: 0 })
  })

  it('requires ≥60% at a level to pass it', () => {
    // A1: 4/5 (pass) · A2: 3/5 (pass) · B1: 2/5 (fail)
    const history: PlacementAnswer[] = [
      ...Array.from({ length: 4 }, (_, i) => ({ id: `a1-${i}`, cefr: 'A1' as const, correct: true })),
      { id: 'a1-x', cefr: 'A1', correct: false },
      ...Array.from({ length: 3 }, (_, i) => ({ id: `a2-${i}`, cefr: 'A2' as const, correct: true })),
      ...Array.from({ length: 2 }, (_, i) => ({ id: `a2-x${i}`, cefr: 'A2' as const, correct: false })),
      ...Array.from({ length: 2 }, (_, i) => ({ id: `b1-${i}`, cefr: 'B1' as const, correct: true })),
      ...Array.from({ length: 3 }, (_, i) => ({ id: `b1-x${i}`, cefr: 'B1' as const, correct: false })),
    ]
    expect(assessPlacement(history).assessedLevel).toBe('A2')
  })
})
