import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { getSupabase } from './supabaseClient'
import { clearLocalSyncData, shouldResetLocalData, syncNow } from './syncEngine'

export interface AuthUser {
  id: string
  email: string
  provider: 'google' | 'email'
}

interface AuthState {
  /** True once the initial getSession + listener are wired (or the env is known missing). */
  ready: boolean
  /** False when this build has no Supabase env → the Account section explains and hides. */
  configured: boolean
  user: AuthUser | null
  /** PASSWORD_RECOVERY event observed → Settings shows the set-new-password form. */
  recovery: boolean
}

export const useAuthStore = create<AuthState>(() => ({
  ready: false,
  configured: false,
  user: null,
  recovery: false,
}))

let initialized = false

/** localStorage key holding the uid that OWNS the local Dexie data (M13.3). */
const LOCAL_OWNER_KEY = 'dm-local-owner'

function readLocalOwner(): string | null {
  try {
    return localStorage.getItem(LOCAL_OWNER_KEY)
  } catch {
    return null
  }
}

function writeLocalOwner(uid: string): void {
  try {
    localStorage.setItem(LOCAL_OWNER_KEY, uid)
  } catch {
    /* private mode — account switching then falls back to plain merge */
  }
}

/**
 * Idempotent; called once from the app root (Layout). Creating the client early matters:
 * `detectSessionInUrl` then parses the OAuth / email-confirmation / recovery redirect on
 * the very first page load after coming back from Supabase or Google.
 */
export async function initAuth(): Promise<void> {
  if (initialized) return
  initialized = true
  const sb = await getSupabase()
  if (!sb) {
    useAuthStore.setState({ ready: true, configured: false })
    return
  }
  useAuthStore.setState({ configured: true })
  const { data } = await sb.auth.getSession()
  void handleSession(data.session, true)
  sb.auth.onAuthStateChange((event, session) => {
    useAuthStore.setState({ recovery: event === 'PASSWORD_RECOVERY' })
    void handleSession(session, event === 'SIGNED_IN')
  })
  useAuthStore.setState({ ready: true })
}

/**
 * M13.3 account switch: apply the session, and when a DIFFERENT account signs
 * in on this browser, wipe the previous account's local rows BEFORE the first
 * sync — otherwise the old account's learning levels would both stay visible
 * and get pushed into the new account's cloud. After the wipe, `syncNow`
 * pulls the signed-in account's own data down.
 */
async function handleSession(session: Session | null, sync: boolean): Promise<void> {
  applySession(session)
  const uid = session?.user?.id ?? null
  const owner = readLocalOwner()
  if (shouldResetLocalData(owner, uid)) await clearLocalSyncData()
  if (uid) writeLocalOwner(uid)
  if (sync && uid) void syncNow('merge')
}

function applySession(session: Session | null): void {
  const user = session?.user
  if (!user) {
    useAuthStore.setState({ user: null })
    return
  }
  const raw = user.app_metadata?.['provider']
  const provider: AuthUser['provider'] = raw === 'google' ? 'google' : 'email'
  useAuthStore.setState({
    user: { id: user.id, email: user.email ?? '(no email on file)', provider },
  })
}

/** Full app URL — works on the GitHub Pages subpath and on localhost dev alike. */
export function appUrl(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}
