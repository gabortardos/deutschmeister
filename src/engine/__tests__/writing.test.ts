import { describe, expect, it } from 'vitest'
import {
  WRITING_BYO_DAILY_LIMIT,
  WRITING_DAILY_LIMITS,
  WRITING_MAX_WORDS,
  WRITING_MIN_WORDS,
  WRITING_PRO_CAP_WORDS,
  WRITING_SOFT_CAP_WORDS,
  countWords,
  promptForDay,
  promptsForLevel,
  writingDailyLimit,
  writingQuota,
  writingWordCap,
} from '../writing'
import { CEFR_LEVELS } from '../../db/types'
import { addDays, keyOfDay } from '../progressStats'
import { DAY_MS } from '../text'

// Fixed clock far from DST transitions (mid-January local time).
const NOW = new Date(2026, 0, 14, 12, 0, 0).getTime()
const TODAY = keyOfDay(NOW)

describe('countWords', () => {
  it('counts non-empty whitespace-separated tokens', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('  \n\t  ')).toBe(0)
    expect(countWords('Ich bin müde.')).toBe(3)
    expect(countWords(' Guten   Morgen,\nliebe Leute! ')).toBe(4)
  })
})

describe('caps and limits', () => {
  it('orders the word caps sanely', () => {
    expect(WRITING_MIN_WORDS).toBeLessThan(WRITING_SOFT_CAP_WORDS)
    expect(WRITING_SOFT_CAP_WORDS).toBeLessThan(WRITING_PRO_CAP_WORDS)
    expect(WRITING_PRO_CAP_WORDS).toBeLessThan(WRITING_MAX_WORDS)
  })

  it('maps the plan tiers; unknown plans fall back to free', () => {
    expect(WRITING_DAILY_LIMITS).toEqual({ free: 1, basic: 3, plus: 3, pro: 5 })
    expect(writingDailyLimit('platform', 'free')).toBe(1)
    expect(writingDailyLimit('platform', 'basic')).toBe(3)
    expect(writingDailyLimit('platform', 'plus')).toBe(3)
    expect(writingDailyLimit('platform', 'pro')).toBe(5)
    expect(writingDailyLimit('platform', 'mystery')).toBe(1)
  })

  it('byo keeps the generous own-key cap; route none locks grading entirely', () => {
    expect(writingDailyLimit('byo', 'free')).toBe(WRITING_BYO_DAILY_LIMIT)
    expect(writingDailyLimit('byo', 'plus')).toBe(WRITING_BYO_DAILY_LIMIT)
    expect(writingDailyLimit('none', 'plus')).toBe(0)
  })

  it('250 words are a Pro cap (dormant until M11.10); everyone else gets 120', () => {
    expect(writingWordCap('pro')).toBe(WRITING_PRO_CAP_WORDS)
    expect(writingWordCap('plus')).toBe(WRITING_SOFT_CAP_WORDS)
    expect(writingWordCap('free')).toBe(WRITING_SOFT_CAP_WORDS)
  })
})

describe('writingQuota', () => {
  const pieces = [
    { createdAt: NOW },
    { createdAt: NOW - 60_000 },
    { createdAt: NOW - 3 * DAY_MS }, // a previous local day — must not count
  ]

  it('counts only today’s pieces and derives the remainder', () => {
    expect(writingQuota(pieces, 'platform', 'basic', NOW)).toEqual({ usedToday: 2, limit: 3, left: 1 })
  })

  it('free users get exactly one graded piece a day', () => {
    expect(writingQuota(pieces, 'platform', 'free', NOW).left).toBe(0)
    expect(writingQuota([], 'platform', 'free', NOW)).toEqual({ usedToday: 0, limit: 1, left: 1 })
  })

  it('never reports negative leftovers', () => {
    const many = [0, 1, 2, 3, 4, 5].map((i) => ({ createdAt: NOW + i }))
    expect(writingQuota(many, 'platform', 'plus', NOW).left).toBe(0)
  })
})

describe('prompt bank', () => {
  it('has 8 prompts per CEFR level with unique ids and bilingual tasks', () => {
    const ids = new Set<string>()
    for (const level of CEFR_LEVELS) {
      const prompts = promptsForLevel(level)
      expect(prompts.length).toBe(8)
      expect(prompts.every((p) => p.cefr === level)).toBe(true)
      for (const p of prompts) {
        expect(p.taskDe.length).toBeGreaterThan(10)
        expect(p.taskEn.length).toBeGreaterThan(10)
        ids.add(p.id)
      }
    }
    expect(ids.size).toBe(48)
  })

  it('promptForDay is deterministic; the 🎲 salt cycles the bank', () => {
    expect(promptForDay('B1', TODAY, 0)).toEqual(promptForDay('B1', TODAY, 0))
    const salted = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((s) => promptForDay('B1', TODAY, s).id))
    expect(salted.size).toBeGreaterThan(1)
  })

  it('every level/day/salt combination stays inside its level’s bank', () => {
    for (const level of CEFR_LEVELS) {
      for (let day = 0; day < 14; day += 1) {
        for (let salt = 0; salt < 4; salt += 1) {
          expect(promptForDay(level, addDays(TODAY, -day), salt).cefr).toBe(level)
        }
      }
    }
  })
})