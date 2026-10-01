import { buildLessonPlan } from '../../engine/lessonPlanner'
import { dateKey } from '../../engine/text'
import { db } from '../dexie'
import type { LessonLog, UserProfile, VocabScope } from '../types'
import { ensureGrammarSeeded } from './grammarRepo'
import { ensureVocabSeeded } from './vocabRepo'

async function themeBiasFor(profile: UserProfile): Promise<string | null> {
  if (!profile.currentGrammarTopicId) return null
  const topic = await db.grammarTopics.get(profile.currentGrammarTopicId)
  return topic?.relatedVocabTheme ?? null
}

/**
 * Returns today's LessonLog, creating it exactly once per calendar date:
 * the plan holds `dailyWordGoal` unseen words, frequency-ordered and biased
 * toward the current grammar topic's theme. `scope` (M12.9 word focus)
 * restricts the pool of new words. An existing log is returned untouched,
 * so refreshing the page or restarting the app never reshuffles the day.
 */
export async function getOrCreateTodayLog(
  profile: UserProfile,
  scope?: VocabScope | null,
): Promise<LessonLog> {
  await Promise.all([ensureVocabSeeded(), ensureGrammarSeeded()])
  const date = dateKey()
  const id = `lesson-${date}`
  const existing = await db.lessonLogs.get(id)
  if (existing) return existing

  const [words, cards, themeBias] = await Promise.all([
    db.vocabWords.toArray(),
    db.vocabCards.toArray(),
    themeBiasFor(profile),
  ])
  const plan = buildLessonPlan({
    dailyWordGoal: profile.dailyWordGoal,
    words,
    introducedWordIds: new Set(cards.map((c) => c.wordId)),
    themeBias,
    scope,
  })
  const log: LessonLog = {
    id,
    updatedAt: Date.now(),
    date,
    newWordIds: plan.wordIds,
    grammarTopicId: profile.currentGrammarTopicId,
    drillsDone: 0,
  }
  await db.lessonLogs.put(log)
  return log
}

export async function getLog(date: string): Promise<LessonLog | undefined> {
  return db.lessonLogs.get(`lesson-${date}`)
}

/**
 * M12.9: deletes today's log so the next `getOrCreateTodayLog` re-plans with
 * the current word focus. Only called when today's plan came out EMPTY —
 * a plan that already served words stays untouched (per-date immutability).
 */
export async function resetTodayLog(): Promise<void> {
  await db.lessonLogs.delete(`lesson-${dateKey()}`)
}

/** Increments the drill counter after a completed drill. */
export async function recordDrill(logId: string, now: number = Date.now()): Promise<LessonLog> {
  const log = await db.lessonLogs.get(logId)
  if (!log) throw new Error(`LessonLog ${logId} not found`)
  const next: LessonLog = { ...log, drillsDone: log.drillsDone + 1, updatedAt: now }
  await db.lessonLogs.put(next)
  return next
}
