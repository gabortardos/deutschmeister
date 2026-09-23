import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client credentials are PUBLIC BY DESIGN (owner-approved plan, PHASE2_PLAN M7):
 * the anon key ships inside the browser bundle — data safety comes from Row-Level Security,
 * never from hiding these values. The service_role key must NEVER appear here.
 */
export interface SupabaseEnv {
  url: string
  anonKey: string
}

/**
 * Pure env reader (injected for tests). Returns null unless BOTH values are present and the
 * URL looks like an https origin — a build without them simply runs in guest-only mode.
 */
export function readSupabaseEnv(env: Record<string, string | undefined>): SupabaseEnv | null {
  const url = env.VITE_SUPABASE_URL?.trim() ?? ''
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
  if (!url || !anonKey) return null
  if (!/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(url)) return null
  return { url: url.replace(/\/+$/, ''), anonKey }
}

let client: SupabaseClient | null = null

/** Lazy singleton; null when the build has no Supabase env (guest-only build). */
export function getSupabase(): SupabaseClient | null {
  if (client) return client
  const env = readSupabaseEnv(import.meta.env as unknown as Record<string, string | undefined>)
  if (!env) return null
  client = createClient(env.url, env.anonKey, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
  })
  return client
}

/** Edge Function base URL (…/functions/v1); null when the build has no env (M8 ai-proxy). */
export function supabaseFunctionsUrl(): string | null {
  const env = readSupabaseEnv(import.meta.env as unknown as Record<string, string | undefined>)
  return env ? `${env.url}/functions/v1` : null
}
