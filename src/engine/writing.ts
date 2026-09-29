/**
 * M11.9 free writing — pure helpers for the /#/writing page: word caps and the
 * daily grading quota (grading is the most expensive per-call AI feature, so
 * every tier gets a day limit), plus the deterministic prompt pick from the
 * static per-CEFR bank. The LLM contract itself is #8 `gradeWriting` in
 * llm/services. No React, no browser APIs, no Dexie.
 */
import type { CefrLevel } from '../db/types'
import { WRITING_PROMPTS, type WritingPrompt } from '../content/writing/prompts'
import { hashSeed } from './exerciseRunner'
import { keyOfDay } from './progressStats'

/** Which AI route pays for the grading (structurally entitlement's AiRoute). */
export type WritingRoute = 'byo' | 'platform' | 'none'

/** Graded pieces per local day. Plan values mirror PHASE2_PLAN (Pro = M11.10). */
export const WRITING_DAILY_LIMITS: Readonly<Record<string, number>> = {
  free: 1,
  basic: 3,
  plus: 3,
  pro: 5,
}

/** Own key, own tokens — a generous anti-runaway cap instead of a paywall. */
export const WRITING_BYO_DAILY_LIMIT = 10

/** Below this the submit button stays off (junk texts must not be graded). */
export const WRITING_MIN_WORDS = 15

/** Soft cap: the counter turns amber past it, but submission stays open. */
export const WRITING_SOFT_CAP_WORDS = 120

/** Pro cap — dormant until M11.10 activates the tier, but wired through. */
export const WRITING_PRO_CAP_WORDS = 250

/** Hard block: no text is graded beyond this, whatever the plan. */
export const WRITING_MAX_WORDS = 400

/** Whitespace tokens that are non-empty (punctuation rides along — good enough). */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length
}

/** Day limit for the route+plan combination; unknown plans fall back to free. */
export function writingDailyLimit(route: WritingRoute, plan: string): number {
  if (route === 'none') return 0
  if (route === 'byo') return WRITING_BYO_DAILY_LIMIT
  return WRITING_DAILY_LIMITS[plan] ?? WRITING_DAILY_LIMITS.free
}

/** Target length for the counter — 250 words once Pro activates, else 120. */
export function writingWordCap(plan: string): number {
  return plan === 'pro' ? WRITING_PRO_CAP_WORDS : WRITING_SOFT_CAP_WORDS
}

/**
 * M11.10a AI extras (LLM-generated prompts + full-rewrite grading): Pro on the
 * platform route, always on for BYO (own key, own tokens), off otherwise.
 * Dormant in practice until the Pro tier is purchasable (owner: Paddle
 * products), but BYO users get it immediately.
 */
export function writingAiExtrasEnabled(route: WritingRoute, plan: string): boolean {
  if (route === 'byo') return true
  return route === 'platform' && plan === 'pro'
}

export interface WritingQuota {
  usedToday: number
  limit: number
  left: number
}

/** How many graded pieces are left today (local calendar day, like streaks). */
export function writingQuota(
  pieces: readonly { createdAt: number }[],
  route: WritingRoute,
  plan: string,
  now: number,
): WritingQuota {
  const limit = writingDailyLimit(route, plan)
  const today = keyOfDay(now)
  const usedToday = pieces.filter((p) => keyOfDay(p.createdAt) === today).length
  return { usedToday, limit, left: Math.max(0, limit - usedToday) }
}

/** The static bank slice for one level (every level has 8 prompts). */
export function promptsForLevel(level: CefrLevel): readonly WritingPrompt[] {
  return WRITING_PROMPTS.filter((p) => p.cefr === level)
}

/**
 * Deterministic pick: same level+day+salt always yields the same prompt, the
 * 🎲 button just advances the salt. Stable across devices and reloads.
 */
export function promptForDay(level: CefrLevel, dayKey: string, salt = 0): WritingPrompt {
  const prompts = promptsForLevel(level)
  const idx = hashSeed(`${level}:${dayKey}:${salt}`) % prompts.length
  return prompts[idx]
}