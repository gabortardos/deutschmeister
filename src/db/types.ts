import type { ProviderId } from '../llm/providers'

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export const CEFR_LEVELS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export interface BaseEntity {
  id: string
  updatedAt: number
}

export interface PlacementResult {
  assessedLevel: CefrLevel
  correctByLevel: Record<string, number>
  takenAt: number
}

export interface UserProfile extends BaseEntity {
  name: string
  level: CefrLevel
  dailyWordGoal: number
  currentGrammarTopicId: string | null
  placementResult: PlacementResult | null
}

export interface KeyPhrase {
  de: string
  en: string
}

export interface VocabWord extends BaseEntity {
  german: string
  article: 'der' | 'die' | 'das' | null
  plural: string | null
  english: string
  cefr: CefrLevel
  theme: string
  frequencyRank: number
  exampleSentenceDe: string | null
  exampleSentenceEn: string | null
  custom: boolean
}

export type CardState = 'new' | 'learning' | 'review'

export interface VocabCard extends BaseEntity {
  wordId: string
  ease: number
  intervalDays: number
  repetitions: number
  dueDate: number // epoch ms
  lapses: number
  state: CardState
  introducedDate: number // epoch ms
}

export interface GrammarTopic extends BaseEntity {
  title: string
  cefr: CefrLevel
  order: number
  explanationMd: string
  focus: string
  relatedVocabTheme: string | null
}

export type DrillType =
  | 'cloze'
  | 'choice'
  | 'transform'
  | 'wordorder'
  | 'translate_de_en'
  | 'translate_en_de'
  | 'listen'
  | 'speak'

export interface DrillItem extends BaseEntity {
  ownerId: string // grammarTopicId or wordId
  type: DrillType
  prompt: string
  promptData: Record<string, unknown> | null
  acceptedAnswers: string[]
  cefr: CefrLevel
  source: 'seed' | 'llm'
  validated: boolean
}

export interface DrillAttempt extends BaseEntity {
  itemId: string
  correct: boolean
  userAnswer: string
  transcript: string | null
  at: number
}

export interface ConversationMistake {
  said: string
  corrected: string
  type: string
}

export interface ConversationSession extends BaseEntity {
  scenarioId: string
  startedAt: number
  endedAt: number | null
  summary: string | null
}

export interface ConversationTurn extends BaseEntity {
  sessionId: string
  role: 'user' | 'tutor'
  text: string
  mistakes: ConversationMistake[] | null
  translation: string | null
  /** True when the learner sent an AI-suggested reply (Hint). Not indexed → no Dexie schema bump. */
  assisted?: boolean
}

export interface LessonLog extends BaseEntity {
  date: string // YYYY-MM-DD
  newWordIds: string[]
  grammarTopicId: string | null
  drillsDone: number
}

export interface Scenario extends BaseEntity {
  title: string
  cefr: CefrLevel
  emoji: string
  description: string
  goal: string
  keyPhrases: KeyPhrase[]
  custom: boolean
}

export interface AppSettings {
  id: 'app'
  updatedAt: number
  provider: ProviderId
  baseUrl: string
  model: string
  ttsVoice: string | null
  ttsRate: number
  sttEnabled: boolean
  /** M9.6 Supporter gate: epoch ms when the user FIRST saved a BYO key (trial clock). */
  byoKeyFirstSeenAt: number | null
}

export interface LlmCacheEntry {
  key: string
  payload: unknown
  createdAt: number
}
