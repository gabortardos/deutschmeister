import { describe, expect, it } from 'vitest'
import {
  FORECAST_DAYS,
  HEATMAP_DAYS,
  addDays,
  computeProgressStats,
  computeStreaks,
  dayActions,
  dueForecast,
  heatCells,
  isActiveDay,
  keyOfDay,
  learnedRing,
  type ActivityDay,
} from '../progressStats'
import { DAY_MS, startOfDay } from '../text'

// Fixed clock far from DST transitions (mid-January local time).
const NOW = new Date(2026, 0, 14, 12, 0, 0).getTime()
const TODAY = keyOfDay(NOW)
const YESTERDAY = addDays(TODAY, -1)

function day(date: string, patch: Partial<ActivityDay> = {}): ActivityDay {
  return { date, newWords: 0, reviews: 0, drills: 0, conversations: 0, ...patch }
}

describe('keyOfDay / addDays', () => {
  it('keys a timestamp to its local calendar day', () => {
    const midnight = startOfDay(NOW)
    const late = startOfDay(NOW) + 23 * 3_600_000
    expect(keyOfDay(midnight)).toBe(TODAY)
    expect(keyOfDay(late)).toBe(TODAY)
  })

  it('adds and subtracts days across month boundaries (no UTC drift)', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29') // leap year
  })
})

describe('dayActions / isActiveDay', () => {
  it('sums reviews + drills + conversations', () => {
    expect(dayActions(day('2026-01-01', { reviews: 2, drills: 3, conversations: 1 }))).toBe(6)
  })

  it('treats newWords-only rows as inactive (plan rows are not activity)', () => {
    expect(isActiveDay(day('2026-01-01', { newWords: 5 }))).toBe(false)
    expect(isActiveDay(day('2026-01-01', { drills: 1 }))).toBe(true)
  })

  it('counts writing pieces (M11.9) — optional field, pre-M11.9 rows tolerated', () => {
    expect(dayActions(day('2026-01-01', { writing: 2 }))).toBe(2)
    expect(dayActions(day('2026-01-01', { reviews: 1, drills: 1, conversations: 1, writing: 1 }))).toBe(4)
  })
})

describe('computeStreaks', () => {
  it('returns zeros with no history', () => {
    expect(computeStreaks([], TODAY)).toEqual({ current: 0, longest: 0 })
  })

  it('counts today when active', () => {
    const dates = [addDays(TODAY, -2), YESTERDAY, TODAY]
    expect(computeStreaks(dates, TODAY)).toEqual({ current: 3, longest: 3 })
  })

  it('graces an inactive today by counting through yesterday', () => {
    expect(computeStreaks([addDays(TODAY, -1), addDays(TODAY, -2)], TODAY)).toEqual({
      current: 2,
      longest: 2,
    })
  })

  it('drops to zero after a fully missed day', () => {
    expect(computeStreaks([addDays(TODAY, -2), addDays(TODAY, -3)], TODAY)).toEqual({
      current: 0,
      longest: 2,
    })
  })

  it('finds a longest streak longer than the current one', () => {
    const dates = [addDays(TODAY, -10), addDays(TODAY, -9), addDays(TODAY, -8), addDays(TODAY, -5), YESTERDAY]
    // Today is inactive → grace anchors on yesterday; its run is 1 (-2 is absent).
    expect(computeStreaks(dates, TODAY)).toEqual({ current: 1, longest: 3 })
  })

  it('ignores duplicate dates', () => {
    expect(computeStreaks([YESTERDAY, YESTERDAY, TODAY], TODAY).current).toBe(2)
  })
})

