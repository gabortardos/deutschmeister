import { describe, expect, it } from 'vitest'
import type { CefrLevel, DrillType } from '../../db/types'
import {
  accuracyByCefr,
  accuracyByType,
  computeInsights,
  mistakeTypeCounts,
  mistakeTypeLabel,
  vocabCoverage,
} from '../insights'

function attempt(itemId: string, correct: boolean, at = 0) {
  return { itemId, correct, at }
}

function item(id: string, type: DrillType, cefr: CefrLevel) {
  return { id, type, cefr }
}

describe('accuracyByType', () => {
  it('groups, rounds to integer %, worst first (ties → most attempts)', () => {
    const items = [
      item('c1', 'cloze', 'A1'),
      item('c2', 'cloze', 'A1'),
      item('s1', 'speak', 'A1'),
      item('l1', 'listen', 'A1'),
    ]
    const rows = accuracyByType(
      [attempt('c1', true), attempt('c2', false), attempt('s1', false), attempt('l1', true)],
      items,
    )
    expect(rows).toEqual([
      { key: 'speak', label: 'Speaking', attempts: 1, correct: 0, accuracy: 0 },
      { key: 'cloze', label: 'Cloze', attempts: 2, correct: 1, accuracy: 50 },
      { key: 'listen', label: 'Listening', attempts: 1, correct: 1, accuracy: 100 },
    ])
  })

  it('skips orphaned attempts (deleted drill items)', () => {
    expect(accuracyByType([attempt('gone', true)], [])).toEqual([])
  })
})

describe('accuracyByCefr', () => {
  it('returns attempted levels in A1→C2 order regardless of data order', () => {
    const items = [item('b', 'cloze', 'B1'), item('a', 'cloze', 'A1')]
    const rows = accuracyByCefr([attempt('b', true), attempt('a', false)], items)
    expect(rows.map((r) => r.key)).toEqual(['A1', 'B1'])
    expect(rows[0]).toMatchObject({ attempts: 1, correct: 0, accuracy: 0 })
    expect(rows[1]).toMatchObject({ attempts: 1, correct: 1, accuracy: 100 })
  })
})

describe('vocabCoverage', () => {
  it('counts introduced words per level, skips empty levels, keeps CEFR order', () => {
    const words = [
      { id: 'w1', cefr: 'A1' as const },
      { id: 'w2', cefr: 'A1' as const },
      { id: 'w3', cefr: 'A2' as const },
      { id: 'w4', cefr: 'B1' as const },
    ]
    expect(vocabCoverage([{ wordId: 'w1' }, { wordId: 'w3' }], words)).toEqual([
      { cefr: 'A1', introduced: 1, total: 2 },
      { cefr: 'A2', introduced: 1, total: 1 },
      { cefr: 'B1', introduced: 0, total: 1 },
    ])
  })
})

describe('mistakeTypeCounts', () => {
  it('flattens turn mistakes, sorts by count desc then key, capitalizes labels', () => {
    const turns = [
      { mistakes: [{ type: 'gender' }, { type: 'case' }] },
      { mistakes: [{ type: 'gender' }] },
      { mistakes: null },
    ]
    expect(mistakeTypeCounts(turns)).toEqual([
      { key: 'gender', label: 'Gender', count: 2 },
      { key: 'case', label: 'Case', count: 1 },
    ])
    expect(mistakeTypeLabel('')).toBe('Other')
  })
})

describe('computeInsights', () => {
  it('totals count all attempts (orphans included), corrections sum turn mistakes', () => {
    const insights = computeInsights({
      attempts: [attempt('c1', true), attempt('gone', false)],
      items: [item('c1', 'cloze', 'A1')],
      cards: [{ wordId: 'w1' }],
      words: [{ id: 'w1', cefr: 'A1' }, { id: 'w2', cefr: 'A1' }],
      turns: [{ mistakes: [{ type: 'gender' }] }],
      conversations: 3,
    })
    expect(insights.totals).toEqual({
      drills: 2,
      drillCorrect: 1,
      drillAccuracy: 50,
      conversations: 3,
      corrections: 1,
    })
    expect(insights.accuracyByType).toHaveLength(1) // orphan skipped here
    expect(insights.vocabCoverage).toEqual([{ cefr: 'A1', introduced: 1, total: 2 }])
    expect(insights.mistakeTypes[0]).toMatchObject({ key: 'gender', count: 1 })
  })

  it('handles the fresh-start case (no data anywhere)', () => {
    const insights = computeInsights({ attempts: [], items: [], cards: [], words: [], turns: [], conversations: 0 })
    expect(insights.totals.drillAccuracy).toBe(0)
    expect(insights.accuracyByType).toEqual([])
    expect(insights.accuracyByCefr).toEqual([])
    expect(insights.vocabCoverage).toEqual([])
    expect(insights.mistakeTypes).toEqual([])
  })
})
