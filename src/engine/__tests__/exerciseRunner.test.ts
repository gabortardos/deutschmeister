import { describe, expect, it } from 'vitest'
import type { DrillItem } from '../../db/types'
import {
  drillHint,
  drillInstruction,
  drillOptions,
  drillTokens,
  gradeDrill,
  hashSeed,
  needsGermanKeys,
  seededShuffle,
} from '../exerciseRunner'

function item(partial: Partial<DrillItem> & Pick<DrillItem, 'id' | 'type' | 'acceptedAnswers'>): DrillItem {
  return {
    ownerId: 'g-test',
    prompt: 'test',
    promptData: null,
    cefr: 'A1',
    source: 'seed',
    validated: true,
    updatedAt: 0,
    ...partial,
  }
}

describe('seededShuffle', () => {
  it('is deterministic for the same seed and preserves elements', () => {
    const base = ['a', 'b', 'c', 'd', 'e', 'f']
    expect(seededShuffle(base, 's1')).toEqual(seededShuffle(base, 's1'))
    expect(seededShuffle(base, 's1')).not.toEqual(seededShuffle(base, 's2'))
    for (const run of [seededShuffle(base, 's1'), seededShuffle(base, 's2')]) {
      expect([...run].sort()).toEqual([...base].sort())
    }
  })

  it('hashSeed is stable and positive', () => {
    expect(hashSeed('d-g-a1-01-1')).toBe(hashSeed('d-g-a1-01-1'))
    expect(hashSeed('x')).not.toBe(hashSeed('y'))
    expect(Number.isInteger(hashSeed('abc'))).toBe(true)
  })
})

describe('drillOptions / drillTokens', () => {
  it('returns options in a deterministic order containing the answer', () => {
    const drill = item({
      id: 'd-1',
      type: 'choice',
      acceptedAnswers: ['bin'],
      promptData: { options: ['bin', 'ist', 'sind', 'haben'] },
    })
    const first = drillOptions(drill)
    const second = drillOptions(drill)
    expect(first).toEqual(second)
    expect(first).toContain('bin')
    expect(first).toHaveLength(4)
  })

  it('tolerates missing promptData', () => {
    expect(drillOptions(item({ id: 'd-2', type: 'choice', acceptedAnswers: ['x'] }))).toEqual([])
    expect(drillTokens(item({ id: 'd-3', type: 'wordorder', acceptedAnswers: ['x'] }))).toEqual([])
    expect(drillHint(item({ id: 'd-4', type: 'cloze', acceptedAnswers: ['x'] }))).toBeNull()
  })

  it('scrambles wordorder tokens without ever solving the sentence', () => {
    const drill = item({
      id: 'd-5',
      type: 'wordorder',
      acceptedAnswers: ['Heute gehe ich ins Kino'],
      promptData: { tokens: ['Heute', 'gehe', 'ich', 'ins', 'Kino'] },
    })
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const tokens = drillTokens({ ...drill, id })
      expect(tokens).toHaveLength(5)
      expect(tokens.join(' ')).not.toBe('Heute gehe ich ins Kino')
    }
  })

  it('reads hint and instruction from promptData', () => {
    const drill = item({ id: 'd-6', type: 'cloze', acceptedAnswers: ['einen'], promptData: { hint: 'maskulin, Akkusativ' } })
    expect(drillHint(drill)).toBe('maskulin, Akkusativ')
    expect(drillInstruction(drill)).toBeNull()
    const t = item({ id: 'd-7', type: 'transform', acceptedAnswers: ['Ich war müde'], promptData: { instruction: 'Make it Präteritum.' } })
    expect(drillInstruction(t)).toBe('Make it Präteritum.')
  })
})

describe('needsGermanKeys', () => {
  it('is true for German-answer drills, false for English translation', () => {
    expect(needsGermanKeys('cloze')).toBe(true)
    expect(needsGermanKeys('transform')).toBe(true)
    expect(needsGermanKeys('wordorder')).toBe(true)
    expect(needsGermanKeys('translate_en_de')).toBe(true)
    expect(needsGermanKeys('translate_de_en')).toBe(false)
    expect(needsGermanKeys('choice')).toBe(false)
  })
})

describe('gradeDrill', () => {
  it('grades choice by exact option match against acceptedAnswers[0]', () => {
    const drill = item({ id: 'd-8', type: 'choice', acceptedAnswers: ['bin'], promptData: { options: ['bin', 'ist'] } })
    expect(gradeDrill(drill, 'bin').correct).toBe(true)
    expect(gradeDrill(drill, 'ist').correct).toBe(false)
    expect(gradeDrill(drill, 'Bin').correct).toBe(true) // normalized
  })

  it('grades cloze with umlaut variants in both directions', () => {
    const drill = item({ id: 'd-9', type: 'cloze', acceptedAnswers: ['Bücher'], prompt: 'Ich lese ___.' })
    expect(gradeDrill(drill, 'Buecher').correct).toBe(true)
    expect(gradeDrill(drill, 'bücher').correct).toBe(true)
    expect(gradeDrill(drill, 'Hefte').correct).toBe(false)
  })

  it('grades transform sentences ignoring case/punctuation', () => {
    const drill = item({ id: 'd-10', type: 'transform', acceptedAnswers: ['Ich hatte Zeit.'] })
    expect(gradeDrill(drill, 'ich hatte zeit').correct).toBe(true)
    expect(gradeDrill(drill, 'Ich habe Zeit.').correct).toBe(false)
  })

  it('grades translations against multiple accepted variants', () => {
    const drill = item({
      id: 'd-11',
      type: 'translate_de_en',
      acceptedAnswers: ['We watched a movie.', 'We saw a film.', 'We have seen a movie.'],
      prompt: 'Wir haben einen Film gesehen.',
    })
    expect(gradeDrill(drill, 'we saw a film').correct).toBe(true)
    expect(gradeDrill(drill, 'We have seen a movie!').correct).toBe(true)
    expect(gradeDrill(drill, 'We watch a movie').correct).toBe(false)
  })

  it('honors articleOptional from promptData', () => {
    const drill = item({
      id: 'd-12',
      type: 'translate_en_de',
      acceptedAnswers: ['der Apfel'],
      promptData: { articleOptional: true },
    })
    expect(gradeDrill(drill, 'Apfel').correct).toBe(true)
    expect(gradeDrill(drill, 'der Apfel').correct).toBe(true)
  })
})
