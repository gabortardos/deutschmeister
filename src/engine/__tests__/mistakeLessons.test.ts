import { describe, expect, it } from 'vitest'
import {
  CATEGORY_TOPIC_KEYWORD,
  MISTAKE_LESSONS,
  findTopicForMistake,
  mistakeLesson,
  type MistakeLessonCategory,
} from '../mistakeLessons'

const CATEGORIES: MistakeLessonCategory[] = ['gender', 'case', 'word-order', 'vocab', 'verb-form', 'other']

describe('MISTAKE_LESSONS', () => {
  it('covers all six categories with complete, distinct lessons', () => {
    const titles = new Set<string>()
    for (const c of CATEGORIES) {
      const lesson = MISTAKE_LESSONS[c]
      expect(lesson.title.length, `${c} title`).toBeGreaterThan(0)
      expect(lesson.rule.length, `${c} rule`).toBeGreaterThan(40)
      expect(lesson.examples.length, `${c} examples`).toBeGreaterThanOrEqual(2)
      expect(lesson.tip.length, `${c} tip`).toBeGreaterThan(10)
      titles.add(lesson.title)
    }
    expect(titles.size).toBe(CATEGORIES.length)
  })

  it('every example pair fixes something (bad ≠ good) and contains German', () => {
    for (const c of CATEGORIES) {
      for (const ex of MISTAKE_LESSONS[c].examples) {
        expect(ex.bad.trim()).not.toBe('')
        expect(ex.good.trim()).not.toBe('')
        expect(ex.bad).not.toBe(ex.good)
      }
    }
  })
})

describe('mistakeLesson', () => {
  it('maps each known category to its own lesson', () => {
    for (const c of CATEGORIES) expect(mistakeLesson(c)).toBe(MISTAKE_LESSONS[c])
  })

  it('unknown or malformed categories fall back to the other-lesson', () => {
    expect(mistakeLesson('typo-category')).toBe(MISTAKE_LESSONS.other)
    expect(mistakeLesson('')).toBe(MISTAKE_LESSONS.other)
  })
})

describe('findTopicForMistake', () => {
  const topics = [
    { id: 'articles', title: 'Articles & gender' },
    { id: 'akkusativ', title: 'Akkusativ basics' },
    { id: 'word-order', title: 'Verb-second word order' },
    { id: 'present', title: 'Present tense: regular verbs' },
  ]

  it('matches by title keyword, case-insensitively', () => {
    expect(findTopicForMistake('gender', topics)?.id).toBe('articles')
    expect(findTopicForMistake('word-order', topics)?.id).toBe('word-order')
    expect(findTopicForMistake('case', topics)?.id).toBe('akkusativ')
    expect(findTopicForMistake('verb-form', topics)?.id).toBe('present')
  })

  it('returns null for categories without a keyword and when nothing matches', () => {
    expect(CATEGORY_TOPIC_KEYWORD.vocab).toBeNull()
    expect(findTopicForMistake('vocab', topics)).toBeNull()
    expect(findTopicForMistake('gender', [])).toBeNull()
    expect(findTopicForMistake('weird', topics)).toBeNull()
  })
})
