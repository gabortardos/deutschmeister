import type { CefrLevel, DrillType } from '../../db/types'

/** The six exercise types playable in the M2 drill runner. */
export type SeedDrillType = Extract<
  DrillType,
  'cloze' | 'choice' | 'transform' | 'wordorder' | 'translate_de_en' | 'translate_en_de'
>

/**
 * Seed drill conventions:
 * - cloze: prompt contains ___; answer fills the gap (promptData.hint optional)
 * - choice: promptData.options (answer included); acceptedAnswers has exactly one entry
 * - transform: prompt is the source; promptData.instruction tells the learner what to do
 * - wordorder: promptData.tokens are scrambled by the runner; acceptedAnswers[0] is the sentence
 * - translate_de_en / translate_en_de: prompt is the source sentence; acceptedAnswers lists valid variants
 */
export interface SeedDrill {
  type: SeedDrillType
  prompt: string
  promptData?: Record<string, unknown> | null
  acceptedAnswers: string[]
}

export interface SeedTopic {
  key: string
  title: string
  cefr: CefrLevel
  focus: string
  /** Must match a theme in the seed vocab corpus (drives the lesson planner bias). */
  relatedVocabTheme: string | null
  explanationMd: string
  drills: SeedDrill[]
}
