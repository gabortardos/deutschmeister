import { getDrillsForTopic, getTopic, saveDrills } from '../../db/repositories/grammarRepo'
import { generateDrillItems, type LlmServiceDeps } from '../../llm/services'

/**
 * Generates n LLM drills for a grammar topic and saves the ones whose prompt
 * does not already exist for that topic. Returns the number saved.
 * The current drill count doubles as the cache "variant", so repeated clicks
 * keep producing fresh batches while accidental double-clicks stay deduped.
 */
export async function generateAndSaveDrills(
  deps: LlmServiceDeps,
  topicId: string,
  n = 5,
): Promise<number> {
  const topic = await getTopic(topicId)
  if (!topic) throw new Error('Topic not found.')
  const existing = await getDrillsForTopic(topicId)
  const generated = await generateDrillItems(deps, {
    topic: {
      id: topic.id,
      title: topic.title,
      cefr: topic.cefr,
      focus: topic.focus,
      explanationMd: topic.explanationMd,
    },
    n,
    variant: existing.length,
  })
  const fresh = generated.filter((g) => !existing.some((e) => e.prompt.trim() === g.prompt.trim()))
  if (fresh.length > 0) await saveDrills(fresh)
  return fresh.length
}
