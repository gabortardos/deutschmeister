import { CEFR_LEVELS, type CefrLevel, type DrillType } from '../db/types'

/**
 * M11.7 insights — pure aggregation for the /#/insights page (no React, no
 * browser APIs). Answers "where am I strong / weak" from data the app already
 * records: drill attempts (by drill type and CEFR level), vocabulary coverage
 * per level, and conversation correction types. Structural `*Like` inputs on
 * purpose — same pattern as mistakeBank — so tests and callers stay decoupled
 * from Dexie rows.
 *
 * The dashboard (M10.1 progressStats) already owns the time dimension
 * (heatmap, streaks, due forecast); this engine owns the skill dimension.
 */

export interface AttemptLike {
  itemId: string
  correct: boolean
  at: number
}

export interface DrillItemLike {
  id: string
  type: DrillType
  cefr: CefrLevel
}

export interface TurnLike {
  mistakes: { type: string }[] | null
}

export const DRILL_TYPE_LABELS: Record<DrillType, string> = {
  cloze: 'Cloze',
  choice: 'Multiple choice',
  transform: 'Transform',
  wordorder: 'Word order',
  translate_de_en: 'DE → EN',
  translate_en_de: 'EN → DE',
  listen: 'Listening',
  speak: 'Speaking',
}

/** Friendly label for a conversation mistake type ("gender" → "Gender"). */
export function mistakeTypeLabel(type: string): string {
  return type.length === 0 ? 'Other' : type[0].toUpperCase() + type.slice(1)
}

export interface AccuracyRow {
  key: string
  label: string
  attempts: number
  correct: number
  /** Integer 0–100. */
  accuracy: number
}

export interface CoverageRow {
  cefr: CefrLevel
  introduced: number
  total: number
}

export interface Insights {
  totals: {
    /** All attempts ever (including orphaned items). */
    drills: number
    drillCorrect: number
    /** Integer 0–100, 0 when there are no attempts. */
    drillAccuracy: number
    conversations: number
    /** Conversation + free-writing corrections received (M11.9 pieces included). */
    corrections: number
    /** M11.9: graded free-writing pieces. */
    writing: number
  }
  /** Only drill types with ≥1 attempt, worst accuracy first (then most attempts). */
  accuracyByType: AccuracyRow[]
  /** Only CEFR levels with ≥1 attempt, in A1→C2 order. */
  accuracyByCefr: AccuracyRow[]
  /** Bank coverage: only levels with words in the bank, in A1→C2 order. */
  vocabCoverage: CoverageRow[]
  /** Conversation correction types, most frequent first. */
  mistakeTypes: { key: string; label: string; count: number }[]
}

function pct(correct: number, attempts: number): number {
  return attempts === 0 ? 0 : Math.round((correct / attempts) * 100)
}

/**
 * Accuracy grouped by drill type. Attempts whose drill item no longer exists
 * (deleted LLM drills) are skipped — their type is unknowable.
 */
export function accuracyByType(
  attempts: readonly AttemptLike[],
  items: readonly DrillItemLike[],
): AccuracyRow[] {
  const byId = new Map(items.map((i) => [i.id, i]))
  const stats = new Map<DrillType, { attempts: number; correct: number }>()
  for (const a of attempts) {
    const item = byId.get(a.itemId)
    if (!item) continue
    const s = stats.get(item.type) ?? { attempts: 0, correct: 0 }
    s.attempts += 1
    if (a.correct) s.correct += 1
    stats.set(item.type, s)
  }
  return [...stats.entries()]
    .map(([type, s]) => ({
      key: type,
      label: DRILL_TYPE_LABELS[type],
      attempts: s.attempts,
      correct: s.correct,
      accuracy: pct(s.correct, s.attempts),
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts || a.key.localeCompare(b.key))
}


/** Accuracy grouped by the CEFR level of the drill item, A1→C2 order. */
export function accuracyByCefr(
  attempts: readonly AttemptLike[],
  items: readonly DrillItemLike[],
): AccuracyRow[] {
  const byId = new Map(items.map((i) => [i.id, i]))
  const stats = new Map<CefrLevel, { attempts: number; correct: number }>()
  for (const a of attempts) {
    const item = byId.get(a.itemId)
    if (!item) continue
    const s = stats.get(item.cefr) ?? { attempts: 0, correct: 0 }
    s.attempts += 1
    if (a.correct) s.correct += 1
    stats.set(item.cefr, s)
  }
  return CEFR_LEVELS.filter((cefr) => stats.has(cefr)).map((cefr) => {
    const s = stats.get(cefr)!
    return { key: cefr, label: cefr, attempts: s.attempts, correct: s.correct, accuracy: pct(s.correct, s.attempts) }
  })
}

/**
 * Bank coverage per CEFR level: how many of the bank's words at that level
 * have a card (= were introduced). Only levels that have words at all.
 */
export function vocabCoverage(
  cards: readonly { wordId: string }[],
  words: readonly { id: string; cefr: CefrLevel }[],
): CoverageRow[] {
  const introduced = new Set(cards.map((c) => c.wordId))
  return CEFR_LEVELS.map((cefr) => {
    const atLevel = words.filter((w) => w.cefr === cefr)
    return {
      cefr,
      introduced: atLevel.filter((w) => introduced.has(w.id)).length,
      total: atLevel.length,
    }
  }).filter((row) => row.total > 0)
}

/** Conversation correction types, most frequent first (ties: A→Z). */
export function mistakeTypeCounts(
  turns: readonly TurnLike[],
): { key: string; label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const turn of turns) {
    for (const m of turn.mistakes ?? []) counts.set(m.type, (counts.get(m.type) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: mistakeTypeLabel(key), count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
}

export function computeInsights(input: {
  attempts: readonly AttemptLike[]
  items: readonly DrillItemLike[]
  cards: readonly { wordId: string }[]
  words: readonly { id: string; cefr: CefrLevel }[]
  /** User turns only — tutor turns carry no mistakes. Writing pieces join
   *  this list (M11.9): their correction lists count as corrections too. */
  turns: readonly TurnLike[]
  conversations: number
  /** M11.9: graded free-writing pieces (optional so older callers stay valid). */
  writing?: number
}): Insights {
  const drills = input.attempts.length
  const drillCorrect = input.attempts.filter((a) => a.correct).length
  return {
    totals: {
      drills,
      drillCorrect,
      drillAccuracy: pct(drillCorrect, drills),
      conversations: input.conversations,
      corrections: input.turns.reduce((sum, t) => sum + (t.mistakes?.length ?? 0), 0),
      writing: input.writing ?? 0,
    },
    accuracyByType: accuracyByType(input.attempts, input.items),
    accuracyByCefr: accuracyByCefr(input.attempts, input.items),
    vocabCoverage: vocabCoverage(input.cards, input.words),
    mistakeTypes: mistakeTypeCounts(input.turns),
  }
}
