import { CEFR_LEVELS, type CefrLevel, type GrammarTopic, type Scenario, type VocabWord } from '../db/types'

/**
 * M15 curriculum engine — the deterministic syllabus graph under `#/roadmap`.
 *
 * The guided path covers A1–B2 (the placement ladder). Grammar topics pair up
 * into ordered learning units; each unit carries its vocab theme cluster and a
 * suggested conversation scenario, and every level ends in a milestone check
 * (mastery gate that reuses the placement quiz as its interactive form).
 *
 * Pure module — no React, no browser APIs, no Date.now() inside builders.
 * Append-stable: unit ids are positional (`u-a1-1`, `u-a1-m`), so later seed
 * content only ever appends units; nothing is persisted per unit anyway — the
 * roadmap is recomputed from live progress data on every render.
 */

/** Levels of the guided path (C-levels stay free exploration). */
export type PathLevel = Extract<CefrLevel, 'A1' | 'A2' | 'B1' | 'B2'>
export const PATH_LEVELS: readonly PathLevel[] = ['A1', 'A2', 'B1', 'B2']

export type UnitKind = 'learning' | 'milestone'
export type UnitStatus = 'done' | 'current' | 'locked'

/** A learning unit is complete once its topics are mastered AND ≥ 80 % of its
 *  theme cluster is introduced (a cluster is empty when the topic has no theme). */
export const UNIT_WORD_RATIO = 0.8

export interface CurriculumUnit {
  id: string
  level: PathLevel
  /** 1-based position among the level's units, milestone included. */
  index: number
  kind: UnitKind
  title: string
  /** 1–2 grammar topics (learning unit) or every topic of the level (milestone). */
  topicIds: readonly string[]
  /** Theme cluster this unit teaches into (null = none attached). */
  vocabTheme: string | null
  /** Theme-cluster words at this level, frequency order. */
  wordIds: readonly string[]
  /** Suggested conversation scenario (learning units only). */
  scenarioId: string | null
}

export interface Curriculum {
  units: readonly CurriculumUnit[]
  /** Every seed word per path level, frequency order (clusters are subsets). */
  levelWordIds: Readonly<Record<PathLevel, readonly string[]>>
  /** Every topic id per path level, syllabus order. */
  levelTopicIds: Readonly<Record<PathLevel, readonly string[]>>
}

export interface ProgressContext {
  /** Word ids that already have an SRS card (i.e. were introduced). */
  introducedWordIds: ReadonlySet<string>
  /** Topic ids that pass the mastery gate (engine/mastery). */
  masteredTopicIds: ReadonlySet<string>
  /** First level the roadmap should treat as live work (placement or profile). */
  startLevel: PathLevel
  /** Placement assessment — everything strictly below it is covered; a milestone
   *  at a level strictly below it counts as passed. Null when never taken. */
  placedLevel: PathLevel | null
}

export interface UnitProgress {
  unit: CurriculumUnit
  status: UnitStatus
  /** Done because placement placed the learner above the level (not by study). */
  placedOver: boolean
  wordsTotal: number
  wordsIntroduced: number
  topicsTotal: number
  topicsDone: number
  /** 0–1 share of the unit's requirements met (placed-over units report 1). */
  fraction: number
  complete: boolean
}

/** Clamp any CEFR level onto the path (C-levels cap at B2). */
export function toPathLevel(cefr: CefrLevel): PathLevel {
  const idx = CEFR_LEVELS.indexOf(cefr)
  const clamped = Math.min(Math.max(idx, 0), PATH_LEVELS.length - 1)
  return PATH_LEVELS[clamped]
}

function pathIndex(level: PathLevel): number {
  return PATH_LEVELS.indexOf(level)
}

/**
 * Build the syllabus graph. Topics are chunked two at a time in syllabus
 * (`order`) sequence; the unit's theme cluster comes from the FIRST topic's
 * `relatedVocabTheme`; scenarios cycle deterministically over the level's
 * scenarios. Every level ends with a milestone unit covering all its topics.
 */
export function buildCurriculum(
  topics: readonly GrammarTopic[],
  words: readonly VocabWord[],
  scenarios: readonly Scenario[],
): Curriculum {
  const units: CurriculumUnit[] = []
  const levelWordIds = {} as Record<PathLevel, readonly string[]>
  const levelTopicIds = {} as Record<PathLevel, readonly string[]>

  for (const level of PATH_LEVELS) {
    const levelTopics = topics
      .filter((t) => t.cefr === level)
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    const levelScenarios = scenarios
      .filter((s) => s.cefr === level)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((s) => s.id)
    const levelWords = words
      .filter((w) => w.cefr === level)
      .sort((a, b) => a.frequencyRank - b.frequencyRank || a.german.localeCompare(b.german, 'de'))
    levelWordIds[level] = levelWords.map((w) => w.id)
    levelTopicIds[level] = levelTopics.map((t) => t.id)

    let index = 1
    for (let i = 0; i < levelTopics.length; i += 2) {
      const pair = levelTopics.slice(i, i + 2)
      const first = pair[0]
      if (first === undefined) continue
      const theme = first.relatedVocabTheme ?? null
      units.push({
        id: `u-${level.toLowerCase()}-${index}`,
        level,
        index,
        kind: 'learning',
        title: pair.map((t) => t.title).join(' + '),
        topicIds: pair.map((t) => t.id),
        vocabTheme: theme,
        wordIds: theme === null ? [] : levelWords.filter((w) => w.theme === theme).map((w) => w.id),
        scenarioId: levelScenarios.length > 0 ? levelScenarios[(index - 1) % levelScenarios.length] : null,
      })
      index += 1
    }

    units.push({
      id: `u-${level.toLowerCase()}-m`,
      level,
      index,
      kind: 'milestone',
      title: `${level} level check`,
      topicIds: levelTopics.map((t) => t.id),
      vocabTheme: null,
      wordIds: [],
      scenarioId: null,
    })
  }

  return { units, levelWordIds, levelTopicIds }
}

