import { describe, expect, it } from 'vitest'
import type { VocabWord } from '../../db/types'
import { acceptedForms, gradeSpoken, qualityForVerdict, speakListenItems } from '../speakListen'

const word = (over: Partial<VocabWord>): VocabWord => ({
  id: 'w-apfel',
  updatedAt: 0,
  german: 'Apfel',
  article: 'der',
  plural: 'Äpfel',
  english: 'apple',
  cefr: 'A1',
  theme: 'food',
  frequencyRank: 400,
  exampleSentenceDe: 'Der Apfel ist rot.',
  exampleSentenceEn: 'The apple is red.',
  custom: false,
  ...over,
})

describe('acceptedForms', () => {
  it('offers the article form first, bare word tolerated', () => {
    expect(acceptedForms(word({}))).toEqual(['der Apfel', 'Apfel'])
  })

  it('nouns without article accept only the word', () => {
    expect(acceptedForms(word({ german: 'schnell', article: null }))).toEqual(['schnell'])
  })
})

describe('speakListenItems', () => {
  it('interleaves listen and speak per word when STT is available', () => {
    const items = speakListenItems([word({}), word({ id: 'w-brot', german: 'Brot', article: 'das' })], {
      sttAvailable: true,
    })
    expect(items.map((i) => i.kind)).toEqual(['listen', 'speak', 'listen', 'speak'])
    expect(items[0]).toMatchObject({ wordId: 'w-apfel', prompt: 'apple', answer: 'der Apfel' })
    expect(items[1]).toMatchObject({ kind: 'speak', wordId: 'w-apfel' })
  })

  it('drops speak items when no microphone is available', () => {
    const items = speakListenItems([word({})], { sttAvailable: false })
    expect(items.map((i) => i.kind)).toEqual(['listen'])
  })
})

describe('gradeSpoken', () => {
  it('accepts the bare word when STT drops the article', () => {
    const grade = gradeSpoken('apfel', ['der Apfel', 'Apfel'])
    expect(grade.verdict).toBe('correct')
    expect(grade.matchedTarget).toBe('Apfel')
  })

  it('is case- and umlaut-tolerant via normalization', () => {
    expect(gradeSpoken('die UEBUNG', ['die Übung', 'Übung']).verdict).toBe('correct')
    expect(gradeSpoken('Uebung', ['die Übung', 'Übung']).verdict).toBe('correct')
  })

  it('flags near misses as almost and gibberish as incorrect', () => {
    // 'apfe' vs 'apfel': distance 1 of 5 → similarity 0.8 → almost
    expect(gradeSpoken('apfe', ['der Apfel', 'Apfel']).verdict).toBe('almost')
    expect(gradeSpoken('banane', ['der Apfel', 'Apfel']).verdict).toBe('incorrect')
  })

  it('returns incorrect for an empty transcript', () => {
    expect(gradeSpoken('   ', ['der Apfel'])).toMatchObject({ verdict: 'incorrect', similarity: 0 })
  })
})

describe('qualityForVerdict', () => {
  it('maps verdicts to SM-2 qualities', () => {
    expect(qualityForVerdict('correct')).toBe(5)
    expect(qualityForVerdict('almost')).toBe(3)
    expect(qualityForVerdict('incorrect')).toBe(1)
  })
})
