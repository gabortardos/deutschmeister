import { useEffect, useState } from 'react'
import type { GrammarTopic, Scenario } from '../../db/types'
import { getAllTopics, masteryByTopic } from '../../db/repositories/grammarRepo'
import { getAllScenarios } from '../../db/repositories/scenarioRepo'
import { getAllWords, introducedWords } from '../../db/repositories/vocabRepo'
import {
  buildCurriculum,
  computeProgress,
  currentUnit,
  toPathLevel,
  type Curriculum,
  type ProgressContext,
  type UnitProgress,
} from '../../engine/curriculum'
import { useAppStore } from '../../state/store'

/**
 * Shared loader for the M15 roadmap: builds the curriculum from live data and
 * recomputes progress whenever the profile changes (placement, level, goal).
 * RoadmapPage, the Dashboard mini-roadmap and the welcome reveal all read this.
 */
export interface CurriculumSnapshot {
  curriculum: Curriculum
  ctx: ProgressContext
  progress: readonly UnitProgress[]
  current: UnitProgress | null
  topicsById: Map<string, GrammarTopic>
  scenariosById: Map<string, Scenario>
}

export function useCurriculum(): { loading: boolean; snapshot: CurriculumSnapshot | null } {
  const profile = useAppStore((s) => s.profile)
  const [loading, setLoading] = useState(true)
  const [snapshot, setSnapshot] = useState<CurriculumSnapshot | null>(null)

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    void (async () => {
      const [topics, words, scenarios, introduced, mastery] = await Promise.all([
        getAllTopics(),
        getAllWords(),
        getAllScenarios(),
        introducedWords(),
        masteryByTopic(),
      ])
      if (cancelled) return
      const placed = profile.placementResult?.assessedLevel
      const ctx: ProgressContext = {
        introducedWordIds: new Set(introduced.map((w) => w.id)),
        masteredTopicIds: new Set([...mastery.entries()].filter(([, m]) => m.mastered).map(([id]) => id)),
        startLevel: toPathLevel(placed ?? profile.level),
        placedLevel: placed == null ? null : toPathLevel(placed),
      }
      const curriculum = buildCurriculum(topics, words, scenarios)
      const progress = computeProgress(curriculum, ctx)
      setSnapshot({
        curriculum,
        ctx,
        progress,
        current: currentUnit(progress),
        topicsById: new Map(topics.map((t) => [t.id, t])),
        scenariosById: new Map(scenarios.map((s) => [s.id, s])),
      })
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [profile])

  return { loading, snapshot }
}
