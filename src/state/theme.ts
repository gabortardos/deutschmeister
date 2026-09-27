// M10.2 theme state. The choice persists in localStorage ('dm.theme'); the
// actual toggle is the `dark` class on <html> so the CSS-var design tokens in
// index.css apply before React mounts (the inline script in index.html does
// the very first paint to avoid a flash). Pure helpers below are dependency-
// injected so they stay unit-testable in the node vitest environment.

export type ThemeChoice = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'dm.theme'
export const THEME_CHOICES: readonly ThemeChoice[] = ['system', 'light', 'dark']

export function isThemeChoice(value: string | null): value is ThemeChoice {
  return (THEME_CHOICES as readonly string[]).includes(value ?? '')
}

/** Read + validate the stored choice; anything unknown (or absent) = 'system'. */
export function readThemeChoice(storage: Pick<Storage, 'getItem'>): ThemeChoice {
  const raw = storage.getItem(THEME_STORAGE_KEY)
  return isThemeChoice(raw) ? raw : 'system'
}

export function writeThemeChoice(
  storage: Pick<Storage, 'setItem' | 'removeItem'>,
  choice: ThemeChoice,
): void {
  storage.setItem(THEME_STORAGE_KEY, choice)
}

/** Whether the resolved theme is dark. 'system' follows the OS preference. */
export function resolveDark(choice: ThemeChoice, systemPrefersDark: boolean): boolean {
  return choice === 'dark' || (choice === 'system' && systemPrefersDark)
}

/** Minimal element shape applyDark needs (a real element satisfies this). */
export interface ThemeRootElement {
  classList: { toggle(cls: string, force: boolean): unknown }
}

export function applyDark(element: ThemeRootElement, dark: boolean): void {
  element.classList.toggle('dark', dark)
}

// --- Reactive plumbing ------------------------------------------------------
// Header toggle + Settings radios both need to re-render on change; a tiny
// module-level pub/sub avoids pulling zustand into a browser-global concern.

type ThemeListener = (choice: ThemeChoice, dark: boolean) => void
const listeners = new Set<ThemeListener>()

export function subscribeTheme(listener: ThemeListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notify(choice: ThemeChoice, dark: boolean): void {
  for (const listener of listeners) listener(choice, dark)
}

// --- Browser wiring (thin glue; covered by the anti-flash script + tsc) ------

export function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

export function currentDark(): boolean {
  return (
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )
}

/** Persist a choice, apply it, and notify subscribers. */
export function setTheme(choice: ThemeChoice): void {
  writeThemeChoice(window.localStorage, choice)
  const dark = resolveDark(choice, systemPrefersDark())
  applyDark(document.documentElement, dark)
  notify(choice, dark)
}

/**
 * Apply the stored/system theme at startup and keep following OS changes while
 * the choice is 'system'. Returns a cleanup (unused in the app shell).
 */
export function initTheme(): () => void {
  const choice = readThemeChoice(window.localStorage)
  applyDark(document.documentElement, resolveDark(choice, systemPrefersDark()))
  if (typeof window.matchMedia !== 'function') return () => undefined
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (readThemeChoice(window.localStorage) === 'system') {
      const dark = query.matches
      applyDark(document.documentElement, dark)
      notify('system', dark)
    }
  }
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}