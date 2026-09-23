import { useState } from 'react'
import { Badge, Button, Card, Field, inputClass } from '../../../components/ui'
import { mapAuthError, validateEmail, validatePassword } from '../../../sync/auth'
import { useAuthStore } from '../../../sync/authStore'
import { syncNow } from '../../../sync/syncEngine'
import { useSyncStore } from '../../../sync/syncStore'
import {
  requestPasswordReset,
  setNewPassword,
  signInEmail,
  signInWithGoogle,
  signOut,
  signUpEmail,
} from '../../../sync/authActions'

interface AuthActionResultLike {
  ok: boolean
  error?: string
  needsConfirmation?: boolean
}

type Mode = 'signin' | 'signup' | 'forgot'

export default function AccountSection() {
  const { ready, configured, user, recovery } = useAuthStore()
  const sync = useSyncStore()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  if (!ready) return null

  if (!configured) {
    return (
      <Card title="Account" description="Optional — sync your progress across devices.">
        <p className="text-sm text-slate-500">
          Account features are not enabled in this build. The app stays fully usable locally.
        </p>
      </Card>
    )
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setNotice('')
  }

  async function run(action: () => Promise<AuthActionResultLike>) {
    setBusy(true)
    setError('')
    setNotice('')
    const r = await action()
    if (!r.ok && r.error) setError(mapAuthError(r.error))
    setBusy(false)
    return r
  }

  async function submitEmailForm(e: React.FormEvent) {
    e.preventDefault()
    if (!validateEmail(email)) return setError('Please enter a valid email address.')
    if (mode !== 'forgot') {
      const pwError = validatePassword(password)
      if (pwError) return setError(pwError)
      if (mode === 'signup' && password !== confirm) return setError('Passwords do not match.')
    }
    const trimmed = email.trim()
    const result =
      mode === 'signin'
        ? await run(() => signInEmail(trimmed, password))
        : mode === 'signup'
          ? await run(() => signUpEmail(trimmed, password))
          : await run(() => requestPasswordReset(trimmed))
    if (!result.ok) return
    if (mode === 'signup') {
      if (result.needsConfirmation) {
        setNotice('Account created — check your inbox (and spam folder) to confirm, then sign in.')
        switchMode('signin')
        setPassword('')
        setConfirm('')
      } else {
        setNotice('Account created — you are signed in.')
      }
    } else if (mode === 'forgot') {
      setNotice('Password reset link sent — check your inbox.')
      switchMode('signin')
    }
  }

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault()
    const pwError = validatePassword(password)
    if (pwError) return setError(pwError)
    if (password !== confirm) return setError('Passwords do not match.')
    const result = await run(() => setNewPassword(password))
    if (result.ok) {
      useAuthStore.setState({ recovery: false })
      setNotice('Password updated.')
      setPassword('')
      setConfirm('')
    }
  }

  async function doSync(mode: 'merge' | 'claim') {
    setBusy(true)
    setError('')
    const result = await syncNow(mode)
    if (!result.ok) setError(result.error ?? 'Sync failed.')
    setBusy(false)
  }

  function claim() {
    if (
      window.confirm(
        'Push this browser’s data to your account, overwriting matching rows from other devices? Rows that exist only in your account are kept.',
      )
    ) {
      void doSync('claim')
    }
  }

  // Recovery link landed (PASSWORD_RECOVERY): show the set-new-password form first.
  if (recovery) {
    return (
      <Card title="Account" description="You followed a password-reset link. Choose a new password.">
        <form className="max-w-sm space-y-3" onSubmit={submitNewPassword}>
          <Field label="New password" hint="At least 6 characters.">
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Confirm new password">
            <input
              className={inputClass}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-emerald-600">{notice}</p>}
          <Button variant="primary" type="submit" disabled={busy}>
            Save new password
          </Button>
        </form>
      </Card>
    )
  }

  if (user) {
    return (
      <Card
        title="Account"
        description="Optional — learning progress syncs to your account; guest data always stays local."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={sync.status === 'error' ? 'bad' : 'ok'}>
            {sync.status === 'error' ? 'Sync issue' : sync.status === 'syncing' ? 'Syncing…' : 'Signed in'}
          </Badge>
          <span className="text-sm text-slate-700">
            {user.email}{' '}
            <span className="text-slate-400">· {user.provider === 'google' ? 'Google' : 'email'}</span>
          </span>
        </div>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Cloud sync:</span>{' '}
          {sync.status === 'syncing' || sync.status === 'error'
            ? sync.message
            : sync.lastSyncAt
              ? `${new Date(sync.lastSyncAt).toLocaleString()} — ${sync.message}`
              : 'runs automatically when you open the app and after each sign-in.'}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={busy || sync.status === 'syncing'}
            onClick={() => void doSync('merge')}
          >
            Sync now
          </Button>
          <Button
            variant="danger"
            disabled={busy || sync.status === 'syncing'}
            onClick={claim}
            title="Overwrite matching account rows with this browser’s data"
          >
            Use this browser’s data
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => void run(() => signOut())}>
            Sign out
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Your API keys and speech settings always stay in this browser — only learning data is
          ever synced. “Use this browser’s data” overwrites matching account rows with this
          device’s version; rows that exist only in your account are kept.
        </p>
      </Card>
    )
  }

  return (
    <Card
      title="Account"
      description="Optional — sign in to keep your progress safe across devices. Everything keeps working without an account."
    >
      <div className="space-y-4">
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          disabled={busy}
          onClick={() => void run(() => signInWithGoogle())}
        >
          Continue with Google
        </Button>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> or with email{' '}
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <form className="max-w-sm space-y-3" onSubmit={submitEmailForm}>
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </Field>
          {mode !== 'forgot' && (
            <Field label="Password">
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
              />
            </Field>
          )}
          {mode === 'signup' && (
            <Field label="Confirm password">
              <input
                className={inputClass}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-emerald-600">{notice}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" type="submit" disabled={busy}>
              {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            </Button>
            <Button
              variant="ghost"
              type="button"
              disabled={busy}
              onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
            >
              {mode === 'signup' ? '← Sign in instead' : 'Create account'}
            </Button>
            <button
              type="button"
              className="text-xs text-indigo-700 underline disabled:opacity-50"
              disabled={busy}
              onClick={() => switchMode(mode === 'forgot' ? 'signin' : 'forgot')}
            >
              {mode === 'forgot' ? 'Back to sign in' : 'Forgot password?'}
            </button>
          </div>
          {mode === 'signup' && (
            <p className="text-xs text-slate-400">
              You&apos;ll get a confirmation email (check spam) — confirm once, then sign in.
            </p>
          )}
        </form>
      </div>
    </Card>
  )
}
