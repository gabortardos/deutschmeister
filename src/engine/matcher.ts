import { normalize } from './text'

export type MatchVerdict = 'correct' | 'almost' | 'incorrect'

export interface MatchResult {
  verdict: MatchVerdict
  similarity: number
}

/** Classic iterative Levenshtein edit distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i += 1) {
    const curr = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[b.length]
}

export function similarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1
  const dist = levenshtein(a, b)
  return 1 - dist / Math.max(a.length, b.length)
}

/**
 * Speech matcher: same normalization as the grader, then Levenshtein similarity.
 *   ≥ 0.85 → correct · 0.7–0.85 → "almost" (diff shown to the learner) · < 0.7 → incorrect.
 */
export function matchSpeech(heard: string, target: string): MatchResult {
  const h = normalize(heard)
  const t = normalize(target)
  const score = similarity(h, t)
  const verdict: MatchVerdict = score >= 0.85 ? 'correct' : score >= 0.7 ? 'almost' : 'incorrect'
  return { verdict, similarity: Math.round(score * 1000) / 1000 }
}
