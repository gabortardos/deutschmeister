import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Field, inputClass } from '../../components/ui'
import type { CefrLevel } from '../../db/types'
import { setApiKey } from '../../llm/keyStore'
import { PROVIDERS, type ProviderId } from '../../llm/providers'
import { useAppStore } from '../../state/store'
import { signInEmail, signInWithGoogle, signUpEmail } from '../../sync/authActions'
import { useAuthStore } from '../../sync/authStore'
import {
  WELCOME_GOALS,
  WELCOME_LEVELS,
  markWelcomeDone,
  normalizeName,
  validateBasics,
} from './welcome'

const STEP_TITLES = ['Welcome', 'Your account', 'A few basics', 'AI setup'] as const

/**
 * M9.5 first-visit welcome & onboarding flow (/welcome). Four steps: what the
 * app is → optional account (Google / email / guest) → name, level, daily goal
 * → an EXPLICIT AI choice: the included DeutschMeister teaser (properly
 * introduced — what it offers, its limits, the live meter, what happens when it
 * runs out) vs the user's own API key. Auto-opens once per browser (flag in
 * localStorage); "Replay welcome tour" in Settings → Getting started re-opens it.
 */
export default function WelcomeFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const finish = (): void => {
    markWelcomeDone()
    navigate('/')
  }

  return (
    <Card
      title="Willkommen bei DeutschMeister 👋"
      description={`Step ${step + 1} of ${STEP_TITLES.length} — ${STEP_TITLES[step]}`}
    >
      <div className="mb-5 flex gap-1.5" aria-hidden>
        {STEP_TITLES.map((t, i) => (
          <span
            key={t}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-indigo-600' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      {step === 0 && <StepIntro onNext={() => setStep(1)} />}
      {step === 1 && <StepAccount onNext={() => setStep(2)} onBack={() => setStep(0)} />}
      {step === 2 && <StepBasics onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <StepAiChoice onBack={() => setStep(2)} onFinish={finish} />}
    </Card>
  )
}

/* ------------------------------------------------------------------ Step 1 */

function StepIntro({ onNext }: { onNext: () => void }) {
  const items: Array<[string, string]> = [
    [
      '📚',
      'A complete German core: 1,000+ words with smart spaced repetition, grammar from A1 up, listening & speaking practice — all works offline, no account needed.',
    ],
    [
      '🗣️',
      'An AI tutor you can actually talk to: role-play scenarios that correct your mistakes, explain grammar, and speak with HD voices.',
    ],
    [
      '🔐',
      'Your data stays yours: progress lives in your browser (optional cloud sync), and AI runs either on our included credit or on YOUR own API key.',
    ],
  ]
  return (
    <div className="grid gap-4">
      {items.map(([icon, text]) => (
        <div key={icon} className="flex items-start gap-3">
          <span className="text-xl leading-none">{icon}</span>
          <p className="text-sm text-slate-700">{text}</p>
        </div>
      ))}
      <div className="flex justify-end">
        <Button variant="primary" onClick={onNext}>
          Let&apos;s go →
        </Button>
      </div>
    </div>
  )
}

function StepAccount({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { configured, user } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signUp, setSignUp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function run(fn: () => Promise<AuthAction>): Promise<void> {
    setBusy(true)
    setError(null)
    setNotice(null)
    const r = await fn()
    setBusy(false)
    if (!r.ok) {
      setError(r.error ?? 'Something went wrong — try again.')
      return
    }
    setNotice(
      r.needsConfirmation
        ? 'Confirmation email sent — open it, then come back and continue.'
        : 'Signed in ✓',
    )
  }

  const footer = (
    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
      <Button variant="ghost" onClick={onBack}>
        ← Back
      </Button>
      <Button variant="ghost" onClick={onNext}>
        Continue as guest →
      </Button>
    </div>
  )

  if (user) {
    return (
      <div className="grid gap-4">
        <p className="flex items-center gap-2 text-sm text-slate-700">
          <Badge tone="ok">signed in</Badge>
          {user.email} — your progress now syncs across devices.
        </p>
        <div className="flex justify-end">
          <Button variant="primary" onClick={onNext}>
            Continue →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-slate-700">
        Optional — with a free account your progress syncs across devices and the included AI
        credit switches on. Everything also works as a guest; you can sign in any time later in
        Settings → Account.
      </p>
      {configured ? (
        <>
          <Button disabled={busy} onClick={() => void run(signInWithGoogle)}>
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> or with email{' '}
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <form
            className="grid max-w-sm gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              void run(() =>
                signUp
                  ? signUpEmail(email.trim(), password)
                  : signInEmail(email.trim(), password),
              )
            }}
          >
            <Field label="Email">
              <input
                className={inputClass}
                type="email"
                required
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password">
              <input
                className={inputClass}
                type="password"
                required
                minLength={6}
                value={password}
                autoComplete={signUp ? 'new-password' : 'current-password'}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={busy}>
                {signUp ? 'Create account' : 'Sign in'}
              </Button>
              <button
                type="button"
                className="text-xs text-indigo-600 hover:underline"
                onClick={() => setSignUp((v) => !v)}
              >
                {signUp ? 'I already have an account' : 'No account yet? Sign up'}
              </button>
            </div>
          </form>
        </>
      ) : (
        <p className="text-xs text-slate-400">
          Accounts aren&apos;t available in this build — continue as guest.
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {notice && (
        <p className="flex items-center justify-between gap-3 text-xs text-emerald-700">
          <span>{notice}</span>
          {notice === 'Signed in ✓' && (
            <Button variant="ghost" onClick={onNext}>
              Continue →
            </Button>
          )}
        </p>
      )}
      {footer}
    </div>
  )
}

/* ------------------------------------------------------------------ Step 3 */

const GOAL_LABELS: Record<number, string> = {
  5: 'casual',
  10: 'steady',
  15: 'serious',
  20: 'intensive',
}

function StepBasics({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const profile = useAppStore((s) => s.profile)
  const patchProfile = useAppStore((s) => s.patchProfile)
  const [name, setName] = useState(profile?.name.trim() ? profile.name : '')
  const [level, setLevel] = useState<CefrLevel>(
    profile && WELCOME_LEVELS.includes(profile.level) ? profile.level : 'A1',
  )
  const [goal, setGoal] = useState<number>(
    profile && WELCOME_GOALS.includes(profile.dailyWordGoal) ? profile.dailyWordGoal : 10,
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function next(): Promise<void> {
    const err = validateBasics({ name, level, dailyWordGoal: goal })
    setError(err)
    if (err) return
    setBusy(true)
    await patchProfile({ name: normalizeName(name), level, dailyWordGoal: goal })
    setBusy(false)
    onNext()
  }

  return (
    <div className="grid gap-4">
      <Field label="What should we call you?">
        <input
          className={inputClass}
          value={name}
          maxLength={60}
          placeholder="Name or nickname"
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Your rough level">
        <div className="flex flex-wrap gap-2">
          {WELCOME_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                level === l
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Not sure? Pick a guess — you can take the placement test later (Grammar → Placement).
        </p>
      </Field>
      <Field label="Daily word goal">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {WELCOME_GOALS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGoal(g)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                goal === g
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="font-medium">{g} / day</span>{' '}
              <span className="text-xs text-slate-400">{GOAL_LABELS[g]}</span>
            </button>
          ))}
        </div>
      </Field>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button variant="primary" disabled={busy} onClick={() => void next()}>
          Continue →
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Step 4 */

function StepAiChoice({ onBack, onFinish }: { onBack: () => void; onFinish: () => void }) {
  const user = useAuthStore((s) => s.user)
  const patchSettings = useAppStore((s) => s.patchSettings)
  const [choice, setChoice] = useState<'teaser' | 'own'>('teaser')
  const [provider, setProvider] = useState<ProviderId>('glm-zai')
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)

  const providerInfo = PROVIDERS.find((p) => p.id === provider)

  async function saveOwnKey(): Promise<void> {
    if (!providerInfo || !key.trim()) return
    setApiKey(key.trim())
    setBusy(true)
    await patchSettings({
      provider,
      baseUrl: providerInfo.baseUrl,
      model: providerInfo.defaultModel,
    })
    setBusy(false)
    onFinish()
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-slate-700">
        The AI layer is optional and you choose how it runs — you can change this any time in
        Settings.
      </p>

      {/* Teaser card */}
      <label
        className={`block cursor-pointer rounded-xl border p-4 transition-colors ${
          choice === 'teaser' ? 'border-indigo-600 bg-indigo-50/60' : 'border-slate-200 bg-white'
        }`}
      >
        <input
          type="radio"
          className="sr-only"
          checked={choice === 'teaser'}
          onChange={() => setChoice('teaser')}
        />
        <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
          Try the included AI <Badge tone="ok">recommended</Badge>
        </span>
        <ul className="mt-2 grid gap-1.5 text-xs text-slate-600">
          <li>
            • Starts with a <strong>$1 AI credit</strong> (≈ 700 tutor turns) — metered live,
            always visible in Settings → Billing.
          </li>
          <li>• Includes the HD German voices (~20,000 spoken characters / month).</li>
          <li>
            • When it runs out: add your own key (free) or pick a membership — nothing is ever
            auto-charged.
          </li>
        </ul>
        {user === null && (
          <p className="mt-2 text-xs text-amber-600">
            Needs a (free) account — you continued as guest. Sign in later in Settings → Account
            to switch this on.
          </p>
        )}
      </label>

      {/* BYO card */}
      <label
        className={`block cursor-pointer rounded-xl border p-4 transition-colors ${
          choice === 'own' ? 'border-indigo-600 bg-indigo-50/60' : 'border-slate-200 bg-white'
        }`}
      >
        <input
          type="radio"
          className="sr-only"
          checked={choice === 'own'}
          onChange={() => setChoice('own')}
        />
        <span className="text-sm font-medium text-slate-800">Use my own API key</span>
        <p className="mt-1 text-xs text-slate-600">
          100% free forever — your AI calls go straight from this browser to the provider, nothing
          is metered or stored by us.
        </p>
        {choice === 'own' && (
          <div className="mt-3 grid max-w-md gap-3" onClick={(e) => e.stopPropagation()}>
            <Field label="Provider">
              <select
                className={inputClass}
                value={provider}
                onChange={(e) => setProvider(e.target.value as ProviderId)}
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="API key">
              <input
                className={inputClass}
                type="password"
                value={key}
                placeholder="Paste your key"
                autoComplete="off"
                onChange={(e) => setKey(e.target.value)}
              />
            </Field>
            {providerInfo && (
              <p className="text-xs text-slate-400">
                No key yet?{' '}
                <a
                  className="text-indigo-600 hover:underline"
                  href={providerInfo.keyUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Get one here
                </a>{' '}
                — the key is stored only in this browser.
              </p>
            )}
          </div>
        )}
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onFinish}>
            Decide later in Settings
          </Button>
          {choice === 'teaser' ? (
            <Button variant="primary" onClick={onFinish}>
              Start learning 🚀
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={!key.trim() || busy}
              onClick={() => void saveOwnKey()}
            >
              Save key &amp; start
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Step 2 */

interface AuthAction {
  ok: boolean
  error?: string
  needsConfirmation?: boolean
}
