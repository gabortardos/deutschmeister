import type { DrillItem, DrillType } from '../db/types'
import { gradeAnswer, type GradeResult } from './grader'
import { normalize } from './text'

/**
 * Deterministic helpers for the grammar exercise runner.
 * Options/tokens are shuffled with a seed derived from the drill id, so the
 * presentation is stable across reloads but varies between drills.
 * Pure module — no React, no browser APIs.
 */

/** FNV-1a-style string hash → 32-bit unsigned seed. */
export function hashSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a: number): () => number {
  let s = a >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic Fisher–Yates shuffle: same seed → same permutation. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const out = [...items]
  const rng = mulberry32(hashSeed(seed))
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) && value.every((x) => typeof x === 'string') ? [...value] : []
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

/** promptData.options for choice drills, deterministically shuffled. */
export function drillOptions(item: Pick<DrillItem, 'id' | 'promptData'>): string[] {
  const raw = readStringArray(item.promptData?.options)
  return seededShuffle(raw, `options-${item.id}`)
}

/** promptData.tokens for wordorder drills, scrambled; never the solved order. */
export function drillTokens(item: Pick<DrillItem, 'id' | 'promptData'>): string[] {
  const raw = readStringArray(item.promptData?.tokens)
  const shuffled = seededShuffle(raw, `tokens-${item.id}`)
  if (raw.length > 1 && shuffled.every((t, i) => t === raw[i])) {
    return [...shuffled.slice(1), shuffled[0] ?? '']
  }
  return shuffled
}

/** Optional learner-facing hint from promptData. */
export function drillHint(item: Pick<DrillItem, 'promptData'>): string | null {
  return readString(item.promptData?.hint) ?? readString(item.promptData?.instruction)
}

/** Transform drills carry their instruction in promptData. */
export function drillInstruction(item: Pick<DrillItem, 'promptData'>): string | null {
  return readString(item.promptData?.instruction)
}

/** True when the answer is German text (show the ä ö ü ß keys). */
export function needsGermanKeys(type: DrillType): boolean {
  return type === 'cloze' || type === 'transform' || type === 'wordorder' || type === 'translate_en_de'
}

/**
 * Grades a drill attempt with the rule-based grader. Choice drills compare the
 * picked option to acceptedAnswers[0]; all other types run the full normalizer
 * (umlaut variants, punctuation, article-optional when promptData says so).
 */
export function gradeDrill(item: DrillItem, answer: string): GradeResult {
  const answer0 = item.acceptedAnswers[0] ?? ''
  if (item.type === 'choice') {
    const correct = answer0.length > 0 && normalize(answer) === normalize(answer0)
    return { correct, matched: correct ? answer0 : null }
  }
  const articleOptional = item.promptData?.articleOptional === true
  return gradeAnswer(answer, item.acceptedAnswers, { articleOptional })
}
