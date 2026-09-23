import type { SupabaseClient } from '@supabase/supabase-js'
import { syncAdapters } from '../db/repositories/syncRepo'
import type { BaseEntity } from '../db/types'
import { useAppStore } from '../state/store'
import { getSupabase } from './supabaseClient'
import { mapSyncError } from './syncErrors'
import { useSyncStore } from './syncStore'

/** A row in its transport shape: `data` holds the full local entity. */
export interface SyncRow {
  id: string
  updatedAt: number
  data: unknown
}

export interface MergePlan {
  toPull: SyncRow[]
  toPush: SyncRow[]
}

/**
 * Pure last-write-wins planner: per id, the row with the newer `updatedAt` (epoch ms) wins;
 * exact ties keep the local copy and transfer nothing (idempotent re-runs).
 */
export function planMerge(local: SyncRow[], remote: SyncRow[]): MergePlan {
  const localById = new Map(local.map((l) => [l.id, l]))
  const remoteById = new Map(remote.map((r) => [r.id, r]))
  const toPull: SyncRow[] = []
  const toPush: SyncRow[] = []
  for (const r of remote) {
    const l = localById.get(r.id)
    if (!l || r.updatedAt > l.updatedAt) toPull.push(r)
  }
  for (const l of local) {
    const r = remoteById.get(l.id)
    if (!r || l.updatedAt > r.updatedAt) toPush.push(l)
  }
  return { toPull, toPush }
}

export interface SyncOutcome {
  ok: boolean
  pushed: number
  pulled: number
  error?: string
}

const PAGE = 500 // PostgREST max rows per request window; also our upsert chunk size

let inFlight: Promise<SyncOutcome> | null = null

/**
 * Single-flight sync. 'merge' = last-write-wins in both directions (the normal mode,
 * run automatically on sign-in and app start). 'claim' = "this browser's data wins":
 * force-push every pushable local row (same-id remote rows are overwritten); remote-only
 * rows are still pulled down, so nothing is ever silently deleted.
 */
export function syncNow(mode: 'merge' | 'claim' = 'merge'): Promise<SyncOutcome> {
  if (inFlight) return inFlight
  inFlight = runSync(mode).finally(() => {
    inFlight = null
  })
  return inFlight
}

async function runSync(mode: 'merge' | 'claim'): Promise<SyncOutcome> {
  const sb = getSupabase()
  if (!sb) {
    useSyncStore.setState({ status: 'error', message: 'Accounts are not enabled in this build.' })
    return { ok: false, pushed: 0, pulled: 0, error: 'not configured' }
  }
  const { data: sessionData } = await sb.auth.getSession()
  const uid = sessionData.session?.user?.id
  if (!uid) {
    useSyncStore.setState({ status: 'error', message: 'Sign in before syncing.' })
    return { ok: false, pushed: 0, pulled: 0, error: 'not signed in' }
  }
  useSyncStore.setState({
    status: 'syncing',
    message: mode === 'claim' ? 'Pushing this browser’s data to your account…' : 'Syncing…',
  })

  let pushed = 0
  let pulled = 0
  try {
    for (const adapter of syncAdapters) {
      const [allLocal, remote] = await Promise.all([adapter.load(), pullTable(sb, adapter.pgTable)])
      const pushable = adapter.pushFilter ? allLocal.filter(adapter.pushFilter) : allLocal
      const toPull = planMerge(allLocal.map(toSyncRow), remote).toPull
      const pushableRows = pushable.map(toSyncRow)
      const toPush = mode === 'claim' ? pushableRows : planMerge(pushableRows, remote).toPush
      // Pulled payloads were written by our own clients (shape = the entity itself).
      if (toPull.length > 0) await adapter.save(toPull.map((r) => r.data) as BaseEntity[])
      pulled += toPull.length
      for (let i = 0; i < toPush.length; i += PAGE) {
        const chunk = toPush.slice(i, i + PAGE).map((row) => ({
          user_id: uid,
          id: row.id,
          updated_at: row.updatedAt,
          data: row.data,
        }))
        const { error } = await sb.from(adapter.pgTable).upsert(chunk, { onConflict: 'user_id,id' })
        if (error) throw new Error(error.message)
      }
      pushed += toPush.length
    }
    const message = `Synced — ${pushed} row${pushed === 1 ? '' : 's'} up / ${pulled} row${pulled === 1 ? '' : 's'} down.`
    useSyncStore.setState({ status: 'ok', lastSyncAt: Date.now(), message })
    if (pulled > 0) {
      // Remote data landed in Dexie — refresh derived app state (profile, due counts, stats).
      await useAppStore.getState().hydrate()
    }
    return { ok: true, pushed, pulled }
  } catch (e) {
    const message = mapSyncError(e instanceof Error ? e.message : String(e))
    useSyncStore.setState({ status: 'error', message })
    return { ok: false, pushed, pulled, error: message }
  }
}

function toSyncRow(row: { id: string; updatedAt: number }): SyncRow {
  return { id: row.id, updatedAt: row.updatedAt, data: row }
}

async function pullTable(sb: SupabaseClient, pgTable: string): Promise<SyncRow[]> {
  const out: SyncRow[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from(pgTable)
      .select('id, updated_at, data')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as { id: string; updated_at: number | string; data: unknown }[]
    for (const r of rows) out.push({ id: r.id, updatedAt: Number(r.updated_at), data: r.data })
    if (rows.length < PAGE) break
  }
  return out
}
