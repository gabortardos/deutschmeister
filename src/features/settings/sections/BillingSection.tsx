import { useEffect, useState } from 'react'
import {
  closePaddleCheckout,
  openTransactionCheckout,
  parseCheckoutResponse,
} from '../../../billing/paddleClient'
import { Badge, Button, Card } from '../../../components/ui'
import { formatUsdMicros } from '../../../llm/entitlement'
import {
  annualSavingPercent,
  formatEur,
  planById,
  visiblePlans,
  type BillingInterval,
  type PlanId,
} from '../../../llm/plans'
import { usePlatformStore } from '../../../state/platformStore'
import { useAuthStore } from '../../../sync/authStore'
import { getSupabase, supabaseFunctionsUrl } from '../../../sync/supabaseClient'

/**
 * Settings → Account & Billing (M9). Plans are purchased through Paddle
 * checkout — opened as a Paddle.js OVERLAY inside this page (v2.4.1: Paddle
 * Billing's API has no standalone hosted checkout page, so the Edge Function
 * creates a transaction and we open it via Paddle.Checkout.open({transactionId})
 * — card data goes straight to Paddle, never through this app). The grant
 * arrives via the signature-verified `paddle-webhook` Edge Function, which
 * writes the entitlement row the `ai-proxy` enforces. The client never decides
 * entitlements; it only renders what the server publishes and forwards the
 * buyer to Paddle.
 */

interface PaddleOption {
  plan: PlanId
  interval: BillingInterval
  priceId: string
}

