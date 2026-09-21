import type { CefrLevel, DrillItem, GrammarTopic } from '../../db/types'
import { A1_TOPICS } from './a1'
import { A2_TOPICS } from './a2'
import { B1_TOPICS } from './b1'
import { B2_TOPICS } from './b2'
import type { SeedTopic } from './types'

/** Deterministic build stamp for seed rows (never changes per release). */
const SEED_TS = Date.UTC(2026, 8, 20, 12, 0, 0)

function topicId(cefr: CefrLevel, index: number): string {
  return `g-${cefr.toLowerCase()}-${String(index + 1).padStart(2, '0')}`
}

function buildTopic(topic: SeedTopic, order: number, indexInLevel: number): GrammarTopic {
  return {
    id: topicId(topic.cefr, indexInLevel),
    updatedAt: SEED_TS,
    title: topic.title,
    cefr: topic.cefr,
    order,
    explanationMd: topic.explanationMd,
    focus: topic.focus,
    relatedVocabTheme: topic.relatedVocabTheme,
  }
}

function buildDrill(
  topic: SeedTopic,
  topicBuiltId: string,
  drillIndex: number,
): DrillItem {
  const drill = topic.drills[drillIndex]
  if (drill === undefined) throw new Error(`Missing drill ${drillIndex} in ${topic.key}`)
  return {
    id: `d-${topicBuiltId}-${drillIndex + 1}`,
    updatedAt: SEED_TS,
    ownerId: topicBuiltId,
    type: drill.type,
    prompt: drill.prompt,
    promptData: drill.promptData ?? null,
    acceptedAnswers: [...drill.acceptedAnswers],
    cefr: topic.cefr,
    source: 'seed',
    validated: true,
  }
}

const LEVELS: ReadonlyArray<{ cefr: CefrLevel; topics: readonly SeedTopic[] }> = [
  { cefr: 'A1', topics: A1_TOPICS },
  { cefr: 'A2', topics: A2_TOPICS },
  { cefr: 'B1', topics: B1_TOPICS },
  { cefr: 'B2', topics: B2_TOPICS },
]

const topics: GrammarTopic[] = []
const drills: DrillItem[] = []
let order = 0
for (const level of LEVELS) {
  level.topics.forEach((topic, i) => {
    if (topic.cefr !== level.cefr) throw new Error(`${topic.key} tagged ${topic.cefr}, filed under ${level.cefr}`)
    order += 1
    const id = topicId(level.cefr, i)
    topics.push(buildTopic(topic, order, i))
    topic.drills.forEach((_, d) => drills.push(buildDrill(topic, id, d)))
  })
}

/** Full grammar syllabus (50 topics, A1–B2), ordered by curriculum position. */
export const SEED_GRAMMAR_TOPICS: readonly GrammarTopic[] = topics

/** All seed drill items (≥6 per topic), ids deterministic per topic. */
export const SEED_GRAMMAR_DRILLS: readonly DrillItem[] = drills

export const SEED_GRAMMAR_COUNTS: Readonly<Record<CefrLevel, number>> = {
  A1: A1_TOPICS.length,
  A2: A2_TOPICS.length,
  B1: B1_TOPICS.length,
  B2: B2_TOPICS.length,
  C1: 0,
  C2: 0,
}

/** Topic keys by level — used by content integrity tests. */
export const SEED_TOPIC_KEYS: readonly string[] = LEVELS.flatMap((l) => l.topics.map((t) => t.key))
