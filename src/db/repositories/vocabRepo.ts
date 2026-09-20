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

/** Idempotent seeding: checks seed ids in bulk and inserts only missing rows. */
export async function ensureVocabSeeded(): Promise<void> {
  const existing = await db.vocabWords.bulkGet(SEED_VOCAB.map((w) => w.id))
  const missing = SEED_VOCAB.filter((_, i) => existing[i] === undefined)
  if (missing.length > 0) await db.vocabWords.bulkPut([...missing])
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
