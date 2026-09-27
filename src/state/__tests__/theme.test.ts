import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  THEME_STORAGE_KEY,
  applyDark,
  readThemeChoice,
  resolveDark,
  setTheme,
  subscribeTheme,
  writeThemeChoice,
} from '../theme'

// M10.2: theme state is dependency-injected pure logic + thin browser glue.
// The node test env has no DOM, so stub localStorage/window/document like
// welcome.test.ts does.

function fakeStorage(initial: Record<string, string> = {}) {
  const mem = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
    _mem: mem,
  }
}

function fakeElement() {
  const classes = new Set<string>()
  return {
    classList: {
      toggle: (cls: string, force: boolean) => {
        if (force) classes.add(cls)
        else classes.delete(cls)
        return force
      },
      contains: (cls: string) => classes.has(cls),
    },
    _classes: classes,
  }
}

describe('readThemeChoice / writeThemeChoice', () => {
  beforeEach(() => {
    const mem = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => mem.delete(k),
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('defaults to system when nothing is stored', () => {
    expect(readThemeChoice(localStorage)).toBe('system')
  })

  it('rejects unknown stored values', () => {
    for (const bad of ['banana', '', 'DARK', 'light-mode']) {
      localStorage.setItem(THEME_STORAGE_KEY, bad)
      expect(readThemeChoice(localStorage)).toBe('system')
    }
  })

  it('round-trips each valid choice', () => {
    for (const choice of ['system', 'light', 'dark'] as const) {
      writeThemeChoice(localStorage, choice)
      expect(readThemeChoice(localStorage)).toBe(choice)
    }
  })

  it('falls back to system for unknown stored values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'banana')
    expect(readThemeChoice(localStorage)).toBe('system')
  })
})

describe('resolveDark', () => {
  it('dark choice is always dark, light always light', () => {
    expect(resolveDark('dark', false)).toBe(true)
    expect(resolveDark('dark', true)).toBe(true)
    expect(resolveDark('light', false)).toBe(false)
    expect(resolveDark('light', true)).toBe(false)
  })

  it('system follows the OS preference', () => {
    expect(resolveDark('system', true)).toBe(true)
    expect(resolveDark('system', false)).toBe(false)
  })
})

describe('applyDark', () => {
  it('toggles the dark class on the element', () => {
    const el = fakeElement()
    applyDark(el, true)
    expect(el._classes.has('dark')).toBe(true)
    applyDark(el, false)
    expect(el._classes.has('dark')).toBe(false)
  })
})

describe('setTheme (browser glue with stubbed globals)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('persists the choice, toggles <html>, and notifies subscribers', () => {
    const storage = fakeStorage({ [THEME_STORAGE_KEY]: 'system' })
    const el = fakeElement()
    vi.stubGlobal('window', {
      localStorage: storage,
      matchMedia: () => ({ matches: true }), // OS prefers dark
    })
    vi.stubGlobal('document', { documentElement: el })

    const seen: Array<[string, boolean]> = []
    const unsubscribe = subscribeTheme((choice, dark) => seen.push([choice, dark]))

    setTheme('light')
    expect(storage._mem.get(THEME_STORAGE_KEY)).toBe('light')
    expect(el._classes.has('dark')).toBe(false) // explicit light beats OS dark
    setTheme('system')
    expect(el._classes.has('dark')).toBe(true) // now follows the OS
    expect(seen).toEqual([
      ['light', false],
      ['system', true],
    ])
    unsubscribe()
  })
})