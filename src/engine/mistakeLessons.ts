/**
 * M11.3: static micro-lessons for tutor corrections — the free, offline,
 * deterministic half of the hybrid mistake explanations (PHASE2_PLAN).
 * Category union mirrors llm/services.ts `MistakeCategory` structurally;
 * lookup is string-tolerant so raw turn payloads can't crash the UI.
 */

export type MistakeLessonCategory = 'gender' | 'case' | 'word-order' | 'vocab' | 'verb-form' | 'other'

export interface MistakeLesson {
  title: string
  rule: string
  examples: { bad: string; good: string }[]
  tip: string
}

/** Grammar-topic title keyword to deep-link per category (null = no topic). */
export const CATEGORY_TOPIC_KEYWORD: Record<MistakeLessonCategory, string | null> = {
  gender: 'gender',
  case: 'akkusativ',
  'word-order': 'word order',
  vocab: null,
  'verb-form': 'present tense',
  other: null,
}

export const MISTAKE_LESSONS: Record<MistakeLessonCategory, MistakeLesson> = {
  gender: {
    title: 'Article gender',
    rule: 'Every German noun has a fixed grammatical gender — der, die or das — that must be memorized together with the word. Using the wrong article is one of the most common (and most visible) mistakes.',
    examples: [
      { bad: 'die Buch', good: 'das Buch' },
      { bad: 'der Lampe', good: 'die Lampe' },
    ],
    tip: 'Learn every noun WITH its article ("das Buch", never just "Buch") — color-coding der/die/das in your notes makes the gender stick.',
  },
  case: {
    title: 'Case endings',
    rule: 'German marks a noun\'s role with case endings: the direct object takes the Akkusativ (den/einen…) and the indirect object the Dativ (dem/der…). Some verbs demand a specific case.',
    examples: [
      { bad: 'Ich sehe der Hund.', good: 'Ich sehe den Hund.' },
      { bad: 'Ich helfe den Mann.', good: 'Ich helfe dem Mann. (helfen + Dativ)' },
    ],
    tip: 'Learn verbs together with their case: "jemandem (Dativ) helfen", "jemanden (Akkusativ) sehen".',
  },
  'word-order': {
    title: 'Word order',
    rule: 'The conjugated verb claims position 2 in statements — whatever comes first pushes the subject behind it. In subclauses (weil, dass, wenn…) the verb moves to the very end.',
    examples: [
      { bad: 'Heute ich gehe ins Kino.', good: 'Heute gehe ich ins Kino.' },
      { bad: '…weil ich bin müde.', good: '…weil ich müde bin.' },
    ],
    tip: 'Check two things: is the verb second? Is it LAST in the weil/dass clause?',
  },
  vocab: {
    title: 'Word choice',
    rule: 'The word exists but means something different — or German prefers a different word/compound in this context. English logic often points at a false friend.',
    examples: [
      { bad: 'Ich bekomme einen Kaffee, bitte.', good: 'Ich möchte einen Kaffee, bitte. (bekommen = to receive)' },
      { bad: 'Ich habe das in der Schule gelernt über Geschichte.', good: 'In der Schule habe ich etwas über Geschichte gelernt.' },
    ],
    tip: 'When you learn a word, always check its German → English meaning too — the reverse direction catches false friends.',
  },
  'verb-form': {
    title: 'Verb form',
    rule: 'Verbs conjugate for person and number (du -st, er/sie/es -t…) and pick the right tense form — stem changes, strong participles, and the Perfekt auxiliary (haben/sein) all matter.',
    examples: [
      { bad: 'Du geht zur Schule.', good: 'Du gehst zur Schule.' },
      { bad: 'Ich habe nach Hause gegangen.', good: 'Ich bin nach Hause gegangen. (gehen + sein)' },
    ],
    tip: 'Memorize strong verbs as triples — gehen, ging, gegangen (+ sein) — and the auxiliary comes free.',
  },
  other: {
    title: 'Pattern fix',
    rule: 'Something in this sentence doesn\'t follow the pattern German expects — often the preposition, an adjective ending, or a fixed phrase. The corrected version shows the idiomatic form.',
    examples: [
      { bad: 'Ich warte für dich.', good: 'Ich warte auf dich. (warten auf + Akkusativ)' },
      { bad: 'Ich interessiere mich für an Musik.', good: 'Ich interessiere mich für Musik.' },
    ],
    tip: 'For fixed phrases, say the corrected version out loud once — muscle memory beats rules for idioms.',
  },
}

/** Tolerant lookup: unknown/empty categories fall back to the 'other' lesson. */
export function mistakeLesson(category: string): MistakeLesson {
  return MISTAKE_LESSONS[category as MistakeLessonCategory] ?? MISTAKE_LESSONS.other
}

/**
 * Deep link for a correction: the first grammar topic whose title contains the
 * category keyword (case-insensitive), or null. Pure so tests pin the matching.
 */
export function findTopicForMistake<T extends { id: string; title: string }>(
  category: string,
  topics: readonly T[],
): T | null {
  const keyword = CATEGORY_TOPIC_KEYWORD[category as MistakeLessonCategory] ?? CATEGORY_TOPIC_KEYWORD.other
  if (!keyword) return null
  const needle = keyword.toLowerCase()
  return topics.find((t) => t.title.toLowerCase().includes(needle)) ?? null
}
