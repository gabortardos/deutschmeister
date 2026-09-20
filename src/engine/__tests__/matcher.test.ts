import { describe, expect, it } from 'vitest'
import { levenshtein, matchSpeech, similarity } from '../matcher'

describe('levenshtein', () => {
  it('computes known distances', () => {
    expect(levenshtein('', '')).toBe(0)
    expect(levenshtein('abc', '')).toBe(3)
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    expect(levenshtein('apfel', 'apfel')).toBe(0)
  })

  it('symmetry', () => {
    expect(levenshtein('guten', 'gutem')).toBe(levenshtein('gutem', 'guten'))
  })
})

describe('similarity', () => {
  it('is 1 for identical and 0 for fully different', () => {
    expect(similarity('haus', 'haus')).toBe(1)
    expect(similarity('', '')).toBe(1)
    expect(similarity('abcd', '')).toBe(0)
  })
})

describe('matchSpeech', () => {
  it('normalizes before comparing (umlauts, case, punctuation)', () => {
    expect(matchSpeech('Ich möchte einen Kaffee.', 'Ich moechte einen Kaffee').verdict).toBe('correct')
  })

  it('returns correct at ≥0.85', () => {
    // similarity = 1 - 1/14 ≈ 0.928
    expect(matchSpeech('guten Morgen', 'guter Morgen').verdict).toBe('correct')
  })

  it('returns almost for 0.7–0.85 with similarity value', () => {
    // 'apfe' vs 'apfel': d=1, len=5 → similarity 0.8 exactly
    const r = matchSpeech('apfe', 'apfel')
    expect(r.verdict).toBe('almost')
    expect(r.similarity).toBe(0.8)
    // different words stay incorrect
    expect(matchSpeech('gute Morgen', 'guten tag').verdict).toBe('incorrect')
  })

  it('returns incorrect below 0.7', () => {
    expect(matchSpeech('banane', 'Wie geht es dir heute').verdict).toBe('incorrect')
  })
})
