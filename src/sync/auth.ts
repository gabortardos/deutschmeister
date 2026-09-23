/** Pure auth helpers — no Supabase/React imports, fully unit-testable. */

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Password must be at least 6 characters.'
  if (password.length > 72) return 'Password must be at most 72 characters.'
  return null
}

/** Maps Supabase auth API errors to short, actionable messages (same style as adapter.ts). */
export function mapAuthError(error: string): string {
  const e = error.toLowerCase()
  if (e.includes('invalid login credentials')) return 'Wrong email or password.'
  if (e.includes('email not confirmed')) {
    return 'Please confirm your email first — check your inbox (and spam folder).'
  }
  if (e.includes('already registered')) {
    return 'An account with this email already exists — try signing in instead.'
  }
  if (e.includes('password should be at least')) {
    return 'Password too short — use at least 6 characters.'
  }
  if (e.includes('rate limit') || e.includes('too many')) {
    return 'Too many attempts — wait a minute and try again.'
  }
  if (e.includes('failed to fetch') || e.includes('networkerror') || e.includes('load failed')) {
    return 'Network error — check your connection and try again.'
  }
  if (e.includes('provider is not enabled')) {
    return 'Google sign-in is not enabled on the server yet — use email for now.'
  }
  if (e.includes('signups not allowed') || e.includes('signup disabled')) {
    return 'Creating accounts is currently disabled on the server.'
  }
  if (e.includes('unable to validate email')) return 'That email address looks invalid.'
  return 'Something went wrong — please try again.'
}
