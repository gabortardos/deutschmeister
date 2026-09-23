import { create } from 'zustand'

export interface SyncState {
  status: 'idle' | 'syncing' | 'ok' | 'error'
  lastSyncAt: number | null
  /** Human-readable status line for the Account section (friendly-mapped on errors). */
  message: string
}

export const useSyncStore = create<SyncState>(() => ({
  status: 'idle',
  lastSyncAt: null,
  message: '',
}))
