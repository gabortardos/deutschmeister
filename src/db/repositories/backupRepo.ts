import { db } from '../dexie'
import { clearLlmLog, LLM_LOG_KEY } from '../../llm/adapter'

export interface BackupFile {
  app: 'deutschmeister'
  version: number
  exportedAt: string
  tables: Record<string, unknown[]>
}

const TABLE_NAMES = [
  'userProfiles',
  'vocabWords',
  'vocabCards',
  'grammarTopics',
  'drillItems',
  'drillAttempts',
  'conversationSessions',
  'conversationTurns',
  'lessonLogs',
  'scenarios',
  'settings',
  'llmCache',
] as const

export async function exportAll(): Promise<BackupFile> {
  const tables: Record<string, unknown[]> = {}
  for (const name of TABLE_NAMES) {
    tables[name] = await db.table(name).toArray()
  }
  return {
    app: 'deutschmeister',
    version: 1,
    exportedAt: new Date().toISOString(),
    tables,
  }
}

export function isBackupFile(value: unknown): value is BackupFile {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return v.app === 'deutschmeister' && typeof v.tables === 'object' && v.tables !== null
}

/** Replaces ALL local data with the backup's contents. */
export async function importAll(backup: BackupFile): Promise<void> {
  if (!isBackupFile(backup)) throw new Error('Not a valid DeutschMeister backup file')
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear()
    }
    for (const name of TABLE_NAMES) {
      const rows = backup.tables[name]
      if (Array.isArray(rows) && rows.length > 0) {
        await db.table(name).bulkPut(rows as never[])
      }
    }
  })
}

/** Clears learning progress; keeps content (words, topics, scenarios) and settings. */
export async function resetProgress(): Promise<void> {
  await db.transaction(
    'rw',
    [db.vocabCards, db.drillAttempts, db.lessonLogs, db.conversationSessions, db.conversationTurns, db.llmCache],
    async () => {
      await db.vocabCards.clear()
      await db.drillAttempts.clear()
      await db.lessonLogs.clear()
      await db.conversationSessions.clear()
      await db.conversationTurns.clear()
      await db.llmCache.clear()
    },
  )
  void LLM_LOG_KEY
}

/** Full wipe: database + local diagnostics log. Reload afterwards. */
export async function factoryReset(): Promise<void> {
  await db.delete()
  clearLlmLog()
  void LLM_LOG_KEY
}
