import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  GOAL_MOTIVATIONS,
  HORIZON_OPTIONS,
  MINUTES_OPTIONS,
  WELCOME_GOALS,
  WELCOME_LEVELS,
  markWelcomeDone,
  normalizeName,
  resetWelcome,
  validateBasics,
  validateGoal,
  welcomeDone,
} from '../welcome'

// M9.5: the welcome flag lives in localStorage — stub it per test.
beforeEach(() => {
  const mem = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('welcomeDone / markWelcomeDone / resetWelcome', () => {
  it('is false before, true after marking, false again after reset', () => {
    expect(welcomeDone()).toBe(false)
    markWelcomeDone()
    expect(welcomeDone()).toBe(true)
    resetWelcome()
    expect(welcomeDone()).toBe(false)
  })
})

describe('validateBasics', () => {
  const valid = { name: 'Anna', level: 'A2' as const, dailyWordGoal: 10 }

  it('accepts a valid draft', () => {
    expect(validateBasics(valid)).toBeNull()
  })

  it('rejects an empty or whitespace-only name', () => {
    expect(validateBasics({ ...valid, name: '   ' })).toMatch(/name/i)
  })

  it('rejects names over 40 characters', () => {
    expect(validateBasics({ ...valid, name: 'x'.repeat(41) })).toMatch(/40/)
    expect(validateBasics({ ...valid, name: 'x'.repeat(40) })).toBeNull()
  })

  it('rejects a level outside the offered A1–B2 range', () => {
    expect(validateBasics({ ...valid, level: 'C1' as never })).toMatch(/level/i)
    expect(WELCOME_LEVELS).toEqual(['A1', 'A2', 'B1', 'B2'])
  })

  it('rejects a daily goal outside the offered set', () => {
    expect(validateBasics({ ...valid, dailyWordGoal: 7 })).toMatch(/goal/i)
    expect(WELCOME_GOALS).toEqual([5, 10, 15, 20])
  })
})

describe('normalizeName', () => {
  it('trims and caps at 40 characters', () => {
    expect(normalizeName('  Anna  ')).toBe('Anna')
    expect(normalizeName(`  ${'y'.repeat(60)}  `)).toHaveLength(40)
  })
})

describe('validateGoal (M15 goal interview)', () => {
  const valid = {
    motivation: 'work' as const,
    targetLevel: 'B1' as const,
    horizonWeeks: 52,
    minutesPerDay: 15,
  }

  it('accepts a valid draft', () => {
    expect(validateGoal(valid)).toBeNull()
  })

  it('rejects a missing motivation', () => {
    expect(validateGoal({ ...valid, motivation: null })).toMatch(/for/i)
  })

  it('rejects a target level outside the A1–B2 ladder', () => {
    expect(validateGoal({ ...valid, targetLevel: 'C1' as never })).toMatch(/target level/i)
  })

  it('rejects horizon and minutes outside the offered options', () => {
    expect(validateGoal({ ...valid, horizonWeeks: 30 })).toMatch(/horizon/i)
    expect(validateGoal({ ...valid, minutesPerDay: 20 })).toMatch(/minutes/i)
    expect(HORIZON_OPTIONS).toEqual([12, 26, 52, 104])
    expect(MINUTES_OPTIONS).toEqual([5, 10, 15, 30, 45])
  })

  it('offers every motivation with a label and emoji', () => {
    expect(GOAL_MOTIVATIONS.map((m) => m.id)).toEqual(['work', 'life', 'travel', 'exam', 'culture'])
    expect(GOAL_MOTIVATIONS.every((m) => m.label.length > 0 && m.emoji.length > 0)).toBe(true)
  })
})
