/**
 * M10.1 progressStats — pure learning-progress math for the dashboard stats zone.
 * No React, no browser APIs, no Dexie: callers pass plain rows, so tests can
 * replay history deterministically and a future `src/engine/engagement.ts`
 * (Dormant option #2 — XP/badges/streak flames) can decorate every number here
 * without touching the UI. Streaks ARE computed (retroactively, from logs) but
 * the UI deliberately shows only neutral facts (active days); gamification
 * stays dormant until the owner activates it.
 */
import { DAY_MS, dateKey, startOfDay } from './text'

/** One local calendar day of genuine learner activity (LessonLogs are NOT used:
 *  their newWordIds/grammarTopicId are stamped when the plan is CREATED on app
 *  open, not when the learner actually studies). Sources: drillAttempts.at,
 *  vocabCards.updatedAt (every review touches it), conversationSessions.startedAt. */
export interface ActivityDay {
  /** YYYY-MM-DD, local timezone. */
  date: string
  /** Words first introduced that day (vocabCards.introducedDate bucket). */
  newWords: number
  /** SRS card touches that day (introductions count as touches too). */
  reviews: number
  /** Grammar/practice drill attempts that day. */
  drills: number
  /** Conversation sessions started that day. */
  conversations: number
}

export interface HeatCell {
  date: string
  /** reviews + drills + conversations that day (newWords already included via reviews). */
  actions: number
  /** 0 = inactive, 1–4 = relative intensity quartile. */
  level: 0 | 1 | 2 | 3 | 4
}

export interface DueDay {
  date: string
  due: number
}

export interface RingInfo {
  introduced: number
  review: number
  totalWords: number
  /** Mature (state=review) share of introduced words, 0–1; null before the first word. */
  matureShare: number | null
  /** Introduced share of the whole word bank, 0–1; null with an empty bank. */
  coverage: number | null
}

export interface ProgressStats {
  today: string
  activeDays: number
  currentStreak: number
  longestStreak: number
  heat: readonly HeatCell[]
  ring: RingInfo
  forecast: readonly DueDay[]
  forecastTotal: number
}

export const HEATMAP_DAYS = 84 // 12 weeks
export const FORECAST_DAYS = 7

/** Local-calendar-day key for an epoch-ms timestamp. */
export function keyOfDay(t: number): string {
  return dateKey(new Date(t))
}

/** date + n days as a YYYY-MM-DD key (manual parse — never Date('YYYY-MM-DD'),
 *  which is UTC midnight and shifts days in some timezones). */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const shifted = new Date(y, m - 1, d + n)
  return dateKey(shifted)
}

/** Total learner actions on a day (drills + reviews + conversations). */
export function dayActions(day: ActivityDay): number {
  return day.reviews + day.drills + day.conversations
}

export function isActiveDay(day: ActivityDay): boolean {
  return dayActions(day) > 0
}

/**
 * Consecutive-active-day math over sorted-agnostic date keys.
 * `current` includes today when active; otherwise it still counts through
 * yesterday (a streak must not read 0 every morning before studying), and is 0
 * once a full day was missed.
 */
export function computeStreaks(
  activeDates: readonly string[],
  today: string,
): { current: number; longest: number } {
  const unique = [...new Set(activeDates)].sort()
  if (unique.length === 0) return { current: 0, longest: 0 }

  // Longest run over all history.
  let longest = 1
  let run = 1
  for (let i = 1; i < unique.length; i++) {
    run = addDays(unique[i - 1], 1) === unique[i] ? run + 1 : 1
    longest = Math.max(longest, run)
  }

  // Current run: walk back from today (grace) or yesterday.
  let anchor = today
  if (!unique.includes(anchor)) anchor = addDays(today, -1)
  if (!unique.includes(anchor)) return { current: 0, longest }

  let current = 0
  let cursor = anchor
  while (unique.includes(cursor)) {
    current += 1
    cursor = addDays(cursor, -1)
  }
  return { current, longest }
}

/** Heatmap cells: `span` consecutive days ending on `today`, intensity 0–4. */
export function heatCells(
  days: readonly ActivityDay[],
  today: string,
  span: number = HEATMAP_DAYS,
): HeatCell[] {
  const actionsByDate = new Map<string, number>()
  for (const day of days) {
    if (!isActiveDay(day)) continue // app-open-only days must not light up
    actionsByDate.set(day.date, (actionsByDate.get(day.date) ?? 0) + dayActions(day))
  }

  const dates: string[] = []
  for (let i = span - 1; i >= 0; i--) dates.push(addDays(today, -i))

  const max = Math.max(0, ...dates.map((d) => actionsByDate.get(d) ?? 0))
  return dates.map((date) => {
    const actions = actionsByDate.get(date) ?? 0
    const level: HeatCell['level'] =
      actions === 0 || max === 0
        ? 0
        : (Math.min(4, Math.max(1, Math.ceil((actions / max) * 4))) as HeatCell['level'])
    return { date, actions, level }
  })
}

/**
 * Review load for the next `days` local days, today first. Cards already
 * overdue (dueDate in the past) fold into today — that's when they'll be done.
 * Math.round on the day index absorbs DST's ±1 h so a day never buckets wrong.
 */
export function dueForecast(
  dueDates: readonly number[],
  now: number,
  days: number = FORECAST_DAYS,
): { forecast: DueDay[]; total: number } {
  const todayStart = startOfDay(now)
  const forecast: DueDay[] = []
  for (let i = 0; i < days; i++) forecast.push({ date: addDays(keyOfDay(now), i), due: 0 })

  for (const t of dueDates) {
    if (t >= todayStart + days * DAY_MS) continue // beyond the window
    const idx =
      t <= todayStart
        ? 0
        : Math.min(days - 1, Math.max(0, Math.round((startOfDay(t) - todayStart) / DAY_MS)))
    forecast[idx].due += 1
  }
  return { forecast, total: forecast.reduce((sum, d) => sum + d.due, 0) }
}

/** Ring math with null guards for fresh accounts. */
export function learnedRing(vocab: {
  introduced: number
  review: number
  totalWords: number
}): RingInfo {
  return {
    ...vocab,
    matureShare: vocab.introduced > 0 ? Math.min(1, vocab.review / vocab.introduced) : null,
    coverage: vocab.totalWords > 0 ? Math.min(1, vocab.introduced / vocab.totalWords) : null,
  }
}

/** Facade the dashboard (and a future engagement.ts) consumes — one call, all stats. */
export function computeProgressStats(input: {
  days: readonly ActivityDay[]
  dueDates: readonly number[]
  vocab: { introduced: number; review: number; totalWords: number }
  now?: number
}): ProgressStats {
  const now = input.now ?? Date.now()
  const today = keyOfDay(now)
  const active = input.days.filter(isActiveDay)
  const streaks = computeStreaks(
    active.map((d) => d.date),
    today,
  )
  const { forecast, total } = dueForecast(input.dueDates, now)
  return {
    today,
    activeDays: active.length,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    heat: heatCells(input.days, today),
    ring: learnedRing(input.vocab),
    forecast,
    forecastTotal: total,
  }
}
