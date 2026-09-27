import { keyOfDay, type ActivityDay } from '../../engine/progressStats'
import { db } from '../dexie'

/**
 * Aggregates GENUINE learner activity by local calendar day for the M10.1
 * stats zone. LessonLogs are deliberately not used: their newWordIds and
 * grammarTopicId are stamped when the daily plan is created (i.e. on app open),
 * not when the learner actually studies. Real activity signals are:
 *  - drillAttempts.at          (grammar + speak/listen drills)
 *  - vocabCards.updatedAt      (every SRS review touches it; sync bulkPut keeps
 *                               original timestamps, so cloud pulls don't inflate)
 *  - vocabCards.introducedDate (first touch of a word)
 *  - conversationSessions.startedAt
 */
export async function activityDays(): Promise<ActivityDay[]> {
  const [attempts, cards, sessions] = await Promise.all([
    db.drillAttempts.toArray(),
    db.vocabCards.toArray(),
    db.conversationSessions.toArray(),
  ])

  const byDate = new Map<string, ActivityDay>()
  const cell = (date: string): ActivityDay => {
    let row = byDate.get(date)
    if (!row) {
      row = { date, newWords: 0, reviews: 0, drills: 0, conversations: 0 }
      byDate.set(date, row)
    }
    return row
  }

  for (const card of cards) {
    cell(keyOfDay(card.introducedDate)).newWords += 1
    cell(keyOfDay(card.updatedAt)).reviews += 1
  }
  for (const attempt of attempts) cell(keyOfDay(attempt.at)).drills += 1
  for (const session of sessions) cell(keyOfDay(session.startedAt)).conversations += 1

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/** Due dates of every started card (state 'new' excluded) — forecast input. */
export async function cardDueDates(): Promise<number[]> {
  const cards = await db.vocabCards.where('state').notEqual('new').toArray()
  return cards.map((c) => c.dueDate)
}