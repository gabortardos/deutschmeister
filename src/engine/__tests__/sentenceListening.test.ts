import { describe, expect, it } from 'vitest'
import type { VocabWord } from '../../db/types'
import { gradeSentence, normalizeSentence, sentenceItems } from '../sentenceListening'

function word(over: Partial<VocabWord> & { id: string }): VocabWord {
  return {
    german: 'Tag',
    article: 'der',
    plural: 'Tage',
    english: 'day',
    cefr: 'A1',
    theme: 'Time',
    frequencyRank: 1,
    exampleSentenceDe: null,
    exampleSentenceEn: null,
    custom: false,
    updatedAt: 0,
    ...over,
  }
}

describe('normalizeSentence', () => {
  it('is case-, punctuation- and umlaut-tolerant', () => {
    expect(normalizeSentence('Der Tag ist lang.')).toBe(normalizeSentence('der tag ist lang'))
    expect(normalizeSentence('„Kannst du schwimmen?“')).toBe(normalizeSentence('kannst du schwimmen'))
    expect(normalizeSentence('Ich weiß es nicht.')).toBe(normalizeSentence('ich weiss es nicht'))
    expect(normalizeSentence('E-Mail, bitte!')).toBe(normalizeSentence('e mail bitte'))
  })

  it('collapses whitespace left by stripped punctuation', () => {
    expect(normalizeSentence('Ich  bin   müde — wirklich.')).toBe(normalizeSentence('ich bin muede wirklich'))
  })

  it('reduces punctuation-only input to an empty string', () => {
    expect(normalizeSentence('…—?!')).toBe('')
  })
})

describe('sentenceItems', () => {
  it('builds one item per word with an example sentence', () => {
    const items = sentenceItems([
      word({ id: 'a', exampleSentenceDe: 'Der Tag ist lang.', exampleSentenceEn: 'The day is long.' }),
      word({ id: 'b', german: 'sein', article: null, exampleSentenceDe: 'Ich bin müde.', exampleSentenceEn: 'I am tired.' }),
      word({ id: 'c', exampleSentenceDe: null }),
    ])
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ id: 'a:sentence', kind: 'sentence', wordId: 'a', word: 'der Tag', sentenceEn: 'The day is long.' })
    expect(items[1]).toMatchObject({ id: 'b:sentence', word: 'sein', sentenceEn: 'I am tired.' })
  })

  it('deduplicates identical sentences (normalization-insensitive)', () => {
    const items = sentenceItems([
      word({ id: 'a', exampleSentenceDe: 'Der Tag ist lang.' }),
      word({ id: 'b', german: 'lang', article: null, exampleSentenceDe: 'der tag ist lang' }),
      word({ id: 'c', exampleSentenceDe: 'Wir haben ein Auto.' }),
    ])
    expect(items.map((i) => i.id)).toEqual(['a:sentence', 'c:sentence'])
  })

  it('caps at the limit and skips punctuation-only sentences', () => {
    const words = Array.from({ length: 10 }, (_, i) => word({ id: `w${i}`, exampleSentenceDe: `Satz Nummer ${i}.` }))
    expect(sentenceItems(words, 4)).toHaveLength(4)
    expect(sentenceItems([word({ id: 'x', exampleSentenceDe: '—?!' })])).toHaveLength(0)
  })
})

describe('gradeSentence', () => {
  const target = 'Der Tag ist lang.'

  it('accepts exact, umlaut-free and punctuation-free typing as correct', () => {
    expect(gradeSentence('Der Tag ist lang.', target).verdict).toBe('correct')
    expect(gradeSentence('der tag ist lang', target).verdict).toBe('correct')
    expect(gradeSentence(target, 'Ich bin müde.').verdict).not.toBe('correct')
  })

  it('grades a one-letter typo in a short sentence as almost-or-correct, never inflates', () => {
    const grade = gradeSentence('Der Tak ist lang.', target)
    expect(['almost', 'correct']).toContain(grade.verdict)
    expect(grade.similarity).toBeGreaterThan(0.75)
  })

  it('marks a wrong or missing word as incorrect', () => {
    expect(gradeSentence('Die Nacht ist kalt.', target).verdict).toBe('incorrect')
    expect(gradeSentence('Der Tag', target).verdict).toBe('incorrect')
  })

  it('returns incorrect with zero similarity for empty input', () => {
    expect(gradeSentence('   ', target)).toEqual({ verdict: 'incorrect', similarity: 0 })
  })

  it('rounds similarity to three decimals', () => {
    const grade = gradeSentence('Der Tag ist lang..', target)
    expect(grade.similarity).toBeLessThanOrEqual(1)
    expect(String(grade.similarity).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(3)
  })
})
