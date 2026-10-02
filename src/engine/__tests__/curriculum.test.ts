import { describe, expect, it } from 'vitest'
import type { CefrLevel, GrammarTopic, Scenario, VocabWord } from '../../db/types'
import {
  PATH_LEVELS,
  UNIT_WORD_RATIO,
  buildCurriculum,
  computeProgress,
  curriculumStats,
  currentUnit,
  projectEta,
  toPathLevel,
  type ProgressContext,
} from '../curriculum'

/* Fixtures — minimal objects with only the fields the engine reads. */

function topic(id: string, cefr: CefrLevel, order: number, theme: string | null = null): GrammarTopic {
  return {
    id,
    updatedAt: 0,
    title: `Topic ${id}`,
    cefr,
    order,
    explanationMd: '',
    focus: '',
    relatedVocabTheme: theme,
  }
}

function word(id: string, cefr: CefrLevel, theme: string, rank: number): VocabWord {
  return {
    id,
    updatedAt: 0,
    german: id,
    article: null,
    plural: null,
    english: id,
    cefr,
    theme,
    frequencyRank: rank,
    exampleSentenceDe: null,
    exampleSentenceEn: null,
    custom: false,
  }
}

function scenario(id: string, cefr: CefrLevel): Scenario {
  return {
    id,
    updatedAt: 0,
    title: `Scenario ${id}`,
    cefr,
    emoji: '🙂',
    description: '',
    goal: '',
    keyPhrases: [],
    custom: false,
  }
}

/** 5 A1 topics (theme on the first of each pair), 2 A1 scenarios, 10 A1 words. */
function fixture() {
  const topics: GrammarTopic[] = [
    topic('g-a1-01', 'A1', 1, 'Food'),
    topic('g-a1-02', 'A1', 2, 'Food'),
    topic('g-a1-03', 'A1', 3, 'Travel'),
    topic('g-a1-04', 'A1', 4, null),
    topic('g-a1-05', 'A1', 5, 'Family'),
  ]
  const words: VocabWord[] = [
    ...Array.from({ length: 5 }, (_, i) => word('w-food-' + i, 'A1', 'Food', i + 1)),
    ...Array.from({ length: 5 }, (_, i) => word('w-travel-' + i, 'A1', 'Travel', i + 11)),
  ]
  const scenarios = [scenario('s-1', 'A1'), scenario('s-2', 'A1')]
  return { topics, words, scenarios }
}

function ctx(partial: Partial<ProgressContext> = {}): ProgressContext {
  return {
    introducedWordIds: new Set<string>(),
    masteredTopicIds: new Set<string>(),
    startLevel: 'A1',
    placedLevel: null,
    ...partial,
  }
}

describe('buildCurriculum', () => {
  it('pairs topics in syllabus order and ends every level with a milestone', () => {
    const { topics, words, scenarios } = fixture()
    const c = buildCurriculum(topics, words, scenarios)
    const a1 = c.units.filter((u) => u.level === 'A1')
    // 5 topics → units 1..3 (2+2+1), then the milestone at index 4.
    expect(a1.map((u) => u.id)).toEqual(['u-a1-1', 'u-a1-2', 'u-a1-3', 'u-a1-m'])
    expect(a1.map((u) => u.kind)).toEqual(['learning', 'learning', 'learning', 'milestone'])
    expect(a1[0]?.topicIds).toEqual(['g-a1-01', 'g-a1-02'])
    expect(a1[2]?.topicIds).toEqual(['g-a1-05']) // leftover single topic
    expect(a1[3]?.topicIds).toHaveLength(5) // milestone covers the whole level
  })

  it('scopes each unit to its theme cluster and cycles scenarios deterministically', () => {
    const { topics, words, scenarios } = fixture()
    const c = buildCurriculum(topics, words, scenarios)
    const u1 = c.units.find((u) => u.id === 'u-a1-1')
    const u2 = c.units.find((u) => u.id === 'u-a1-2')
    const u3 = c.units.find((u) => u.id === 'u-a1-3')
    expect(u1?.vocabTheme).toBe('Food')
    expect(u1?.wordIds).toHaveLength(5)
    expect(u2?.vocabTheme).toBe('Travel')
    expect(u2?.wordIds).toHaveLength(5)
    expect(u3?.wordIds).toEqual([]) // null theme → no cluster
    expect([u1?.scenarioId, u2?.scenarioId, u3?.scenarioId]).toEqual(['s-1', 's-2', 's-1'])
  })

  it('ignores C-level content and exposes per-level word/topic ids', () => {
    const { topics, words, scenarios } = fixture()
    const c = buildCurriculum(
      [...topics, topic('g-c1-01', 'C1', 99, 'Food')],
      [...words, word('w-c1', 'C1', 'Food', 999)],
      [...scenarios, scenario('s-c1', 'C1')],
    )
    expect(c.units.map((u) => u.level).every((l) => PATH_LEVELS.includes(l))).toBe(true)
    expect(c.levelWordIds.A1).toHaveLength(10)
    expect(c.levelTopicIds.A1).toHaveLength(5)
    expect(c.levelWordIds.B2).toEqual([])
  })

  it('is deterministic and append-stable in ids', () => {
    const { topics, words, scenarios } = fixture()
    const a = buildCurriculum(topics, words, scenarios)
    const b = buildCurriculum(topics, words, scenarios)
    expect(a).toEqual(b)
    const grown = buildCurriculum([...topics, topic('g-a1-06', 'A1', 6, 'Work')], words, scenarios)
    expect(grown.units.slice(0, 4).map((u) => u.id)).toEqual(a.units.slice(0, 4).map((u) => u.id))
  })
})