describe('heatCells', () => {
  it('builds the standard span ending today, inactive by default', () => {
    const cells = heatCells([], TODAY)
    expect(cells).toHaveLength(HEATMAP_DAYS)
    expect(cells[cells.length - 1].date).toBe(TODAY)
    expect(cells[0].date).toBe(addDays(TODAY, -(HEATMAP_DAYS - 1)))
    expect(cells.every((c) => c.level === 0 && c.actions === 0)).toBe(true)
  })

  it('buckets intensity 1–4 against the busiest day and skips plan-only rows', () => {
    const days = [
      day(addDays(TODAY, -3), { drills: 8 }), // max → level 4
      day(addDays(TODAY, -2), { drills: 2 }), // 25 % → level 1
      day(addDays(TODAY, -1), { drills: 4 }), // 50 % → level 2
      day(TODAY, { newWords: 5 }), // inactive row → level 0
    ]
    const cells = heatCells(days, TODAY)
    expect(cells[cells.length - 4].level).toBe(4)
    expect(cells[cells.length - 3].level).toBe(1)
    expect(cells[cells.length - 2].level).toBe(2)
    expect(cells[cells.length - 1].level).toBe(0)
  })

  it('ignores activity outside the window', () => {
    const cells = heatCells([day(addDays(TODAY, -200), { drills: 9 })], TODAY)
    expect(cells.every((c) => c.level === 0)).toBe(true)
  })

  it('merges duplicate day rows into one cell', () => {
    const date = addDays(TODAY, -1)
    const cells = heatCells([day(date, { drills: 2 }), day(date, { reviews: 3 })], TODAY)
    // 5 merged actions are also the window max → intensity 4; yesterday is the
    // second-to-last cell (the last one is today, inactive).
    expect(cells[cells.length - 2]).toEqual({ date, actions: 5, level: 4 })
    expect(cells[cells.length - 1]).toEqual({ date: TODAY, actions: 0, level: 0 })
  })
})

describe('dueForecast', () => {
  it('returns seven local days starting today with a total', () => {
    const { forecast, total } = dueForecast([], NOW)
    expect(forecast).toHaveLength(FORECAST_DAYS)
    expect(forecast[0].date).toBe(TODAY)
    expect(forecast[6].date).toBe(addDays(TODAY, 6))
    expect(total).toBe(0)
  })

  it('folds overdue cards into today and buckets future ones per day', () => {
    const base = startOfDay(NOW)
    const dueDates = [
      base - 5 * DAY_MS, // overdue → today
      base + 10, // today
      base + DAY_MS + 10, // tomorrow
      base + DAY_MS + 20,
      base + 6 * DAY_MS + 10, // last window day
      base + 7 * DAY_MS + 10, // beyond → dropped
    ]
    const { forecast, total } = dueForecast(dueDates, NOW)
    expect(forecast[0].due).toBe(2)
    expect(forecast[1].due).toBe(2)
    expect(forecast[2].due).toBe(0)
    expect(forecast[6].due).toBe(1)
    expect(total).toBe(5)
  })

  it('classifies day boundaries with DST-proof rounding', () => {
    const base = startOfDay(NOW)
    const { forecast } = dueForecast([base + 3 * DAY_MS + 3_600_000], NOW)
    expect(forecast[3].due).toBe(1)
  })
})

describe('learnedRing', () => {
  it('guards empty accounts with nulls', () => {
    expect(learnedRing({ introduced: 0, review: 0, totalWords: 600 })).toEqual({
      introduced: 0,
      review: 0,
      totalWords: 600,
      matureShare: null,
      coverage: 0,
    })
    expect(learnedRing({ introduced: 0, review: 0, totalWords: 0 }).coverage).toBeNull()
  })

  it('computes mature share and coverage', () => {
    const ring = learnedRing({ introduced: 40, review: 10, totalWords: 200 })
    expect(ring.matureShare).toBeCloseTo(0.25)
    expect(ring.coverage).toBeCloseTo(0.2)
  })
})

describe('computeProgressStats (facade)', () => {
  it('assembles streaks, heat, ring and forecast from raw history', () => {
    const stats = computeProgressStats({
      days: [day(YESTERDAY, { drills: 2 }), day(TODAY, { reviews: 6 })],
      dueDates: [startOfDay(NOW) + DAY_MS + 10],
      vocab: { introduced: 10, review: 4, totalWords: 100 },
      now: NOW,
    })
    expect(stats.today).toBe(TODAY)
    expect(stats.activeDays).toBe(2)
    expect(stats.currentStreak).toBe(2)
    expect(stats.heat).toHaveLength(HEATMAP_DAYS)
    expect(stats.ring.matureShare).toBeCloseTo(0.4)
    expect(stats.forecast[1].due).toBe(1)
    expect(stats.forecastTotal).toBe(1)
  })

  it('reports a neutral zero state for a fresh account', () => {
    const stats = computeProgressStats({
      days: [],
      dueDates: [],
      vocab: { introduced: 0, review: 0, totalWords: 800 },
      now: NOW,
    })
    expect(stats.activeDays).toBe(0)
    expect(stats.currentStreak).toBe(0)
    expect(stats.ring.matureShare).toBeNull()
    expect(stats.forecastTotal).toBe(0)
  })
})
