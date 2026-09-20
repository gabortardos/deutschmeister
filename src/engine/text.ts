/**
 * Shared text normalization for grading and speech matching.
 * Pure module — no React, no browser APIs.
 */

const DAY_MS = 86_400_000
export { DAY_MS }

/**
 * Normalizes an answer for comparison:
 * trim → lowercase → collapse whitespace → strip trailing punctuation →
 * fold umlauts to ASCII (ä→ae, ö→oe, ü→ue, ß→ss).
 *
 * Folding umlauts on BOTH sides gives acceptance in both directions:
 * "Übung" matches "Uebung" and "uebung" matches "Übung".
 */
export function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?…,;:]+$/, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
}

const ARTICLES = /^(der|die|das|ein|eine|einen|einem|einer|dem|den|the|a|an)\s+/

/** Strips a leading (German or English) article from an already-normalized string. */
export function stripArticle(normalized: string): string {
  return normalized.replace(ARTICLES, '')
}

/** Local-timezone YYYY-MM-DD key for a timestamp. */
export function dateKey(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Epoch ms of local midnight for a timestamp. */
export function startOfDay(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
