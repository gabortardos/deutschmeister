import { describe, expect, it } from 'vitest'
import { mapAuthError, validateEmail, validatePassword } from '../auth'
import { readSupabaseEnv } from '../supabaseClient'

describe('readSupabaseEnv', () => {
  it('returns null when values are missing', () => {
    expect(readSupabaseEnv({})).toBeNull()
    expect(readSupabaseEnv({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toBeNull()
    expect(readSupabaseEnv({ VITE_SUPABASE_ANON_KEY: 'key' })).toBeNull()
  })

  it('rejects non-https origins', () => {
    expect(
      readSupabaseEnv({ VITE_SUPABASE_URL: 'http://localhost:54321', VITE_SUPABASE_ANON_KEY: 'key' }),
    ).toBeNull()
  })

  it('trims input and strips a trailing slash from the URL', () => {
    expect(
      readSupabaseEnv({
        VITE_SUPABASE_URL: ' https://demo.supabase.co/ ',
        VITE_SUPABASE_ANON_KEY: ' anon-key ',
      }),
    ).toEqual({ url: 'https://demo.supabase.co', anonKey: 'anon-key' })
  })
})

describe('validateEmail', () => {
  it('accepts simple addresses (trimmed)', () => {
    expect(validateEmail('a@b.co')).toBe(true)
    expect(validateEmail(' a@b.co ')).toBe(true)
  })

  it('rejects malformed addresses', () => {
    expect(validateEmail('nope')).toBe(false)
    expect(validateEmail('a@b')).toBe(false)
    expect(validateEmail('a b@c.de')).toBe(false)
    expect(validateEmail('')).toBe(false)
  })
})

describe('validatePassword', () => {
  it('enforces the 6-char minimum (Supabase default)', () => {
    expect(validatePassword('12345')).toMatch(/at least 6/i)
    expect(validatePassword('123456')).toBeNull()
  })

  it('enforces the 72-char maximum', () => {
    expect(validatePassword('x'.repeat(72))).toBeNull()
    expect(validatePassword('x'.repeat(73))).toMatch(/at most 72/i)
  })
})

describe('mapAuthError', () => {
  it('maps known Supabase errors to friendly copy', () => {
    expect(mapAuthError('Invalid login credentials')).toBe('Wrong email or password.')
    expect(mapAuthError('Email not confirmed')).toMatch(/confirm your email/i)
    expect(mapAuthError('User already registered')).toMatch(/already exists/i)
    expect(mapAuthError('Password should be at least 6 characters')).toMatch(/at least 6/i)
    expect(mapAuthError('Rate limit exceeded')).toMatch(/too many/i)
    expect(mapAuthError('Failed to fetch')).toMatch(/network/i)
    expect(mapAuthError('Provider is not enabled')).toMatch(/google/i)
  })

  it('falls back to a generic message for unknown errors', () => {
    expect(mapAuthError('Something exotic happened')).toBe('Something went wrong — please try again.')
  })
})
