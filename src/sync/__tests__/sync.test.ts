import { describe, expect, it } from 'vitest'
import { planMerge, type SyncRow } from '../syncEngine'
import { mapSyncError } from '../syncErrors'
import { syncAdapters } from '../../db/repositories/syncRepo'

function row(id: string, updatedAt: number, data: unknown = { id }): SyncRow {
  return { id, updatedAt, data }
}

describe('planMerge (last-write-wins)', () => {
  it('pulls remote-only rows and pushes local-only rows', () => {
    const plan = planMerge([row('a', 1)], [row('b', 1)])
    expect(plan.toPull.map((r) => r.id)).toEqual(['b'])
    expect(plan.toPush.map((r) => r.id)).toEqual(['a'])
  })

  it('pulls newer remote rows', () => {
    const plan = planMerge([row('a', 100)], [row('a', 200)])
    expect(plan.toPull).toHaveLength(1)
    expect(plan.toPush).toHaveLength(0)
  })

  it('pushes newer local rows', () => {
    const plan = planMerge([row('a', 300)], [row('a', 200)])
    expect(plan.toPull).toHaveLength(0)
    expect(plan.toPush).toHaveLength(1)
  })

  it('transfers nothing on exact timestamp ties (idempotent)', () => {
    const plan = planMerge([row('a', 100)], [row('a', 100)])
    expect(plan.toPull).toHaveLength(0)
    expect(plan.toPush).toHaveLength(0)
  })

  it('decides per row in mixed sets', () => {
    const plan = planMerge(
      [row('keep-local', 500), row('take-remote', 1), row('new-local', 5)],
      [row('keep-local', 400), row('take-remote', 999), row('new-remote', 7)],
    )
    expect(plan.toPull.map((r) => r.id).sort()).toEqual(['new-remote', 'take-remote'])
    expect(plan.toPush.map((r) => r.id).sort()).toEqual(['keep-local', 'new-local'])
  })
})

describe('mapSyncError', () => {
  it('detects missing cloud tables and guides to the migration', () => {
    expect(mapSyncError('relation "public.user_profiles" does not exist')).toMatch(/0001_init/)
  })

  it('detects RLS / permission problems', () => {
    expect(mapSyncError('new row violates row-level security policy')).toMatch(/RLS/)
  })

  it('detects network failures', () => {
    expect(mapSyncError('Failed to fetch')).toMatch(/network/i)
  })

  it('falls back to a generic message', () => {
    expect(mapSyncError('something odd')).toBe('Sync failed — please try again.')
  })
})

describe('syncAdapters registry', () => {
  it('covers all 10 user-data tables with unique Postgres names', () => {
    expect(syncAdapters).toHaveLength(10)
    const names = syncAdapters.map((a) => a.pgTable)
    expect(new Set(names).size).toBe(10)
    for (const expected of [
      'user_profiles',
      'app_settings',
      'vocab_words',
      'vocab_cards',
      'drill_items',
      'drill_attempts',
      'conversation_sessions',
      'conversation_turns',
      'lesson_logs',
      'scenarios',
    ]) {
      expect(names).toContain(expected)
    }
  })

  it('only user-generated content has a push filter', () => {
    const filtered = syncAdapters.filter((a) => a.pushFilter).map((a) => a.pgTable).sort()
    expect(filtered).toEqual(['drill_items', 'scenarios', 'vocab_words'])
  })
})