/**
 * Walk the path in order and stamp every unit:
 *  - units below `startLevel` are done (placed over — the placement already
 *    certified them, the learner should not be dragged back);
 *  - complete units are done;
 *  - the first incomplete unit at/after the start is `current`;
 *  - everything after it is `locked` (the guided flow is sequential — the
 *    Grammar page stays fully open for free exploration).
 */
export function computeProgress(curriculum: Curriculum, ctx: ProgressContext): readonly UnitProgress[] {
  const out: UnitProgress[] = []
  let currentAssigned = false
  for (const unit of curriculum.units) {
    const placedOver = pathIndex(unit.level) < pathIndex(ctx.startLevel)
    const p = unitProgressOf(unit, ctx, placedOver)
    if (p.complete) {
      out.push({ ...p, status: 'done' })
    } else if (currentAssigned) {
      out.push({ ...p, status: 'locked' })
    } else {
      out.push({ ...p, status: 'current' })
      currentAssigned = true
    }
  }
  return out
}

function unitProgressOf(unit: CurriculumUnit, ctx: ProgressContext, placedOver: boolean): UnitProgress {
  const topicsDone = unit.topicIds.filter((id) => ctx.masteredTopicIds.has(id)).length
  const wordsIntroduced = unit.wordIds.filter((id) => ctx.introducedWordIds.has(id)).length
  const complete = placedOver || unitIsComplete(unit, ctx, topicsDone, wordsIntroduced)
  const denom = unit.topicIds.length + unit.wordIds.length
  const fraction = complete ? 1 : denom === 0 ? 0 : (topicsDone + wordsIntroduced) / denom
  return {
    unit,
    status: complete ? 'done' : 'current',
    placedOver,
    wordsTotal: unit.wordIds.length,
    wordsIntroduced,
    topicsTotal: unit.topicIds.length,
    topicsDone,
    fraction,
    complete,
  }
}

function unitIsComplete(
  unit: CurriculumUnit,
  ctx: ProgressContext,
  topicsDone: number,
  wordsIntroduced: number,
): boolean {
  if (unit.kind === 'milestone') {
    // The level check passes when the placement assessment sits strictly above
    // the level, or when every topic of the level is mastered (offline path;
    // an empty level passes vacuously).
    if (ctx.placedLevel != null && pathIndex(ctx.placedLevel) > pathIndex(unit.level)) return true
    return topicsDone === unit.topicIds.length
  }
  const topicsOk = unit.topicIds.length > 0 && topicsDone === unit.topicIds.length
  const wordsOk =
    unit.wordIds.length === 0 || wordsIntroduced / unit.wordIds.length >= UNIT_WORD_RATIO
  return topicsOk && wordsOk
}

/** The first `current` unit on the path (the roadmap position), or null. */
export function currentUnit(progress: readonly UnitProgress[]): UnitProgress | null {
  return progress.find((p) => p.status === 'current') ?? null
}

export interface PathStats {
  targetLevel: PathLevel
  unitsTotal: number
  unitsDone: number
  wordsTotal: number
  wordsIntroduced: number
  topicsTotal: number
  topicsDone: number
  wordsLeft: number
  topicsLeft: number
}

/** Aggregate position for everything up to and including the target's milestone. */
export function curriculumStats(
  curriculum: Curriculum,
  progress: readonly UnitProgress[],
  targetLevel: PathLevel,
  ctx: ProgressContext,
): PathStats {
  const upto = PATH_LEVELS.slice(0, pathIndex(targetLevel) + 1)
  const units = progress.filter((p) => upto.includes(p.unit.level))
  const wordIds = upto.flatMap((l) => curriculum.levelWordIds[l])
  const topicIds = upto.flatMap((l) => curriculum.levelTopicIds[l])
  const wordsIntroduced = wordIds.filter((id) => ctx.introducedWordIds.has(id)).length
  const topicsDone = topicIds.filter((id) => ctx.masteredTopicIds.has(id)).length
  return {
    targetLevel,
    unitsTotal: units.length,
    unitsDone: units.filter((p) => p.status === 'done').length,
    wordsTotal: wordIds.length,
    wordsIntroduced,
    topicsTotal: topicIds.length,
    topicsDone,
    wordsLeft: Math.max(0, wordIds.length - wordsIntroduced),
    topicsLeft: Math.max(0, topicIds.length - topicsDone),
  }
}

export interface EtaProjection {
  /** Whole days of consistent study needed (0 when nothing left). */
  days: number
  arriveBy: Date
  /** Which requirement dominates the projection. */
  driver: 'words' | 'topics'
}

/**
 * "At 15 min/day you reach A2 around …" — words advance at the daily goal,
 * one grammar topic rides along per day, the slower of the two decides.
 * Pure: `from` is injectable for tests (defaults to today like lessonPlanner).
 */
export function projectEta(input: {
  wordsLeft: number
  topicsLeft: number
  dailyWordGoal: number
  from?: Date
}): EtaProjection {
  const wordsDays = Math.ceil(input.wordsLeft / Math.max(1, input.dailyWordGoal))
  const topicsDays = input.topicsLeft // one topic per day rides along
  const days = Math.max(0, wordsDays, topicsDays)
  const from = input.from ?? new Date()
  const arriveBy = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  arriveBy.setDate(arriveBy.getDate() + days)
  return { days, arriveBy, driver: wordsDays >= topicsDays ? 'words' : 'topics' }
}

