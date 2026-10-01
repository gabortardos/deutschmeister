import { describe, expect, it } from 'vitest'
import type { VocabWord } from '../../db/types'
import {
  applyVocabScope,
  EMPTY_VOCAB_SCOPE,
  normalizeVocabScope,
  toggleScopeValue,
  vocabScopeIsEmpty,
  wordInScope,
} from '../vocabScope'

function word(overrides: Partial<VocabWord> & Pick<VocabWord, 'id'>): VocabWord {
  return {
    updatedAt: 0,
    german: overrides.id,
    article: null,
    plural: null,
    english: overrides.id,
    cefr: 'A1',
    theme: 'Food',
    frequencyRank: 1,
    exampleSentenceDe: null,
    exampleSentenceEn: null,
    custom: false,
    ...overrides,
  }
}

const bank = [
  word({ id: 'a1-food', cefr: 'A1', theme: 'Food' }),
  word({ id: 'a1-travel', cefr: 'A1', theme: 'Travel' }),
  word({ id: 'b1-food', cefr: 'B1', theme: 'Food' }),
  word({ id: 'b2-law', cefr: 'B2', theme: 'Law' }),
  word({ id: 'custom', cefr: 'A1', theme: 'Custom', custom: true }),
]

describe('wordInScope', () => {
  it('lets everything pass with the empty scope', () => {
    for (const w of bank) expect(wordInScope(w, EMPTY_VOCAB_SCOPE)).toBe(true)
  })

  it('treats null/undefined scope as unrestricted', () => {
    expect(wordInScope(bank[3], null)).toBe(true)
    expect(wordInScope(bank[3], undefined)).toBe(true)
  })

  it('filters by level only', () => {
    const scope = { levels: ['A1' as const], themes: [] }
    expect(wordInScope(bank[0], scope)).toBe(true)
    expect(wordInScope(bank[2], scope)).toBe(false)
    expect(wordInScope(bank[3], scope)).toBe(false)
  })

  it('filters by theme only', () => {
    const scope = { levels: [], themes: ['Law'] }
    expect(wordInScope(bank[3], scope)).toBe(true)
    expect(wordInScope(bank[0], scope)).toBe(false)
  })

  it('requires BOTH dimensions to match when both are set', () => {
    const scope = { levels: ['A1' as const, 'B1' as const], themes: ['Food'] }
    expect(wordInScope(bank[0], scope)).toBe(true) // A1 + Food
    expect(wordInScope(bank[1], scope)).toBe(false) // right level, wrong theme
    expect(wordInScope(bank[2], scope)).toBe(true) // B1 + Food
    expect(wordInScope(bank[3], scope)).toBe(false) // wrong level and theme
  })

  it('always passes custom words — the learner added them deliberately', () => {
    const scope = { levels: ['C1' as const], themes: ['Science'] }
    expect(wordInScope(bank[4], scope)).toBe(true)
  })
})

describe('applyVocabScope', () => {
  it('returns a copy of everything for a null/empty scope', () => {
    expect(applyVocabScope(bank, null)).toEqual(bank)
    expect(applyVocabScope(bank, EMPTY_VOCAB_SCOPE).length).toBe(bank.length)
  })

  it('filters the list (custom words survive)', () => {
    const scope = { levels: [], themes: ['Food'] }
    expect(applyVocabScope(bank, scope).map((w) => w.id)).toEqual(['a1-food', 'b1-food', 'custom'])
  })

  it('does not mutate the input', () => {
    const original = [...bank]
    applyVocabScope(bank, { levels: ['A1' as const], themes: ['Food'] })
    expect(bank).toEqual(original)
  })
})

describe('vocabScopeIsEmpty', () => {
  it('is true for null/undefined/empty and false once a dimension is set', () => {
    expect(vocabScopeIsEmpty(null)).toBe(true)
    expect(vocabScopeIsEmpty(undefined)).toBe(true)
    expect(vocabScopeIsEmpty(EMPTY_VOCAB_SCOPE)).toBe(true)
    expect(vocabScopeIsEmpty({ levels: [], themes: ['Food'] })).toBe(false)
    expect(vocabScopeIsEmpty({ levels: ['A1' as const], themes: [] })).toBe(false)
  })
})

describe('normalizeVocabScope', () => {
  it('collapses garbage input to the empty scope', () => {
    expect(normalizeVocabScope(null)).toEqual(EMPTY_VOCAB_SCOPE)
    expect(normalizeVocabScope(undefined)).toEqual(EMPTY_VOCAB_SCOPE)
    expect(normalizeVocabScope('B1')).toEqual(EMPTY_VOCAB_SCOPE)
    expect(normalizeVocabScope(42)).toEqual(EMPTY_VOCAB_SCOPE)
    expect(normalizeVocabScope({})).toEqual(EMPTY_VOCAB_SCOPE)
    expect(normalizeVocabScope({ levels: 'B1', themes: null })).toEqual(EMPTY_VOCAB_SCOPE)
  })

  it('drops unknown levels and non-string/blank themes, dedupes and trims', () => {
    expect(
      normalizeVocabScope({
        levels: ['B1', 'X9', 'B1', 3],
        themes: ['Food', ' Food ', '', 7, 'Law', 'Food'],
      }),
    ).toEqual({ levels: ['B1'], themes: ['Food', 'Law'] })
  })

  it('round-trips a clean scope untouched', () => {
    const scope = { levels: ['A2' as const, 'B2' as const], themes: ['Health', 'Law'] }
    expect(normalizeVocabScope(scope)).toEqual(scope)
  })
})

describe('toggleScopeValue', () => {
  it('adds a missing value and removes a present one', () => {
    expect(toggleScopeValue(['A1'], 'B1')).toEqual(['A1', 'B1'])
    expect(toggleScopeValue(['A1', 'B1'], 'A1')).toEqual(['B1'])
  })

  it('toggling the last value off returns the unrestricted dimension', () => {
    expect(toggleScopeValue(['B1'], 'B1')).toEqual([])
  })
})