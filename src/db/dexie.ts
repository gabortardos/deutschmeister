import Dexie, { type Table } from 'dexie'
import type {
  AppSettings,
  ConversationSession,
  ConversationTurn,
  DrillAttempt,
  DrillItem,
  GrammarTopic,
  LessonLog,
  LlmCacheEntry,
  Scenario,
  UserProfile,
  VocabCard,
  VocabWord,
} from './types'

export class DeutschMeisterDB extends Dexie {
  userProfiles!: Table<UserProfile, string>
  vocabWords!: Table<VocabWord, string>
  vocabCards!: Table<VocabCard, string>
  grammarTopics!: Table<GrammarTopic, string>
  drillItems!: Table<DrillItem, string>
  drillAttempts!: Table<DrillAttempt, string>
  conversationSessions!: Table<ConversationSession, string>
  conversationTurns!: Table<ConversationTurn, string>
  lessonLogs!: Table<LessonLog, string>
  scenarios!: Table<Scenario, string>
  settings!: Table<AppSettings, string>
  llmCache!: Table<LlmCacheEntry, string>

  constructor() {
    super('deutschmeister')
    this.version(1).stores({
      userProfiles: 'id, updatedAt',
      vocabWords: 'id, german, cefr, theme, frequencyRank, custom',
      vocabCards: 'id, wordId, dueDate, state, introducedDate',
      grammarTopics: 'id, cefr, order',
      drillItems: 'id, ownerId, type, cefr, source',
      drillAttempts: 'id, itemId, at',
      conversationSessions: 'id, scenarioId, startedAt',
      conversationTurns: 'id, sessionId, role',
      lessonLogs: 'id, date',
      scenarios: 'id, cefr, custom',
      settings: 'id',
      llmCache: 'key, createdAt',
    })
  }
}

export const db = new DeutschMeisterDB()
