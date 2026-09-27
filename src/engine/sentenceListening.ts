import type { VocabWord } from '../db/types'
import { similarity, type MatchVerdict } from './matcher'
import { normalize } from './text'

/**
 * M11.5 sentence listening (dictation) — pure planning/grading logic
 * (no React, no browser APIs).
 *
 * TTS speaks the German example sentence of a learned word; the learner types
 * what they heard. Grading is umlaut- and punctuation-tolerant over the whole
 * sentence, and every answer feeds the word's SM-2 schedule (see SpeakListenPage).
 */

export interface SentenceItem {
  id: string
  kind: 'sentence'
  wordId: string
  /** Article form of the target word — shown in feedback ("practising: der Tag"). */
  word: string
  /** German sentence spoken by TTS and expected as the typed answer. */
  sentenceDe: string
  /** English translation revealed after checking. */
  sentenceEn: string
}

export interface SentenceGrade {
  verdict: MatchVerdict
  similarity: number
}

/** Sentence punctuation (incl. German quotes) — stripped before the shared normalizer. */
const SENTENCE_PUNCT = /[.,!?;:„“»«"'’\-–—…()[\]]/g

/**
 * Normalizes a typed/spoken sentence for comparison:
 * punctuation → space, then trim/lowercase/collapse whitespace/fold umlauts
 * (via the shared `normalize`), so „Der Tag ist lang." === "der tag ist lang".
 */
export function normalizeSentence(input: string): string {
  return normalize(input.replace(SENTENCE_PUNCT, ' '))
}

/**
 * Dictation items from words that carry an example sentence.
 * Deterministic (input order, capped at `limit`) — the caller shuffles words.
 * Deduplicates by normalized sentence so the same line is never dictated twice.
 */
export function sentenceItems(words: readonly VocabWord[], limit = 6): SentenceItem[] {
  const seen = new Set<string>()
  const items: SentenceItem[] = []
  for (const w of words) {
    const sentenceDe = w.exampleSentenceDe?.trim()
    if (!sentenceDe) continue
    const key = normalizeSentence(sentenceDe)
    if (key.length === 0 || seen.has(key)) continue
    seen.add(key)
    items.push({
      id: `${w.id}:sentence`,
      kind: 'sentence',
      wordId: w.id,
      word: w.article ? `${w.article} ${w.german}` : w.german,
      sentenceDe,
      sentenceEn: w.exampleSentenceEn?.trim() ?? '',
    })
    if (items.length >= limit) break
  }
  return items
}

/**
 * Grades a typed dictation against the spoken sentence over normalized text.
 * Stricter than the speech matcher (typed input has no STT noise):
 *   ≥ 0.9 → correct · 0.75–0.9 → "almost" · < 0.75 → incorrect.
 */
export function gradeSentence(typed: string, target: string): SentenceGrade {
  if (typed.trim().length === 0) {
    return { verdict: 'incorrect', similarity: 0 }
  }
  const score = similarity(normalizeSentence(typed), normalizeSentence(target))
  const verdict: MatchVerdict = score >= 0.9 ? 'correct' : score >= 0.75 ? 'almost' : 'incorrect'
  return { verdict, similarity: Math.round(score * 1000) / 1000 }
}
