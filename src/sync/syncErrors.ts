/** Pure sync error mapper — friendly, actionable messages (same style as auth.ts). */
export function mapSyncError(error: string): string {
  const e = error.toLowerCase()
  if (e.includes('does not exist') || e.includes('42p01') || e.includes('schema cache')) {
    return 'Cloud sync is not set up yet — run supabase/migrations/0001_init.sql in the Supabase SQL editor, then sync again.'
  }
  if (e.includes('row-level security') || e.includes('permission denied') || e.includes('42501')) {
    return 'Sync blocked by permissions (RLS) — re-run the migration SQL, then sign out and back in.'
  }
  if (e.includes('failed to fetch') || e.includes('networkerror') || e.includes('load failed')) {
    return 'Network error — check your connection and try again.'
  }
  if ((e.includes('jwt') || e.includes('token')) && e.includes('expired')) {
    return 'Your sign-in expired — sign out and back in, then retry.'
  }
  if (e.includes('duplicate key') || e.includes('unique constraint')) {
    return 'Sync hit a conflict — press “Sync now” again to converge.'
  }
  return 'Sync failed — please try again.'
}
