import type { VocabWord } from '../db/types'
import { normalize } from './text'

/**
 * M11.6 cloze reviews — pure planning/checking logic (no React, no browser APIs).
 *
 * A cloze shows the German example sentence of a learned word with the word
 * itself gapped out (___) and 4 choices: the answer plus same-theme distractors.
 * The gap only ever replaces a literal occurrence of the word — sentences where
 * the word only appears inflected (e.g. "bin" for "sein") are skipped rather
 * than gapped wrongly. Every answer feeds the word's SM-2 schedule.
 */

export interface ClozeItem {
  id: string
  kind: 'cloze'
  wordId: string
  /** Sentence text before the gap (raw slice, may be ''). */
  before: string
  /** Sentence text after the gap (raw slice, may be ''). */
  after: string
  /** The exact gapped form as it appeared in the sentence. */
  answer: string
  /** Article form of the word, for feedback display ("der Tag"). */
  word: string
  sentenceEn: string
  /** Answer first + up to 3 distractors — deterministic; the page shuffles for display. */
  options: string[]
}

export interface ClozeGap {
  before: string
  after: string
  answer: string
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Finds the word's literal form in a sentence, case-insensitive with Unicode
 * letter boundaries (so "Tag" never matches "Tage"): article form ("der Tag")
 * preferred, bare word ("Tag") tolerated. Returns null when the word does not
 * appear literally (inflected-only or absent).
 */
export function findGap(sentence: string, word: VocabWord): ClozeGap | null {
  const forms = word.article ? [`${word.article} ${word.german}`, word.german] : [word.german]
  for (const form of forms) {
    const re = new RegExp(`(^|[^\\p{L}])(${escapeRegExp(form)})(?![\\p{L}])`, 'iu')
    const m = re.exec(sentence)
    if (m) {
      const start = m.index + m[1].length
      return {
        before: sentence.slice(0, start),
        after: sentence.slice(start + m[2].length),
        answer: m[2],
      }
    }
  }
  return null
}

/**
 * Answer + up to 3 distractors for the choice buttons. Distractors mirror the
 * answer's shape — article+noun when the gapped answer is an article form,
 * bare word otherwise — same-theme bank words first, distinct after
 * normalization. Deterministic: [answer, ...distractors]; the page shuffles.
 */
export function clozeOptions(answer: string, word: VocabWord, bank: readonly VocabWord[]): string[] {
  const withArticle = answer.trim().includes(' ')
  const shape = (w: VocabWord): string => (withArticle && w.article ? `${w.article} ${w.german}` : w.german)
  const others = bank.filter((w) => w.id !== word.id)
  const pool = [...others.filter((w) => w.theme === word.theme), ...others.filter((w) => w.theme !== word.theme)]
  const seen = new Set([normalize(answer)])
  const options = [answer]
  for (const w of pool) {
    if (options.length >= 4) break
    const key = normalize(shape(w))
    if (key.length === 0 || seen.has(key)) continue
    seen.add(key)
    options.push(shape(w))
  }
  return options
}

/**
 * Cloze items from words in the given order (the caller shuffles), capped at
 * `limit`. Skips words without an example sentence, without a literal gap, or
 * without at least one distractor; dedupes by trimmed sentence.
 */
export function clozeItems(words: readonly VocabWord[], bank: readonly VocabWord[], limit = 8): ClozeItem[] {
  const seenSentences = new Set<string>()
  const items: ClozeItem[] = []
  for (const w of words) {
    const sentence = w.exampleSentenceDe?.trim()
    if (!sentence || seenSentences.has(sentence)) continue
    const gap = findGap(sentence, w)
    if (!gap) continue
    const options = clozeOptions(gap.answer, w, bank)
    if (options.length < 2) continue
    seenSentences.add(sentence)
    items.push({
      id: `${w.id}:cloze`,
      kind: 'cloze',
      wordId: w.id,
      before: gap.before,
      after: gap.after,
      answer: gap.answer,
      word: w.article ? `${w.article} ${w.german}` : w.german,
      sentenceEn: w.exampleSentenceEn?.trim() ?? '',
      options,
    })
    if (items.length >= limit) break
  }
  return items
}

/** Multiple-choice check — normalization-tolerant (case/umlauts). */
export function checkCloze(item: ClozeItem, choice: string): boolean {
  return normalize(choice) === normalize(item.answer)
}