async function paddleCheckout<T>(body: Record<string, unknown>): Promise<T> {
  const base = supabaseFunctionsUrl()
  const sb = getSupabase()
  if (!base || !sb) throw new Error('Account features are not enabled in this build.')
  const { data } = await sb.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Please sign in first.')
  const res = await fetch(`${base}/paddle-checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as { message?: string }
  if (!res.ok) {
    throw new Error(
      typeof json?.message === 'string' && json.message
        ? json.message
        : 'The billing service had a problem — please try again.',
    )
  }
  return json as T
}

function UsageBar({ used, cap, label }: { used: number; cap: number; label: string }) {
  const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          {used.toLocaleString('en-US')} / {cap.toLocaleString('en-US')}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-indigo-500'}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  )
}

export default function BillingSection() {
  const { ready, configured, user } = useAuthStore()
  const meter = usePlatformStore()
  const [interval, setInterval] = useState<BillingInterval>('month')
  const [options, setOptions] = useState<PaddleOption[] | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Load the purchasable price IDs from the Edge Function (they differ between
  // sandbox and live — the client bundle never embeds them).
  useEffect(() => {
    if (!user) return
    paddleCheckout<{ options: PaddleOption[] }>({ type: 'plans' })
      .then((r) => setOptions(r.options ?? []))
      .catch(() => setOptions([]))
  }, [user])

  // Returning from a Paddle hosted checkout → refresh the meter + welcome note.
  useEffect(() => {
    if (window.location.hash.includes('billing=success')) {
      setNotice('Thanks for subscribing! Your plan is being activated — this page updates in a few seconds.')
      void meter.refresh()
      window.location.hash = '#/settings'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready || !configured || !user) {
    return (
      <Card
        title="Account &amp; Billing"
        description="Paid plans add the managed AI tutor and HD voice — no API key needed."
      >
        <p className="text-sm text-slate-500">
          Sign in above to see plans and manage a subscription. Everything else in the app stays
          free — and if you bring your own API key, every AI feature stays free forever.
        </p>
      </Card>
    )
  }

  const plan = planById(meter.plan) ?? planById('free')!
  const remaining = Math.max(0, meter.capUsdMicros - meter.spendUsdMicros)
  const validUntilText = meter.validUntil
    ? new Date(meter.validUntil).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  async function subscribe(planId: PlanId, priceInterval: BillingInterval) {
    const option = (options ?? []).find((o) => o.plan === planId && o.interval === priceInterval)
    if (!option) {
      setError('This plan is not available yet — check back shortly.')
      return
    }
    setBusy(`${planId}-${priceInterval}`)
    setError('')
    const buyerEmail = user?.email ?? undefined
    try {
      const r = await paddleCheckout<unknown>({ type: 'checkout', priceId: option.priceId })
      const session = parseCheckoutResponse(r)
      if (!session) throw new Error('Paddle did not return a checkout session.')
      const overlayOpened =
        session.transactionId !== null &&
        session.clientToken !== null &&
        (await openTransactionCheckout({
          env: session.env,
          clientToken: session.clientToken,
          transactionId: session.transactionId,
          customerEmail: buyerEmail,
          onCompleted: () => void afterPurchase(),
        }))
      if (!overlayOpened) {
        // Fallback: redirect to Paddle's checkout payment link (only useful when
        // the account's default payment link points at this app — M9_DEPLOY 2B).
        if (session.url) window.location.assign(session.url)
        else throw new Error('Paddle checkout could not be opened.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }

  /** Overlay paid: close it, then poll the meter until the webhook grants the plan. */
  async function afterPurchase() {
    closePaddleCheckout()
    setNotice('Payment received — activating your plan (usually a few seconds)…')
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      try {
        await usePlatformStore.getState().refresh()
      } catch {
        // network hiccup — keep polling, the webhook may still land
      }
      if (usePlatformStore.getState().plan !== 'free') {
        setNotice('Thanks for subscribing! Your plan is active.')
        return
      }
    }
    setNotice('Payment received — if the plan badge has not switched yet, refresh in a minute.')
  }

  async function manage() {
    setBusy('portal')
    setError('')
    try {
      const r = await paddleCheckout<{ url: string }>({ type: 'portal' })
      if (typeof r.url === 'string' && r.url) window.location.assign(r.url)
      else throw new Error('Could not open the billing portal.')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }
  return (
    <Card
      title="Account &amp; Billing"
      description="Managed plans use our AI keys (Paddle handles checkout, VAT and receipts). Your own API key always stays free."
    >
      <div className="space-y-5">
        {/* --- current plan + usage ---------------------------------------------------------- */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">Current plan: {plan.name}</span>
            <Badge tone={plan.id === 'free' ? 'ok' : 'warn'}>{plan.id === 'free' ? 'Free' : 'Active'}</Badge>
            {validUntilText && (
              <span className="text-xs text-slate-500">
                {meter.cancelAtPeriodEnd ? 'ends' : 'renews'} {validUntilText}
              </span>
            )}
          </div>
          <div className="mt-3 space-y-3">
            <UsageBar
              used={meter.spendUsdMicros}
              cap={meter.capUsdMicros}
              label={'Managed AI budget — ' + formatUsdMicros(remaining) + ' left'}
            />
            {meter.ttsCharCap > 0 ? (
              <UsageBar
                used={meter.ttsCharsUsed}
                cap={meter.ttsCharCap}
                label="HD voice characters (this month)"
              />
            ) : (
              <p className="text-sm text-slate-500">
                HD cloud voice: not in this plan — browser voices keep working free (Plus adds it).
              </p>
            )}
          </div>
          {meter.plan !== 'free' && (
            <div className="mt-3">
              <Button variant="secondary" disabled={busy !== ''} onClick={() => void manage()}>
                {busy === 'portal' ? 'Opening…' : 'Manage subscription (Paddle)'}
              </Button>
            </div>
          )}
        </div>

        {/* --- pricing cards ------------------------------------------------------------------ */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            {(['month', 'year'] as BillingInterval[]).map((i) => {
              const saving = annualSavingPercent(5.99, 49.99)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInterval(i)}
                  className={
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ' +
                    (interval === i ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white text-slate-600')
                  }
                >
                  {i === 'month' ? 'Monthly' : 'Annual (−' + saving + '%)'}
                </button>
              )
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {visiblePlans()
              .filter((p) => p.id !== 'free')
              .map((p) => {
                const price = interval === 'month' ? p.monthlyEur! : (p.annualEur ?? p.monthlyEur! * 12)
                const perMonth = interval === 'month' ? formatEur(price) : formatEur(price / 12) + '/mo'
                const isCurrent = meter.plan === p.id
                const saving =
                  interval === 'year' && p.monthlyEur && p.annualEur
                    ? annualSavingPercent(p.monthlyEur, p.annualEur)
                    : 0
                return (
                  <div
                    key={p.id}
                    className={
                      'rounded-xl border p-4 ' +
                      (p.badge ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200 bg-white')
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{p.name}</span>
                      {p.badge && <Badge tone="warn">⭐ {p.badge}</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{p.tagline}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {perMonth}
                      {interval === 'year' && (
                        <span className="ml-1 text-sm font-medium text-emerald-600">
                          {formatEur(price)}/yr · −{saving}%
                        </span>
                      )}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2 text-sm text-slate-600">
                          <span className="text-emerald-600">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4">
                      <Button
                        variant={p.badge ? 'primary' : 'secondary'}
                        className="w-full"
                        disabled={busy !== '' || isCurrent || options === null}
                        onClick={() => void subscribe(p.id, interval)}
                      >
                        {isCurrent
                          ? 'Current plan ✓'
                          : options === null
                            ? 'Loading…'
                            : busy === p.id + '-' + interval
                              ? 'Opening checkout…'
                              : 'Subscribe — ' + formatEur(price) + (interval === 'month' ? '/mo' : '/yr')}
                      </Button>
                    </div>
                  </div>
                )
              })}
          </div>
          {options !== null && options.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">
              Plans are being set up — check back shortly. (Your own API key unlocks everything free
              in the meantime: Settings → AI Model.)
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {notice && <p className="text-sm text-emerald-600">{notice}</p>}
        <p className="text-xs text-slate-400">
          Checkout, receipts and VAT are handled by Paddle (Merchant of Record). Prices in EUR.
          14-day refund policy applies. BYO key users never need to pay.
        </p>
      </div>
    </Card>
  )
}


