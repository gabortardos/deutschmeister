import { describe, expect, it } from 'vitest'
import { PLACEMENT_BANK } from '../placement'
import { SEED_GRAMMAR_COUNTS, SEED_GRAMMAR_DRILLS, SEED_GRAMMAR_TOPICS, SEED_TOPIC_KEYS } from '../index'
import { SEED_VOCAB } from '../../vocab'
import { drillInstruction, drillOptions, drillTokens, gradeDrill, needsGermanKeys } from '../../../engine/exerciseRunner'

describe('seed grammar syllabus', () => {
  it('covers ~35 topics across A1–B1 (13/12/10)', () => {
    expect(SEED_GRAMMAR_TOPICS.length).toBe(35)
    expect(SEED_GRAMMAR_COUNTS.A1).toBe(13)
    expect(SEED_GRAMMAR_COUNTS.A2).toBe(12)
    expect(SEED_GRAMMAR_COUNTS.B1).toBe(10)
  })

  it('has unique topic ids, keys and strictly increasing order', () => {
    expect(new Set(SEED_GRAMMAR_TOPICS.map((t) => t.id)).size).toBe(SEED_GRAMMAR_TOPICS.length)
    expect(new Set(SEED_TOPIC_KEYS).size).toBe(SEED_TOPIC_KEYS.length)
    SEED_GRAMMAR_TOPICS.forEach((t, i) => {
      expect(t.order).toBe(i + 1)
      expect(t.id).toMatch(/^g-[ab][12]-\d{2}$/)
    })
  })

  it('every topic has real content: title, focus, explanation, valid relatedVocabTheme', () => {
    const themes = new Set(SEED_VOCAB.map((w) => w.theme))
    for (const t of SEED_GRAMMAR_TOPICS) {
      expect(t.title.trim().length).toBeGreaterThan(3)
      expect(t.focus.trim().length).toBeGreaterThan(10)
      expect(t.explanationMd.length).toBeGreaterThan(120)
      if (t.relatedVocabTheme !== null) {
        expect(themes, `${t.id}: theme "${t.relatedVocabTheme}" not in vocab corpus`).toContain(t.relatedVocabTheme)
      }
    }
  })

  it('every topic has ≥6 drills, covering at least 4 of the 6 types', () => {
    const byTopic = new Map<string, number>()
    for (const d of SEED_GRAMMAR_DRILLS) byTopic.set(d.ownerId, (byTopic.get(d.ownerId) ?? 0) + 1)
    for (const t of SEED_GRAMMAR_TOPICS) {
      const count = byTopic.get(t.id) ?? 0
      expect(count, `${t.id} has only ${count} drills`).toBeGreaterThanOrEqual(6)
      const types = new Set(SEED_GRAMMAR_DRILLS.filter((d) => d.ownerId === t.id).map((d) => d.type))
      expect(types.size, `${t.id} covers only ${types.size} drill types`).toBeGreaterThanOrEqual(4)
    }
  })

  it('has unique drill ids, and drills only reference known topics', () => {
    expect(new Set(SEED_GRAMMAR_DRILLS.map((d) => d.id)).size).toBe(SEED_GRAMMAR_DRILLS.length)
    const ids = new Set(SEED_GRAMMAR_TOPICS.map((t) => t.id))
    for (const d of SEED_GRAMMAR_DRILLS) expect(ids.has(d.ownerId)).toBe(true)
  })
  it('drills are well-formed per type and self-solvable by the runner', () => {
    for (const d of SEED_GRAMMAR_DRILLS) {
      expect(d.prompt.trim().length, `${d.id} empty prompt`).toBeGreaterThan(0)
      expect(d.acceptedAnswers.length, `${d.id} has no accepted answers`).toBeGreaterThan(0)
      for (const a of d.acceptedAnswers) expect(a.trim().length).toBeGreaterThan(0)
      expect(d.cefr).toBe(SEED_GRAMMAR_TOPICS.find((t) => t.id === d.ownerId)?.cefr)
      expect(d.source).toBe('seed')
      expect(d.validated).toBe(true)

      if (d.type === 'cloze') {
        expect(d.prompt).toContain('___')
        expect(d.prompt.replace('___', d.acceptedAnswers[0])).not.toContain('___')
      }
      if (d.type === 'choice') {
        const options = drillOptions(d)
        expect(options.length).toBeGreaterThanOrEqual(3)
        expect(new Set(options).size).toBe(options.length)
        expect(options).toContain(d.acceptedAnswers[0])
        expect(d.acceptedAnswers.length).toBe(1)
      }
      if (d.type === 'transform') {
        expect((drillInstruction(d) ?? '').length).toBeGreaterThan(0)
      }
      if (d.type === 'wordorder') {
        const tokens = drillTokens(d)
        expect(tokens.length).toBeGreaterThanOrEqual(3)
        const noPunct = d.acceptedAnswers[0].replace(/[.?!]$/, '')
        // tokens are a scrambled permutation of the answer's words
        expect([...tokens].sort()).toEqual(noPunct.split(' ').sort())
        expect(needsGermanKeys(d.type)).toBe(true) // tokens are German words
      }
      if (d.type === 'translate_de_en') {
        expect(needsGermanKeys(d.type)).toBe(false)
      }
      if (d.type === 'translate_en_de') {
        expect(needsGermanKeys(d.type)).toBe(true)
      }
    }
  })

  it('grades its own accepted answers correct and a junk answer wrong', () => {
    for (const d of SEED_GRAMMAR_DRILLS) {
      const res = gradeDrill(d, d.acceptedAnswers[0])
      expect(res.correct, `${d.id} rejected its own answer "${d.acceptedAnswers[0]}"`).toBe(true)
      expect(gradeDrill(d, 'qzwxecrv1234').correct).toBe(false)
    }
  })
})

describe('placement bank', () => {
  it('has exactly 30 items, 10 per level, 5 vocab + 5 grammar', () => {
    expect(PLACEMENT_BANK.length).toBe(30)
    for (const level of ['A1', 'A2', 'B1'] as const) {
      const items = PLACEMENT_BANK.filter((q) => q.cefr === level)
      expect(items.length).toBe(10)
      expect(items.filter((q) => q.kind === 'vocab').length).toBe(5)
      expect(items.filter((q) => q.kind === 'grammar').length).toBe(5)
    }
  })

  it('has unique ids, 4 distinct options containing the answer, germanWord only on vocab', () => {
    expect(new Set(PLACEMENT_BANK.map((q) => q.id)).size).toBe(30)
    for (const q of PLACEMENT_BANK) {
      expect(q.options.length).toBe(4)
      expect(new Set(q.options).size).toBe(4)
      expect(q.options).toContain(q.answer)
      expect(q.prompt.trim().length).toBeGreaterThan(0)
      if (q.kind === 'vocab') expect(typeof q.germanWord).toBe('string')
      else expect(q.germanWord).toBeNull()
    }
  })

  it('vocab items reference words that exist in the seed corpus', () => {
    const corpus = new Set(SEED_VOCAB.map((w) => w.german))
    for (const q of PLACEMENT_BANK) {
      if (q.kind !== 'vocab') continue
      expect(corpus.has(q.germanWord as string), `${q.id}: "${q.germanWord}" not in vocab corpus`).toBe(true)
    }
  })
})
