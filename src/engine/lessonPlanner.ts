import type { VocabScope, VocabWord } from '../db/types'
import { dateKey } from './text'
import { wordInScope } from './vocabScope'

export interface LessonPlanInput {
  date?: string // YYYY-MM-DD (defaults to today)
  dailyWordGoal: number
  words: readonly VocabWord[]
  /** Word ids that already have a SRS card (i.e. have been introduced). */
  introducedWordIds: ReadonlySet<string>
  /** Theme of the current grammar topic — matching words are preferred. */
  themeBias?: string | null
  /** M12.9 word focus — null/empty = whole corpus (see engine/vocabScope). */
  scope?: VocabScope | null
}

export interface LessonPlan {
  date: string
  wordIds: string[]
}

/**
 * Daily lesson planner: `dailyWordGoal` unseen words, ordered by frequencyRank,
 * biased toward the current grammar topic's theme. Pure and deterministic;
 * persistence makes it idempotent per calendar date (repo layer keeps an existing
 * LessonLog for the day untouched).
 */
export function buildLessonPlan(input: LessonPlanInput): LessonPlan {
  const date = input.date ?? dateKey()
  const goal = Math.max(1, Math.min(10, Math.round(input.dailyWordGoal)))

  const fresh = input.words.filter(
    (w) => !input.introducedWordIds.has(w.id) && wordInScope(w, input.scope),
  )
  fresh.sort((a, b) => a.frequencyRank - b.frequencyRank || a.german.localeCompare(b.german, 'de'))

  const bias = input.themeBias?.trim() ?? ''
  const ordered =
    bias.length > 0
      ? [...fresh.filter((w) => w.theme === bias), ...fresh.filter((w) => w.theme !== bias)]
      : fresh

  return { date, wordIds: ordered.slice(0, goal).map((w) => w.id) }
}

export interface ReplanInput extends LessonPlanInput {
  /** Today's queue before the word-focus change (M12.9.1). */
  previousQueueIds: readonly string[]
}

/**
 * M12.9.1: rebuild of TODAY's queue after a word-focus change — the filter is
 * authoritative immediately, not from tomorrow. Words from the old queue that
 * were already studied today (they have a card) stay in the queue and keep
 * counting toward the daily goal; only the remaining slots are topped up with
 * fresh in-scope words. Studied words are skipped by the session runner, so
 * nothing is ever double-served.
 */
export function replanTodayQueue(input: ReplanInput): LessonPlan {
  const date = input.date ?? dateKey()
  const goal = Math.max(1, Math.min(10, Math.round(input.dailyWordGoal)))
  const studied = input.previousQueueIds.filter((id) => input.introducedWordIds.has(id))
  const remaining = goal - studied.length
  const fresh =
    remaining > 0 ? buildLessonPlan({ ...input, date, dailyWordGoal: remaining }).wordIds : []
  return { date, wordIds: [...studied, ...fresh] }
}
