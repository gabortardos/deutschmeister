import { describe, expect, it } from 'vitest'
import { SEED_VOCAB, SEED_VOCAB_COUNTS } from '../index'
import { A1_ROWS } from '../a1'
import { A2_ROWS } from '../a2'
import { B1_ROWS } from '../b1'

describe('seed vocab corpus', () => {
  it('contains at least 400 words', () => {
    expect(SEED_VOCAB.length).toBeGreaterThanOrEqual(400)
  })

  it('has unique ids and unique frequency ranks in corpus order', () => {
    expect(new Set(SEED_VOCAB.map((w) => w.id)).size).toBe(SEED_VOCAB.length)
    SEED_VOCAB.forEach((w, i) => {
      expect(w.frequencyRank).toBe(i + 1)
    })
  })

  it('matches the per-level row counts', () => {
    expect(SEED_VOCAB_COUNTS.A1).toBe(A1_ROWS.length)
    expect(SEED_VOCAB_COUNTS.A2).toBe(A2_ROWS.length)
    expect(SEED_VOCAB_COUNTS.B1).toBe(B1_ROWS.length)
    expect(SEED_VOCAB.length).toBe(A1_ROWS.length + A2_ROWS.length + B1_ROWS.length)
    expect(SEED_VOCAB.filter((w) => w.cefr === 'A1').length).toBe(A1_ROWS.length)
    expect(SEED_VOCAB.filter((w) => w.cefr === 'B1').length).toBe(B1_ROWS.length)
  })

  it('every word is fully populated (german, english, theme, both example sentences)', () => {
    for (const w of SEED_VOCAB) {
      expect(w.german.trim().length).toBeGreaterThan(0)
      expect(w.english.trim().length).toBeGreaterThan(0)
      expect(w.theme.trim().length).toBeGreaterThan(0)
      expect(w.exampleSentenceDe?.trim().length ?? 0).toBeGreaterThan(0)
      expect(w.exampleSentenceEn?.trim().length ?? 0).toBeGreaterThan(0)
      expect(w.custom).toBe(false)
    }
  })

  it('only nouns carry article and plural', () => {
    for (const w of SEED_VOCAB) {
      if (w.article === null) expect(w.plural).toBeNull()
      else expect(['der', 'die', 'das']).toContain(w.article)
    }
  })

  it('noun example sentences contain the noun in base form', () => {
    for (const w of SEED_VOCAB) {
      if (w.article === null) continue // verbs/adjectives appear conjugated
      const contained = w.exampleSentenceDe?.toLowerCase().includes(w.german.toLowerCase()) ?? false
      expect(contained, `${w.german} missing from "${w.exampleSentenceDe}"`).toBe(true)
    }
  })
})
