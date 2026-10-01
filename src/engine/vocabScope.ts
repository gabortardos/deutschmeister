import { CEFR_LEVELS, type CefrLevel, type VocabScope, type VocabWord } from '../db/types'

/**
 * M12.9 word-focus scope — pure filter logic for "which part of the corpus
 * should new words come from". No React, no browser APIs (unit-tested).
 *
 * Semantics: an empty `levels` array means ALL levels are allowed, an empty
 * `themes` array means ALL themes are allowed; a word is in scope when it
 * passes BOTH dimensions. Custom words (`custom: true`) always pass — the
 * learner created them deliberately, so a narrow focus must never hide them.
 */

/** The unrestricted scope (levels/themes empty = everything). */
export const EMPTY_VOCAB_SCOPE: VocabScope = { levels: [], themes: [] }

export function vocabScopeIsEmpty(scope: VocabScope | null | undefined): boolean {
  if (!scope) return true
  return scope.levels.length === 0 && scope.themes.length === 0
}

export function wordInScope(word: VocabWord, scope: VocabScope | null | undefined): boolean {
  if (!scope || vocabScopeIsEmpty(scope)) return true
  if (word.custom) return true
  const levelOk = scope.levels.length === 0 || scope.levels.includes(word.cefr)
  const themeOk = scope.themes.length === 0 || scope.themes.includes(word.theme)
  return levelOk && themeOk
}

/** Filters a word list down to the scope; `null`/empty scope returns everything. */
export function applyVocabScope<T extends VocabWord>(
  words: readonly T[],
  scope: VocabScope | null | undefined,
): T[] {
  if (!scope || vocabScopeIsEmpty(scope)) return [...words]
  return words.filter((w) => wordInScope(w, scope))
}

/**
 * Defensive parse of a persisted/patched scope value: drops unknown levels,
 * non-string themes, dedupes, and collapses empty results to the empty scope.
 * Garbage input (null, primitives, wrong shapes) yields the unrestricted scope.
 */
export function normalizeVocabScope(raw: unknown): VocabScope {
  if (typeof raw !== 'object' || raw === null) return EMPTY_VOCAB_SCOPE
  const candidate = raw as { levels?: unknown; themes?: unknown }
  const levels = Array.isArray(candidate.levels)
    ? [...new Set(candidate.levels.filter((l): l is CefrLevel => CEFR_LEVELS.includes(l as CefrLevel)))]
    : []
  const themes = Array.isArray(candidate.themes)
    ? [
        ...new Set(
          candidate.themes
            .filter((t): t is string => typeof t === 'string')
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
        ),
      ]
    : []
  return { levels, themes }
}

/**
 * Toggles one value in a scope dimension (levels or themes). Empty array means
 * "all" — toggling the last selected value off returns the dimension to "all".
 */
export function toggleScopeValue(list: readonly string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}