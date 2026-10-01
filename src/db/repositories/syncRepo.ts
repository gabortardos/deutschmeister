import { db } from '../dexie'
import type {
  AppSettings,
  BaseEntity,
  ConversationSession,
  ConversationTurn,
  DrillAttempt,
  DrillItem,
  LessonLog,
  Scenario,
  UserProfile,
  VocabCard,
  VocabWord,
} from '../types'

/**
 * One adapter per Dexie table that participates in cloud sync (see supabase/migrations/
 * 0001_init.sql — Postgres keeps the full row in a `data` jsonb payload, keyed by
 * (user_id, id) with `updated_at` epoch-ms for last-write-wins).
 *
 * Excluded by design: grammarTopics (static seed content, shipped in the bundle) and
 * llmCache (device-local response cache). API keys never enter Dexie at all (localStorage
 * only), so they can never be synced.
 */
export interface SyncAdapter {
  pgTable: string
  load: () => Promise<BaseEntity[]>
  save: (rows: BaseEntity[]) => Promise<void>
  /** Push-side predicate: limits what this device uploads (pull always takes everything). */
  pushFilter?: (row: BaseEntity) => boolean
  /** M13.3 account switch: wipe this table's LOCAL rows (cloud is untouched). */
  clear: () => Promise<void>
}

export const syncAdapters: readonly SyncAdapter[] = [
  {
    pgTable: 'user_profiles',
    load: () => db.userProfiles.toArray(),
    save: async (rows) => {
      await db.userProfiles.bulkPut(rows as UserProfile[])
    },
    clear: () => db.userProfiles.clear(),
  },
  {
    pgTable: 'app_settings',
    load: () => db.settings.toArray(),
    save: async (rows) => {
      await db.settings.bulkPut(rows as AppSettings[])
    },
    clear: () => db.settings.clear(),
  },
  {
    pgTable: 'vocab_words',
    load: () => db.vocabWords.toArray(),
    save: async (rows) => {
      await db.vocabWords.bulkPut(rows as VocabWord[])
    },
    // Only the user's own words — seed vocabulary ships with the app bundle.
    pushFilter: (row) => (row as VocabWord).custom === true,
    clear: () => db.vocabWords.clear(),
  },
  {
    pgTable: 'vocab_cards',
    load: () => db.vocabCards.toArray(),
    save: async (rows) => {
      await db.vocabCards.bulkPut(rows as VocabCard[])
    },
    clear: () => db.vocabCards.clear(),
  },
  {
    pgTable: 'drill_items',
    load: () => db.drillItems.toArray(),
    save: async (rows) => {
      await db.drillItems.bulkPut(rows as DrillItem[])
    },
    // Only AI-generated drills — seed drills ship with the app bundle.
    pushFilter: (row) => (row as DrillItem).source === 'llm',
    clear: () => db.drillItems.clear(),
  },
  {
    pgTable: 'drill_attempts',
    load: () => db.drillAttempts.toArray(),
    save: async (rows) => {
      await db.drillAttempts.bulkPut(rows as DrillAttempt[])
    },
    clear: () => db.drillAttempts.clear(),
  },
  {
    pgTable: 'conversation_sessions',
    load: () => db.conversationSessions.toArray(),
    save: async (rows) => {
      await db.conversationSessions.bulkPut(rows as ConversationSession[])
    },
    clear: () => db.conversationSessions.clear(),
  },
  {
    pgTable: 'conversation_turns',
    load: () => db.conversationTurns.toArray(),
    save: async (rows) => {
      await db.conversationTurns.bulkPut(rows as ConversationTurn[])
    },
    clear: () => db.conversationTurns.clear(),
  },
  {
    pgTable: 'lesson_logs',
    load: () => db.lessonLogs.toArray(),
    save: async (rows) => {
      await db.lessonLogs.bulkPut(rows as LessonLog[])
    },
    clear: () => db.lessonLogs.clear(),
  },
  {
    pgTable: 'scenarios',
    load: () => db.scenarios.toArray(),
    save: async (rows) => {
      await db.scenarios.bulkPut(rows as Scenario[])
    },
    // Only user-created scenarios — the 20 seed scenarios ship with the app bundle.
    pushFilter: (row) => (row as Scenario).custom === true,
    clear: () => db.scenarios.clear(),
  },
]
