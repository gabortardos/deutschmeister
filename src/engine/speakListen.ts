import type { VocabWord } from '../db/types'
import { matchSpeech, type MatchResult, type MatchVerdict } from './matcher'

/**
 * M4 speaking & listening drills — pure planning/grading logic (no React, no browser APIs).
 *
 * - Listening drill: TTS speaks the German word, the learner types what they heard
 *   (graded with the existing `gradeAnswer` against article-optional accepted forms).
 * - Speaking drill: the learner sees the English meaning and says the German word;
 *   the STT transcript is graded with `gradeSpoken` (Levenshtein over normalized text).
 */

export type SpeakListenKind = 'speak' | 'listen'

export interface SpeakListenItem {
  id: string
  kind: SpeakListenKind
  wordId: string
  /** English cue shown to the learner (speak mode). */
  prompt: string
  /** Full German answer incl. article — shown in feedback, spoken by TTS. */
  answer: string
  /** Grading targets: article form first, bare word tolerated. */
  accepted: string[]
}

export interface SpokenGrade extends MatchResult {
  /** The accepted form the transcript was closest to. */
  matchedTarget: string
}

/** Article form + bare word ("der Apfel", "Apfel") — umlaut-free typing accepted downstream. */
export function acceptedForms(word: VocabWord): string[] {
  return word.article ? [`${word.article} ${word.german}`, word.german] : [word.german]
}

/**
 * One listen item per word, plus one speak item when a microphone is available.
 * Items interleave (listen, speak, listen, …) so both skills get exercised evenly.
 */
export function speakListenItems(
  words: readonly VocabWord[],
  opts: { sttAvailable: boolean },
): SpeakListenItem[] {
  const items: SpeakListenItem[] = []
  for (const w of words) {
    const accepted = acceptedForms(w)
    const answer = accepted[0] ?? w.german
    items.push({
      id: `${w.id}:listen`,
      kind: 'listen',
      wordId: w.id,
      prompt: w.english,
      answer,
      accepted,
    })
    if (opts.sttAvailable) {
      items.push({
        id: `${w.id}:speak`,
        kind: 'speak',
        wordId: w.id,
        prompt: w.english,
        answer,
        accepted,
      })
    }
  }
  return items
}

/**
 * Best match across all accepted forms: "der Apfel" vs a transcript of "Apfel"
 * (STT frequently drops articles) still grades against the bare form.
 */
export function gradeSpoken(transcript: string, accepted: readonly string[]): SpokenGrade {
  if (transcript.trim().length === 0 || accepted.length === 0) {
    return { verdict: 'incorrect', similarity: 0, matchedTarget: accepted[0] ?? '' }
  }
  let best: SpokenGrade | null = null
  for (const target of accepted) {
    const result = matchSpeech(transcript, target)
    if (best === null || result.similarity > best.similarity) {
      best = { ...result, matchedTarget: target }
    }
  }
  return best ?? { verdict: 'incorrect', similarity: 0, matchedTarget: accepted[0] ?? '' }
}

/** SM-2 quality per verdict: correct 5, "almost" 3 (seen soon), incorrect 1. */
export function qualityForVerdict(verdict: MatchVerdict): number {
  if (verdict === 'correct') return 5
  if (verdict === 'almost') return 3
  return 1
}
