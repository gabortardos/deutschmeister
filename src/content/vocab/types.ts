/**
 * Seed vocabulary format. Tuples keep the corpus compact and reviewable.
 * [article, german, plural, english, theme, exampleSentenceDe, exampleSentenceEn]
 */
export type SeedRow = readonly [
  article: 'der' | 'die' | 'das' | null,
  german: string,
  plural: string | null,
  english: string,
  theme: string,
  exampleSentenceDe: string,
  exampleSentenceEn: string,
]
