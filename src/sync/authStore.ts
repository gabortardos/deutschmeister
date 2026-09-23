import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { getSupabase } from './supabaseClient'

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

/**
 * Idempotent; called once from the app root (Layout). Creating the client early matters:
 * `detectSessionInUrl` then parses the OAuth / email-confirmation / recovery redirect on
 * the very first page load after coming back from Supabase or Google.
 */
export async function initAuth(): Promise<void> {
  if (initialized) return
  initialized = true
  const sb = getSupabase()
  if (!sb) {
    useAuthStore.setState({ ready: true, configured: false })
    return
  }
  useAuthStore.setState({ configured: true })
  const { data } = await sb.auth.getSession()
  applySession(data.session)
  sb.auth.onAuthStateChange((event, session) => {
    useAuthStore.setState({ recovery: event === 'PASSWORD_RECOVERY' })
    applySession(session)
  })
  useAuthStore.setState({ ready: true })
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
