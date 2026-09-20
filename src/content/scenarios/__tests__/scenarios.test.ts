import { describe, expect, it } from 'vitest'
import { SEED_SCENARIOS } from '../index'

describe('seed scenarios (M3)', () => {
  it('has exactly the 11 required scenarios with unique ids', () => {
    expect(SEED_SCENARIOS).toHaveLength(11)
    const ids = new Set(SEED_SCENARIOS.map((s) => s.id))
    expect(ids.size).toBe(11)
  })

  it('every scenario is well-formed with ≥3 key phrases (non-empty de + en)', () => {
    for (const s of SEED_SCENARIOS) {
      expect(s.title.trim().length).toBeGreaterThan(0)
      expect(s.emoji.trim().length).toBeGreaterThan(0)
      expect(s.description.trim().length).toBeGreaterThan(0)
      expect(s.goal.trim().length).toBeGreaterThan(0)
      expect(s.keyPhrases.length).toBeGreaterThanOrEqual(3)
      for (const p of s.keyPhrases) {
        expect(p.de.trim().length).toBeGreaterThan(0)
        expect(p.en.trim().length).toBeGreaterThan(0)
      }
      expect(s.custom).toBe(false)
    }
  })

  it('levels stay within the seeded A1–B2 band', () => {
    const allowed = new Set(['A1', 'A2', 'B1', 'B2'])
    for (const s of SEED_SCENARIOS) expect(allowed.has(s.cefr)).toBe(true)
  })

  it('Fitnessstudio covers machines, duration, weights/reps/sets and partner', () => {
    const fit = SEED_SCENARIOS.find((s) => s.id === 's-fitness')
    expect(fit).toBeDefined()
    const de = (fit?.keyPhrases ?? []).map((p) => p.de).join(' ')
    for (const required of [
      'Wie funktioniert dieses Gerät',
      'Beinpresse',
      'Wie viel Gewicht',
      'Sätze',
      'Wiederholungen',
      'Wie lange trainierst du schon',
      'Partner',
    ]) {
      expect(de).toContain(required)
    }
  })
})
