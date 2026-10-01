import { describe, expect, it } from 'vitest'
import type { VocabWord } from '../../db/types'
import { buildLessonPlan } from '../lessonPlanner'

function word(id: string, rank: number, theme: string): VocabWord {
  return {
    id,
    updatedAt: 0,
    german: id,
    article: null,
    plural: null,
    english: id,
    cefr: 'A1',
    theme,
    frequencyRank: rank,
    exampleSentenceDe: null,
    exampleSentenceEn: null,
    custom: false,
  }
}

const words = [
  word('w1', 10, 'Food'),
  word('w2', 2, 'Travel'),
  word('w3', 30, 'Food'),
  word('w4', 1, 'Travel'),
  word('w5', 20, 'Time'),
]

describe('buildLessonPlan', () => {
  it('returns dailyWordGoal unseen words ordered by frequencyRank', () => {
    const plan = buildLessonPlan({ dailyWordGoal: 3, words, introducedWordIds: new Set() })
    expect(plan.wordIds).toEqual(['w4', 'w2', 'w1'])
  })

  it('excludes already-introduced words', () => {
    const plan = buildLessonPlan({ dailyWordGoal: 3, words, introducedWordIds: new Set(['w4', 'w2']) })
    expect(plan.wordIds).toEqual(['w1', 'w5', 'w3'])
  })

  it('biases toward the grammar topic theme while keeping rank order inside groups', () => {
    const plan = buildLessonPlan({
      dailyWordGoal: 3,
      words,
      introducedWordIds: new Set(),
      themeBias: 'Food',
    })
    expect(plan.wordIds).toEqual(['w1', 'w3', 'w4'])
  })

  it('returns fewer words when the bank is exhausted', () => {
    const plan = buildLessonPlan({ dailyWordGoal: 10, words, introducedWordIds: new Set(['w1', 'w2']) })
    expect(plan.wordIds).toEqual(['w4', 'w5', 'w3'])
  })

  it('is deterministic for the same input (idempotency base)', () => {
    const a = buildLessonPlan({ dailyWordGoal: 2, words, introducedWordIds: new Set() })
    const b = buildLessonPlan({ dailyWordGoal: 2, words, introducedWordIds: new Set() })
    expect(a).toEqual(b)
  })

  it('clamps the goal into 1..10 and defaults date to today', () => {
    const plan = buildLessonPlan({ dailyWordGoal: 99, words, introducedWordIds: new Set() })
    expect(plan.wordIds.length).toBe(5) // limited by bank, goal clamped to 10
    expect(plan.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('M12.9: a scope restricts the fresh pool (both dimensions AND)', () => {
    const scoped = [
      ...words,
      { ...word('b1a', 3, 'Food'), cefr: 'B1' as const },
      { ...word('b1b', 4, 'Law'), cefr: 'B1' as const },
      { ...word('a1x', 5, 'Food'), cefr: 'A1' as const },
    ]
    const plan = buildLessonPlan({
      dailyWordGoal: 10,
      words: scoped,
      introducedWordIds: new Set(),
      scope: { levels: ['B1'], themes: ['Food'] },
    })
    expect(plan.wordIds).toEqual(['b1a'])
  })

  it('M12.9: custom words survive an excluding scope', () => {
    const scoped = [
      ...words,
      { ...word('mine', 999, 'Custom'), custom: true },
    ]
    const plan = buildLessonPlan({
      dailyWordGoal: 10,
      words: scoped,
      introducedWordIds: new Set(),
      scope: { levels: ['C1'], themes: ['Science'] },
    })
    expect(plan.wordIds).toEqual(['mine'])
  })

  it('M12.9: theme bias still orders inside a scoped pool', () => {
    const scoped = [
      ...words,
      { ...word('b1travel', 6, 'Travel'), cefr: 'B1' as const },
    ]
    const plan = buildLessonPlan({
      dailyWordGoal: 10,
      words: scoped,
      introducedWordIds: new Set(),
      themeBias: 'Travel',
      scope: { levels: ['B1'], themes: [] },
    })
    expect(plan.wordIds).toEqual(['b1travel'])
  })
})
