import type { VocabCard } from '../db/types'
import { DAY_MS, startOfDay } from './text'

export const MIN_EASE = 1.3

/** Creates the initial SRS state for a word (not yet persisted). */
export function newCard(wordId: string, now: number = Date.now()): VocabCard {
  return {
    id: `card-${wordId}`,
    updatedAt: now,
    wordId,
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueDate: now,
    lapses: 0,
    state: 'new',
    introducedDate: now,
  }
}

/**
 * SM-2 spaced repetition. Pure: returns the next card state without mutating.
 *  - quality 0–2 (fail): repetitions reset, ease drops, card is relearned next day.
 *  - quality 3–5: EF' = EF + (0.1 − (5−q)(0.08 + (5−q)·0.02)), clamped at ≥ 1.3;
 *    intervals I(1)=1d, I(2)=6d, I(n)=round(I(n−1)·EF').
 *  - state: new → (first success) learning → review once interval ≥ 21 days.
 */
export function reviewCard(card: VocabCard, quality: number, now: number = Date.now()): VocabCard {
  const q = Math.max(0, Math.min(5, Math.round(quality)))
  const next: VocabCard = { ...card, updatedAt: now }

  if (q < 3) {
    next.repetitions = 0
    next.intervalDays = 0
    next.lapses = card.lapses + 1
    const ef = Math.max(MIN_EASE, card.ease - 0.2)
    next.ease = Math.round(ef * 1000) / 1000
    next.dueDate = startOfDay(now) + DAY_MS // relearn same/next day
    next.state = 'learning'
    return next
  }

  const efRaw = card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const ef = Math.max(MIN_EASE, efRaw)
  next.ease = Math.round(ef * 1000) / 1000
  next.repetitions = card.repetitions + 1

  const interval =
    next.repetitions === 1 ? 1 : next.repetitions === 2 ? 6 : Math.max(1, Math.round(card.intervalDays * ef))
  next.intervalDays = interval
  next.dueDate = startOfDay(now) + interval * DAY_MS
  next.state = interval >= 21 ? 'review' : 'learning'
  return next
}

/** A card is due when its dueDate has passed and it has started learning. */
export function isDue(card: VocabCard, now: number = Date.now()): boolean {
  return card.state !== 'new' && card.dueDate <= now
}

/** Human-friendly preview of the next interval, used in drill UI. */
export function previewInterval(card: VocabCard, quality: number, now: number = Date.now()): string {
  const next = reviewCard(card, quality, now)
  if (next.dueDate <= now) return 'today'
  const days = Math.max(1, Math.round((next.dueDate - now) / DAY_MS))
  return days === 1 ? 'tomorrow' : `in ${days} days`
}
