import { useEffect, useState } from 'react'
import { Card } from '../../../components/ui'
import {
  type ThemeChoice,
  currentDark,
  readThemeChoice,
  setTheme,
  subscribeTheme,
} from '../../../state/theme'

const OPTIONS: { value: ThemeChoice; label: string; icon: string; hint: string }[] = [
  { value: 'system', label: 'System', icon: '🖥️', hint: 'Follow your device setting' },
  { value: 'light', label: 'Light', icon: '☀️', hint: 'Bright surfaces' },
  { value: 'dark', label: 'Dark', icon: '🌙', hint: 'Easy on the eyes at night' },
]

export default function AppearanceSection() {
  const [choice, setChoice] = useState<ThemeChoice>(() => readThemeChoice(window.localStorage))
  const [dark, setDark] = useState<boolean>(() => currentDark())

  // The header toggle can change the theme while this page is open — stay in sync.
  useEffect(
    () =>
      subscribeTheme((nextChoice, nextDark) => {
        setChoice(nextChoice)
        setDark(nextDark)
      }),
    [],
  )

  return (
    <Card
      title="Appearance"
      description="Light, dark, or follow your system. Saved in this browser."
    >
      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
        {OPTIONS.map((opt) => {
          const active = choice === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(opt.value)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                active
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 bg-surface hover:border-indigo-300'
              }`}
            >
              <span className="text-2xl" aria-hidden="true">
                {opt.icon}
              </span>
              <span className="mt-2 block text-sm font-semibold text-slate-900">{opt.label}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{opt.hint}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Currently rendering: {dark ? 'dark' : 'light'}
        {choice === 'system' ? ' (following system)' : ''} · quick toggle also in the header.
      </p>
    </Card>
  )
}