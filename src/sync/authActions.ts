import { getSupabase } from './supabaseClient'
import { appUrl } from './authStore'

export interface AuthActionResult {
  ok: boolean
  error?: string
  /** signUp: true when a confirmation email was sent (no session yet). */
  needsConfirmation?: boolean
}

const NOT_CONFIGURED = 'Accounts are not enabled in this build.'

export async function signInWithGoogle(): Promise<AuthActionResult> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: NOT_CONFIGURED }
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: appUrl() },
  })
  return error ? { ok: false, error: error.message } : { ok: true } // full-page redirect follows
}

export async function signInEmail(email: string, password: string): Promise<AuthActionResult> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: NOT_CONFIGURED }
  const { error } = await sb.auth.signInWithPassword({ email, password })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function signUpEmail(email: string, password: string): Promise<AuthActionResult> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: NOT_CONFIGURED }
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: appUrl() },
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, needsConfirmation: data.session === null }
}

export async function requestPasswordReset(email: string): Promise<AuthActionResult> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: NOT_CONFIGURED }
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: appUrl() })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function setNewPassword(password: string): Promise<AuthActionResult> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: NOT_CONFIGURED }
  const { error } = await sb.auth.updateUser({ password })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function signOut(): Promise<AuthActionResult> {
  const sb = getSupabase()
  if (!sb) return { ok: false, error: NOT_CONFIGURED }
  const { error } = await sb.auth.signOut()
  return error ? { ok: false, error: error.message } : { ok: true }
}
