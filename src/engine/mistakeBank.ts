/**
 * M11.1 mistakeBank — pure aggregation for the Mistake bank page.
 * No React, no browser APIs, no Dexie: callers pass plain rows, so tests can
 * replay history deterministically.
 *
 * Three mistake sources, one per collector:
 *  - Drill mistakes: grammar drills whose LATEST attempt was wrong. Answering
 *    the drill correctly again clears it from the bank (latest attempt rules),
 *    but wrongCount keeps the full history so "missed 3×" survives.
 *  - Trouble words: SRS cards with lapses > 0 (review misses AND Speak & Listen
 *    misses — both flow through reviewWord → SM-2 failure → lapses++).
 *  - Conversation corrections: tutor mistakes[] flattened off user turns,
 *    newest first, capped.
 */
import type { CardState, CefrLevel, DrillType } from '../db/types'

/** Minimal structural inputs — full rows satisfy these via structural typing. */
export interface AttemptLike {
  itemId: string
  correct: boolean
  userAnswer: string
  at: number
}

export interface DrillItemLike {
  id: string
  ownerId: string
  type: DrillType
  prompt: string
  acceptedAnswers: string[]
  cefr: CefrLevel
}

export interface TopicLike {
  id: string
  title: string
}

export interface CardLike {
  wordId: string
  lapses: number
  dueDate: number
  state: CardState
}

export interface WordLike {
  id: string
  german: string
  article: 'der' | 'die' | 'das' | null
  english: string
  cefr: CefrLevel
}

export interface TurnLike {
  id: string
  sessionId: string
  updatedAt: number
  mistakes: { said: string; corrected: string; type: string }[] | null
}

export interface DrillMistake {
  itemId: string
  prompt: string
  drillType: DrillType
  cefr: CefrLevel
  /** First accepted answer — the "expected" line in the UI. */
  expected: string
  /** What the learner last answered; '(revealed)' means they gave up. */
  given: string
  revealed: boolean
  /** Total wrong attempts ever (correct retries do NOT reset this). */
  wrongCount: number
  /** Timestamp of the latest wrong attempt. */
  lastWrongAt: number
  /** Owning grammar topic ( ownerId), when the topic row still exists. */
  topicId: string | null
  topicTitle: string | null
}

export interface TroubleWord {
  wordId: string
  german: string
  article: 'der' | 'die' | 'das' | null
  english: string
  cefr: CefrLevel
  lapses: number
  dueDate: number
  state: CardState
}

export interface ConvCorrection {
  said: string
  corrected: string
  type: string
  at: number
  sessionId: string
}

/**
 * Active drill mistakes = items whose LATEST attempt is wrong, newest first.
 * Attempts with no matching drill item (deleted LLM drills) are skipped, and
 * so are items with zero attempts.
 */
export function collectDrillMistakes(
  attempts: readonly AttemptLike[],
  items: readonly DrillItemLike[],
  topics: readonly TopicLike[],
): DrillMistake[] {
  const byId = new Map(items.map((i) => [i.id, i]))
  // Latest attempt per item (at breaks ties, then last-in-list for stability).
  const latest = new Map<string, AttemptLike>()
  const wrongCounts = new Map<string, number>()
  const lastWrongAt = new Map<string, number>()
  for (const a of attempts) {
    const prev = latest.get(a.itemId)
    if (prev === undefined || a.at >= prev.at) latest.set(a.itemId, a)
    if (!a.correct) {
      wrongCounts.set(a.itemId, (wrongCounts.get(a.itemId) ?? 0) + 1)
      const w = lastWrongAt.get(a.itemId)
      if (w === undefined || a.at >= w) lastWrongAt.set(a.itemId, a.at)
    }
  }
  const topicById = new Map(topics.map((t) => [t.id, t]))
  const out: DrillMistake[] = []
  for (const [itemId, attempt] of latest) {
    if (attempt.correct) continue
    const item = byId.get(itemId)
    if (!item) continue
    const topic = topicById.get(item.ownerId) ?? null
    out.push({
      itemId,
      prompt: item.prompt,
      drillType: item.type,
      cefr: item.cefr,
      expected: item.acceptedAnswers[0] ?? '',
      given: attempt.userAnswer.trim(),
      revealed: attempt.userAnswer.trim() === '(revealed)',
      wrongCount: wrongCounts.get(itemId) ?? 1,
      lastWrongAt: lastWrongAt.get(itemId) ?? attempt.at,
      topicId: topic ? topic.id : null,
      topicTitle: topic ? topic.title : null,
    })
  }
  out.sort((a, b) => b.lastWrongAt - a.lastWrongAt || a.itemId.localeCompare(b.itemId))
  return out
}

/** Words with at least one SRS lapse, most-lapsed first (then A→Z German). */
export function collectTroubleWords(
  cards: readonly CardLike[],
  words: readonly WordLike[],
): TroubleWord[] {
  const wordById = new Map(words.map((w) => [w.id, w]))
  const out: TroubleWord[] = []
  for (const card of cards) {
    if (card.lapses <= 0) continue
    const word = wordById.get(card.wordId)
    if (!word) continue
    out.push({
      wordId: card.wordId,
      german: word.german,
      article: word.article,
      english: word.english,
      cefr: word.cefr,
      lapses: card.lapses,
      dueDate: card.dueDate,
      state: card.state,
    })
  }
  out.sort((a, b) => b.lapses - a.lapses || a.german.localeCompare(b.german, 'de'))
  return out
}

/**
 * Tutor corrections flattened off conversation turns, newest first, capped.
 * Only turns that actually carry mistakes contribute (tutor turns never do).
 */
export function collectConversationMistakes(
  turns: readonly TurnLike[],
  limit = 20,
): ConvCorrection[] {
  const flat: ConvCorrection[] = []
  for (const turn of turns) {
    if (!turn.mistakes) continue
    for (const m of turn.mistakes) {
      if (!m.said.trim() || !m.corrected.trim()) continue
      flat.push({ said: m.said, corrected: m.corrected, type: m.type, at: turn.updatedAt, sessionId: turn.sessionId })
    }
  }
  flat.sort((a, b) => b.at - a.at)
  return flat.slice(0, Math.max(0, limit))
}
