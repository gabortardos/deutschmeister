import { SEED_VOCAB } from '../../content/vocab'
import { isDue, newCard, reviewCard } from '../../engine/srs'
import { db } from '../dexie'
import type { VocabCard, VocabWord } from '../types'

export interface VocabStats {
  totalWords: number
  introduced: number
  learning: number
  review: number
  dueNow: number
}

/**
 * Idempotent seeding: upserts the full seed corpus. Ids are append-stable, so
 * existing rows keep their identity while releases extend the bank and refresh
 * frequencyRanks (ranks are derived from corpus position, see content/vocab).
 */
export async function ensureVocabSeeded(): Promise<void> {
  await db.vocabWords.bulkPut([...SEED_VOCAB])
}

export async function getWord(id: string): Promise<VocabWord | undefined> {
  return db.vocabWords.get(id)
}

/** Words in the given order; silently drops unknown ids. */
export async function getWords(wordIds: readonly string[]): Promise<VocabWord[]> {
  const found = await db.vocabWords.bulkGet([...wordIds])
  const byId = new Map<string, VocabWord>()
  for (const w of found) if (w) byId.set(w.id, w)
  return wordIds.map((id) => byId.get(id)).filter((w): w is VocabWord => Boolean(w))
}

export async function getAllWords(): Promise<VocabWord[]> {
  return db.vocabWords.toArray()
}

/** Words that already have an SRS card (i.e. have been introduced), rank-ordered. */
export async function introducedWords(): Promise<VocabWord[]> {
  const cards = await db.vocabCards.toArray()
  return (await getWords(cards.map((c) => c.wordId))).sort((a, b) => a.frequencyRank - b.frequencyRank)
}

/**
 * The next unseen words in frequency order — powers "learn extra words today".
 * Custom words (rank 999999) come last, after the seed corpus.
 */
export async function nextUnseenWords(count: number): Promise<VocabWord[]> {
  const [cards, all] = await Promise.all([db.vocabCards.toArray(), db.vocabWords.toArray()])
  const introduced = new Set(cards.map((c) => c.wordId))
  return all
    .filter((w) => !introduced.has(w.id))
    .sort((a, b) => a.frequencyRank - b.frequencyRank)
    .slice(0, Math.max(1, Math.round(count)))
}

export async function getCards(wordIds: readonly string[]): Promise<VocabCard[]> {
  if (wordIds.length === 0) return []
  return db.vocabCards.where('wordId').anyOf([...wordIds]).toArray()
}

/** Cards whose dueDate has passed and that have started learning, oldest first. */
export async function dueCards(now: number = Date.now()): Promise<VocabCard[]> {
  const due = await db.vocabCards.where('dueDate').belowOrEqual(now).toArray()
  return due.filter((c) => isDue(c, now)).sort((a, b) => a.dueDate - b.dueDate)
}

/** Applies an SM-2 review; creates the card on the first review of a new word. */
export async function reviewWord(
  wordId: string,
  quality: number,
  now: number = Date.now(),
): Promise<VocabCard> {
  const existing = await db.vocabCards.get(`card-${wordId}`)
  const base = existing ?? newCard(wordId, now)
  const next = reviewCard(base, quality, now)
  await db.vocabCards.put(next)
  return next
}

/** Marks a word as already known (perfect review) — used by grammar drills. */
export async function markWordKnown(wordId: string, now: number = Date.now()): Promise<VocabCard> {
  return reviewWord(wordId, 5, now)
}

export async function vocabStats(now: number = Date.now()): Promise<VocabStats> {
  const [totalWords, cards] = await Promise.all([db.vocabWords.count(), db.vocabCards.toArray()])
  let learning = 0
  let review = 0
  let dueNow = 0
  for (const c of cards) {
    if (c.state === 'learning') learning += 1
    else if (c.state === 'review') review += 1
    if (isDue(c, now)) dueNow += 1
  }
  return { totalWords, introduced: cards.length, learning, review, dueNow }
}
