import { SEED_GRAMMAR_DRILLS, SEED_GRAMMAR_TOPICS } from '../../content/grammar'
import { computeMastery, type MasteryInfo } from '../../engine/mastery'
import { CEFR_LEVELS, type CefrLevel } from '../types'
import type { DrillAttempt, DrillItem, GrammarTopic } from '../types'
import { newId } from '../../utils/id'
import { db } from '../dexie'

/** Idempotent seeding: checks seed ids in bulk and inserts only missing rows. */
export async function ensureGrammarSeeded(): Promise<void> {
  const [existingTopics, existingDrills] = await Promise.all([
    db.grammarTopics.bulkGet(SEED_GRAMMAR_TOPICS.map((t) => t.id)),
    db.drillItems.bulkGet(SEED_GRAMMAR_DRILLS.map((d) => d.id)),
  ])
  const missingTopics = SEED_GRAMMAR_TOPICS.filter((_, i) => existingTopics[i] === undefined)
  const missingDrills = SEED_GRAMMAR_DRILLS.filter((_, i) => existingDrills[i] === undefined)
  if (missingTopics.length > 0) await db.grammarTopics.bulkPut([...missingTopics])
  if (missingDrills.length > 0) await db.drillItems.bulkPut([...missingDrills])
}

export async function getTopic(id: string): Promise<GrammarTopic | undefined> {
  return db.grammarTopics.get(id)
}

/** All topics in syllabus order (order field, then id for stability). */
export async function getAllTopics(): Promise<GrammarTopic[]> {
  const topics = await db.grammarTopics.toArray()
  return topics.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
}

export async function getTopicsByLevel(cefr: CefrLevel): Promise<GrammarTopic[]> {
  const topics = await db.grammarTopics.where('cefr').equals(cefr).toArray()
  return topics.sort((a, b) => a.order - b.order)
}

export async function getDrillsForTopic(topicId: string): Promise<DrillItem[]> {
  return db.drillItems.where('ownerId').equals(topicId).toArray()
}

/** Records an attempt and returns it (fires-and-forget friendly). */
export async function recordDrillAttempt(
  itemId: string,
  correct: boolean,
  userAnswer: string,
  at: number = Date.now(),
): Promise<DrillAttempt> {
  const attempt: DrillAttempt = {
    id: newId(),
    updatedAt: at,
    itemId,
    correct,
    userAnswer,
    transcript: null,
    at,
  }
  await db.drillAttempts.put(attempt)
  return attempt
}

/** Attempt results per drill item, oldest first. */
export async function attemptResultsByItem(
  itemIds: readonly string[],
): Promise<Map<string, boolean[]>> {
  const map = new Map<string, boolean[]>()
  if (itemIds.length === 0) return map
  const attempts = await db.drillAttempts.where('itemId').anyOf([...itemIds]).toArray()
  attempts.sort((a, b) => a.at - b.at)
  for (const a of attempts) {
    const list = map.get(a.itemId) ?? []
    list.push(a.correct)
    map.set(a.itemId, list)
  }
  return map
}

/** Mastery info for every topic, keyed by topic id. */
export async function masteryByTopic(): Promise<Map<string, MasteryInfo>> {
  const topics = await getAllTopics()
  const drillLists = await Promise.all(topics.map((t) => getDrillsForTopic(t.id)))
  const itemIds = drillLists.flat().map((d) => d.id)
  const byItem = await attemptResultsByItem(itemIds)
  const result = new Map<string, MasteryInfo>()
  topics.forEach((topic, i) => {
    const results = (drillLists[i] ?? []).flatMap((d) => byItem.get(d.id) ?? [])
    result.set(topic.id, computeMastery(results))
  })
  return result
}

/**
 * The next topic to study: the first not-yet-mastered topic at or below the
 * learner's level (CEFR ladder order), or the first above-level topic when
 * everything up to the level is mastered. Null only when the syllabus is empty.
 */
export async function nextTopic(level: CefrLevel): Promise<GrammarTopic | null> {
  const [topics, mastery] = await Promise.all([getAllTopics(), masteryByTopic()])
  if (topics.length === 0) return null
  const levelIndex = CEFR_LEVELS.indexOf(level)
  const rank = (t: GrammarTopic) => {
    const idx = CEFR_LEVELS.indexOf(t.cefr)
    return idx <= levelIndex ? 0 : 1 // at/below level first, then above
  }
  const candidates = topics
    .filter((t) => !(mastery.get(t.id)?.mastered ?? false))
    .sort((a, b) => rank(a) - rank(b) || a.order - b.order)
  return candidates[0] ?? topics[topics.length - 1] ?? null
}