describe('toPathLevel', () => {
  it('clamps C-levels onto B2 and keeps A1–B2 as-is', () => {
    expect(toPathLevel('C1')).toBe('B2')
    expect(toPathLevel('C2')).toBe('B2')
    expect(PATH_LEVELS.map(toPathLevel)).toEqual(['A1', 'A2', 'B1', 'B2'])
  })
})

describe('computeProgress', () => {
  it('marks the first incomplete unit current and everything after it locked', () => {
    const { topics, words, scenarios } = fixture()
    const c = buildCurriculum(topics, words, scenarios)
    const p = computeProgress(c, ctx())
    const a1 = p.filter((u) => u.unit.level === 'A1').map((u) => u.status)
    expect(a1).toEqual(['current', 'locked', 'locked', 'locked'])
    expect(currentUnit(p)?.unit.id).toBe('u-a1-1')
  })

  it('treats levels below the placement start as done/placed-over', () => {
    const { topics, words, scenarios } = fixture()
    const c = buildCurriculum(topics, words, scenarios)
    const p = computeProgress(c, ctx({ startLevel: 'A2', placedLevel: 'A2' }))
    const a1 = p.filter((u) => u.unit.level === 'A1')
    expect(a1.every((u) => u.status === 'done' && u.placedOver)).toBe(true)
    // Milestone done via placedLevel — the level check was the placement itself.
    expect(a1[3]?.unit.kind).toBe('milestone')
  })

  it('completes a unit only with all topics mastered AND ≥80% of the cluster', () => {
    const { topics, words, scenarios } = fixture()
    const c = buildCurriculum(topics, words, scenarios)
    const both = new Set(['g-a1-01', 'g-a1-02'])
    // 3/5 words = 60 % → still the current unit.
    let p = computeProgress(c, ctx({ masteredTopicIds: both, introducedWordIds: new Set(['w-food-0', 'w-food-1', 'w-food-2']) }))
    expect(p[0]?.status).toBe('current')
    // 4/5 words = 80 % → unit 1 done, unit 2 current.
    p = computeProgress(c, ctx({ masteredTopicIds: both, introducedWordIds: new Set(['w-food-0', 'w-food-1', 'w-food-2', 'w-food-3']) }))
    expect(p[0]?.status).toBe('done')
    expect(p[0]?.placedOver).toBe(false)
    expect(p[1]?.status).toBe('current')
    expect(UNIT_WORD_RATIO).toBe(0.8)
  })

  it('passes a milestone offline when every topic of the level is mastered', () => {
    const { topics, words, scenarios } = fixture()
    const c = buildCurriculum(topics, words, scenarios)
    const all = new Set(c.levelTopicIds.A1)
    // Clusters count too: ≥80 % of each theme cluster introduced.
    const intro = new Set(['w-food-0', 'w-food-1', 'w-food-2', 'w-food-3', 'w-travel-0', 'w-travel-1', 'w-travel-2', 'w-travel-3'])
    const p = computeProgress(c, ctx({ masteredTopicIds: all, introducedWordIds: intro }))
    const a1 = p.filter((u) => u.unit.level === 'A1').map((u) => u.status)
    expect(a1).toEqual(['done', 'done', 'done', 'done'])
    // Everything below the (empty) upper bands is done → no current unit.
    expect(currentUnit(p)).toBeNull()
  })

  it('returns no current unit when the whole path is placed over', () => {
    const { topics, words, scenarios } = fixture()
    const c = buildCurriculum(topics, words, scenarios)
    const p = computeProgress(c, ctx({ startLevel: 'B2' }))
    expect(currentUnit(p)).toBeNull()
  })
})

describe('curriculumStats', () => {
  it('aggregates words/topics/units up to the target level', () => {
    const { topics, words, scenarios } = fixture()
    const c = buildCurriculum(topics, words, scenarios)
    const intro = new Set(['w-food-0', 'w-food-1'])
    const p = computeProgress(c, ctx({ introducedWordIds: intro }))
    const s = curriculumStats(c, p, 'A1', ctx({ introducedWordIds: intro }))
    expect(s.wordsTotal).toBe(10)
    expect(s.wordsIntroduced).toBe(2)
    expect(s.wordsLeft).toBe(8)
    expect(s.topicsTotal).toBe(5)
    expect(s.topicsLeft).toBe(5)
    expect(s.unitsTotal).toBe(4)
    expect(s.unitsDone).toBe(0)
  })
})

describe('projectEta', () => {
  it('projects word-driven ETAs at the daily goal', () => {
    const eta = projectEta({ wordsLeft: 100, topicsLeft: 5, dailyWordGoal: 10, from: new Date(2026, 9, 1) })
    expect(eta.days).toBe(10)
    expect(eta.driver).toBe('words')
    expect(eta.arriveBy.getTime()).toBe(new Date(2026, 9, 11).getTime())
  })

  it('projects topic-driven ETAs when topics outlast the words', () => {
    const eta = projectEta({ wordsLeft: 10, topicsLeft: 12, dailyWordGoal: 10, from: new Date(2026, 0, 1) })
    expect(eta.days).toBe(12)
    expect(eta.driver).toBe('topics')
  })

  it('is zero days when nothing is left', () => {
    const eta = projectEta({ wordsLeft: 0, topicsLeft: 0, dailyWordGoal: 5, from: new Date(2026, 5, 15) })
    expect(eta.days).toBe(0)
    expect(eta.arriveBy.getTime()).toBe(new Date(2026, 5, 15).getTime())
  })
})


