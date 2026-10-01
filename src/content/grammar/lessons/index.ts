import { A1_PRAESENS_LESSON } from './a1-praesens'
import { A2_ADJEKTIV_LESSON } from './a2-adjektivendungen'
import { B1_PERFEKT_LESSON } from './b1-perfekt-praeteritum'
import type { Lesson } from './types'

export type { Lesson, LessonSection, LessonTable, LessonMistake, LessonCheckpoint } from './types'

/** M14 pilot lessons — 3 topics, ordered by curriculum position (A1 → B1). */
export const SEED_LESSONS: readonly Lesson[] = [A1_PRAESENS_LESSON, A2_ADJEKTIV_LESSON, B1_PERFEKT_LESSON]

const BY_TOPIC = new Map<string, Lesson>(SEED_LESSONS.map((l) => [l.topicId, l]))

/** Static lookup — lessons ship in the bundle, no Dexie involved. */
export function lessonForTopic(topicId: string): Lesson | undefined {
  return BY_TOPIC.get(topicId)
}
