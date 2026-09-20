/**
 * The API key lives ONLY in localStorage (never in IndexedDB, never in code, never committed).
 * A future iOS build can swap this module for a native secure-storage adapter.
 */
const STORAGE_KEY = 'dm.apiKey'

export function getApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, key.trim())
  } catch {
    // storage full/blocked — settings UI will simply show empty
  }
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Allows loading a key via URL fragment, e.g.
 *   https://<host>/deutschmeister/#/settings?key=YOUR_KEY
 * The fragment never leaves the browser (not sent to any server). The key is
 * stored in localStorage and the URL is cleaned immediately afterwards.
 * Returns true when a key was imported.
 */
export function importKeyFromUrl(): boolean {
  try {
    const hash = window.location.hash
    const queryIndex = hash.indexOf('?')
    if (queryIndex === -1) return false
    const params = new URLSearchParams(hash.slice(queryIndex + 1))
    const key = params.get('key')
    if (!key) return false
    params.delete('key')
    const path = hash.slice(0, queryIndex)
    const rest = params.toString()
    setApiKey(key)
    const nextHash = rest ? `${path}?${rest}` : path
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`)
    return true
  } catch {
    return false
  }
}
