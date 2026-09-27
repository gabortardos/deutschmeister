import type { SupabaseClient } from '@supabase/supabase-js'
// ^ type-only import: erased at build time. The real supabase-js dependency is
// dynamically imported inside getSupabase() so the ~300 KB client family stays
// OUT of the initial chunk (M10.3). Guest builds (no env) never download it.

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

let clientPromise: Promise<SupabaseClient | null> | null = null

/**
 * Async lazy singleton (M10.3): checks the env FIRST, then dynamically imports
 * supabase-js only when configured. Null resolves when the build has no
 * Supabase env (guest-only build). A failed chunk load (e.g. first-ever offline
 * visit) also resolves null but resets the memo so the next call retries.
 * `detectSessionInUrl` still parses the OAuth/recovery redirect — just after
 * the chunk arrives, instead of during bundle evaluation.
 */
export function getSupabase(): Promise<SupabaseClient | null> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const env = readSupabaseEnv(import.meta.env as unknown as Record<string, string | undefined>)
      if (!env) return null
      try {
        const { createClient } = await import('@supabase/supabase-js')
        return createClient(env.url, env.anonKey, {
          auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
        })
      } catch (err) {
        console.error('Failed to load the Supabase client chunk:', err)
        clientPromise = null // allow retry on the next call
        return null
      }
    })()
  }
  return clientPromise
}

/** Edge Function base URL (…/functions/v1); null when the build has no env (M8 ai-proxy). */
export function supabaseFunctionsUrl(): string | null {
  const env = readSupabaseEnv(import.meta.env as unknown as Record<string, string | undefined>)
  return env ? `${env.url}/functions/v1` : null
}
