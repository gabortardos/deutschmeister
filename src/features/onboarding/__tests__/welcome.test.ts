import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  WELCOME_GOALS,
  WELCOME_LEVELS,
  markWelcomeDone,
  normalizeName,
  resetWelcome,
  validateBasics,
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
