import { describe, expect, it } from 'vitest'
import { SEED_GRAMMAR_TOPICS } from '../../index'
import { lessonForTopic, SEED_LESSONS } from '../index'

const PILOT_TITLES = [
  'Present tense: regular verbs',
  'Adjective endings',
  'Perfekt vs. Präteritum',
] as const

describe('M14 pilot lessons', () => {
  it('ships exactly 3 pilot lessons with unique topic ids', () => {
    expect(SEED_LESSONS.length).toBe(3)
    expect(new Set(SEED_LESSONS.map((l) => l.topicId)).size).toBe(3)
  })

  it('attaches each lesson to an existing seed topic with the expected title', () => {
    const titles = SEED_LESSONS.map((l) => {
      const topic = SEED_GRAMMAR_TOPICS.find((t) => t.id === l.topicId)
      expect(topic, `topic ${l.topicId} must exist in SEED_GRAMMAR_TOPICS`).toBeDefined()
      return topic?.title
    })
    expect(new Set(titles)).toEqual(new Set(PILOT_TITLES))
  })

  it('lessonForTopic resolves each lesson and rejects unknown ids', () => {
    for (const l of SEED_LESSONS) expect(lessonForTopic(l.topicId)).toBe(l)
    expect(lessonForTopic('g-c2-99')).toBeUndefined()
  })
})

describe('lesson contract (every lesson)', () => {
  for (const lesson of SEED_LESSONS) {
    describe(lesson.topicId, () => {
      it('has a motivating hook and a sane reading time', () => {
        expect(lesson.hook.trim().length).toBeGreaterThanOrEqual(60)
        expect(lesson.minutes).toBeGreaterThanOrEqual(3)
        expect(lesson.minutes).toBeLessThanOrEqual(15)
      })

      it('teaches in 3–6 sections with worked tables', () => {
        expect(lesson.sections.length).toBeGreaterThanOrEqual(3)
        expect(lesson.sections.length).toBeLessThanOrEqual(6)
        for (const s of lesson.sections) {
          expect(s.heading.trim().length).toBeGreaterThan(0)
          expect(s.prose.length).toBeGreaterThanOrEqual(1)
          for (const p of s.prose) expect(p.trim().length).toBeGreaterThan(0)
          if (s.table) {
            expect(s.table.headers.length).toBeGreaterThanOrEqual(2)
            for (const row of s.table.rows) expect(row.length).toBe(s.table.headers.length)
            expect(s.table.rows.length).toBeGreaterThanOrEqual(2)
          }
        }
        // At least one worked table — the "teacher at the blackboard" promise.
        expect(lesson.sections.some((s) => s.table !== undefined)).toBe(true)
      })

      it('lists 3+ common mistakes with wrong → right → why', () => {
        expect(lesson.mistakes.length).toBeGreaterThanOrEqual(3)
        for (const m of lesson.mistakes) {
          expect(m.wrong.trim().length).toBeGreaterThan(0)
          expect(m.right.trim().length).toBeGreaterThan(0)
          expect(m.why.trim().length).toBeGreaterThan(0)
          expect(m.wrong).not.toBe(m.right)
        }
      })

      it('has 3–5 checkpoints, each gradable offline', () => {
        expect(lesson.checkpoints.length).toBeGreaterThanOrEqual(3)
        expect(lesson.checkpoints.length).toBeLessThanOrEqual(5)
        const ids = new Set<string>()
        for (const cp of lesson.checkpoints) {
          expect(cp.id.trim().length).toBeGreaterThan(0)
          expect(ids.has(cp.id)).toBe(false)
          ids.add(cp.id)
          expect(cp.question.trim().length).toBeGreaterThan(0)
          expect(new Set(cp.options).size).toBe(cp.options.length)
          expect(cp.options.length).toBeGreaterThanOrEqual(3)
          expect(cp.options.length).toBeLessThanOrEqual(5)
          expect(cp.answer).toBeGreaterThanOrEqual(0)
          expect(cp.answer).toBeLessThan(cp.options.length)
          expect(cp.explain.trim().length).toBeGreaterThan(0)
        }
      })

      it('ends with a printable cheat sheet (4+ lines) and uses real German orthography', () => {
        expect(lesson.cheatSheet.length).toBeGreaterThanOrEqual(4)
        for (const line of lesson.cheatSheet) expect(line.trim().length).toBeGreaterThan(0)
        const all = JSON.stringify(lesson)
        expect(/[äöüßÄÖÜ„]/.test(all), 'German characters must appear in examples').toBe(true)
      })
    })
  }
})
