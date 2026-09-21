import { describe, expect, it } from 'vitest'
import { SEED_SCENARIOS } from '../index'

describe('seed scenarios (M3 + M5.3)', () => {
  it('has exactly the 20 required scenarios with unique ids', () => {
    expect(SEED_SCENARIOS).toHaveLength(20)
    const ids = new Set(SEED_SCENARIOS.map((s) => s.id))
    expect(ids.size).toBe(20)
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

  it('M5.3 adds 9 B1/B2 life situations (A1 4 / A2 3 / B1 7 / B2 6)', () => {
    const byLevel = SEED_SCENARIOS.reduce<Record<string, number>>((acc, s) => {
      acc[s.cefr] = (acc[s.cefr] ?? 0) + 1
      return acc
    }, {})
    expect(byLevel).toEqual({ A1: 4, A2: 3, B1: 7, B2: 6 })
    const m53 = [
      's-bewerbung',
      's-reklamation',
      's-verspaetung',
      's-freunde',
      's-behoerde',
      's-konflikt',
      's-diskussion',
      's-vermieter',
      's-praesentation',
    ]
    for (const id of m53) {
      const s = SEED_SCENARIOS.find((x) => x.id === id)
      expect(s, id).toBeDefined()
      expect(['B1', 'B2']).toContain(s?.cefr)
      expect(s?.keyPhrases.length).toBeGreaterThanOrEqual(5)
    }
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
