import { useEffect, useState } from 'react'
import { Button, Card, Field, inputClass } from '../../../components/ui'
import { llmConfigFromSettings, testConnection, type TestResult } from '../../../llm/adapter'
import { getProvider, PROVIDERS, type ProviderId } from '../../../llm/providers'
import { formatUsdMicros } from '../../../llm/entitlement'
import { useAiRoute } from '../../../state/useLlmDeps'
import { usePlatformStore } from '../../../state/platformStore'
import { useAppStore } from '../../../state/store'

/** Step-by-step key guides per provider (M4.2). Native <details> keeps this dependency-free. */
const PROVIDER_MANUALS: Record<ProviderId, { steps: string[]; warn?: string }> = {
  glm: {
    steps: [
      'Sign up at https://open.bigmodel.cn (phone or email).',
      'Open User Center → API Keys: https://open.bigmodel.cn/usercenter/apikeys',
      'Click “Create API key” and copy the whole key immediately.',
      'Paste it into the API key field above and press “Test connection”.',
    ],
    warn:
      'z.ai keys (including GLM Coding Plan keys) do NOT work in this browser app — api.z.ai sends no CORS headers. You need a key from open.bigmodel.cn; the default model glm-4.5-flash is free-tier.',
  },
  openai: {
    steps: [
      'Sign in at https://platform.openai.com (create an account if needed).',
      'Open API keys: https://platform.openai.com/api-keys → “Create new secret key”.',
      'Copy the key — it is shown only once.',
      'Add a few dollars of credit under Billing (API billing is separate from a ChatGPT subscription).',
      'Paste it into the API key field above and press “Test connection”.',
    ],
    warn:
      'API usage is pay-as-you-go. The default model gpt-4o-mini costs a small fraction of a cent per conversation turn.',
  },
  deepseek: {
    steps: [
      'Sign up at https://platform.deepseek.com.',
      'Open API keys: https://platform.deepseek.com/api_keys → create and copy the key.',
      'Top up a couple of dollars — DeepSeek is among the cheapest providers.',
      'Paste it into the API key field above and press “Test connection”.',
    ],
  },
}

/**
 * M8 free-credit meter + paywall card. Shown when the user has NO key of their
 * own but IS signed in: platform AI is already serving them; this makes the
 * remaining budget visible and — at zero — the paywall with the BYO escape hatch.
 */
function PlatformAiCard() {
  const { loading, spendUsdMicros, capUsdMicros, exhausted, error, fetchedAt, refresh } =
    usePlatformStore()
  const remaining = Math.max(0, capUsdMicros - spendUsdMicros)
  const pct = capUsdMicros > 0 ? Math.min(100, Math.round((remaining / capUsdMicros) * 100)) : 0

  useEffect(() => {
    if (fetchedAt === null) void refresh()
  }, [fetchedAt, refresh])

  return (
    <Card
      title="DeutschMeister AI — active"
      description="No key needed: your AI features run on our key with a free $1 credit for this account. Setting your own key below always overrides it (free, unlimited)."
    >
      {exhausted ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium">⚠ Your free $1 AI credit is used up.</p>
          <p className="mt-1">
            Two ways to keep going: add your own API key below — free and unlimited — or wait for
            paid plans (coming soon).
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Free credit remaining</span>
            <span className="font-mono text-slate-600">
              {formatUsdMicros(remaining)} / {formatUsdMicros(capUsdMicros)}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <Button type="button" disabled={loading} onClick={() => void refresh()}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
        {fetchedAt !== null && <span>updated {new Date(fetchedAt).toLocaleTimeString()}</span>}
        {error && <span className="text-red-600">{error}</span>}
      </div>
    </Card>
  )
}

export default function AiModelSection() {
  const settings = useAppStore((s) => s.settings)
  const patchSettings = useAppStore((s) => s.patchSettings)
  const apiKey = useAppStore((s) => s.apiKey)
  const patchApiKey = useAppStore((s) => s.patchApiKey)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [probe, setProbe] = useState<{ baseUrl: string } | null>(null)
  const [customModel, setCustomModel] = useState(false)
  const route = useAiRoute()

  if (!settings) return null
  const provider = getProvider(settings.provider)

  const changeProvider = async (id: ProviderId): Promise<void> => {
    const p = getProvider(id)
    setResult(null)
    setCustomModel(false)
    await patchSettings({ provider: id, baseUrl: p.baseUrl, model: p.defaultModel })
  }

  const runTest = async (baseUrlOverride?: string): Promise<void> => {
    if (!apiKey.trim()) {
      setResult({
        ok: false,
        ms: 0,
        model: settings.model,
        baseUrl: settings.baseUrl,
        error: 'Enter an API key first.',
      })
      return
    }
    setTesting(true)
    setProbe(null)
    // baseUrlOverride lets applyProbe retest the *new* URL immediately, without
    // waiting for the settings re-render to refresh this closure.
    const baseUrl = baseUrlOverride ?? settings.baseUrl
    try {
      const r = await testConnection(llmConfigFromSettings({ ...settings, baseUrl }, apiKey))
      setResult(r)
      // Self-heal endpoint mix-ups: when the configured endpoint fails, probe the
      // provider's other known endpoints with the same key and offer a one-click fix.
      if (!r.ok && provider.altBaseUrls) {
        for (const alt of provider.altBaseUrls) {
          if (alt === baseUrl) continue
          const altResult = await testConnection(llmConfigFromSettings({ ...settings, baseUrl: alt }, apiKey))
          if (altResult.ok) {
            setProbe({ baseUrl: alt })
            break
          }
        }
      }
    } finally {
      setTesting(false)
    }
  }

  const applyProbe = async (): Promise<void> => {
    if (!probe) return
    const baseUrl = probe.baseUrl
    setProbe(null)
    await patchSettings({ baseUrl })
    await runTest(baseUrl)
  }

  return (
    <div className="grid gap-4">
      {route === 'platform' && <PlatformAiCard />}
      <Card
        title="AI Model"
        description={
          route === 'platform'
            ? 'Bring your own key (optional). It is stored only in this browser and sent directly to the provider — it always overrides the free credit above.'
            : 'Bring your own key. It is stored only in this browser and sent directly to the provider you choose.'
        }
      >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Provider">
          <select
            className={inputClass}
            value={settings.provider}
            onChange={(e) => void changeProvider(e.target.value as ProviderId)}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Model ID"
          hint="Pick a model, or choose Custom… to paste any ID your account offers."
        >
          {customModel || (settings.model !== '' && !provider.modelSuggestions.includes(settings.model)) ? (
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={settings.model}
                placeholder={provider.defaultModel}
                name="dm-model-id"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => void patchSettings({ model: e.target.value })}
              />
              <Button
                type="button"
                onClick={() => {
                  setCustomModel(false)
                  void patchSettings({ model: provider.defaultModel })
                }}
              >
                Back to list
              </Button>
            </div>
          ) : (
            <select
              className={inputClass}
              value={provider.modelSuggestions.includes(settings.model) ? settings.model : provider.defaultModel}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setCustomModel(true)
                  void patchSettings({ model: '' })
                } else {
                  setCustomModel(false)
                  void patchSettings({ model: e.target.value })
                }
              }}
            >
              {provider.modelSuggestions.map((m) => (
                <option key={m} value={m}>
                  {m}
                  {m === provider.defaultModel ? ' (default)' : ''}
                </option>
              ))}
              <option value="__custom__">Custom…</option>
            </select>
          )}
        </Field>

        <Field
          label="API base URL"
          hint={provider.note ?? 'API endpoint, OpenAI-compatible.'}
        >
          <input
            className={inputClass}
            value={settings.baseUrl}
            placeholder={provider.baseUrl}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => void patchSettings({ baseUrl: e.target.value })}
          />
        </Field>

        <Field
          label="API key"
          hint={`Get a key: ${provider.keyUrl} · stored in this browser's localStorage only`}
        >
          <div className="flex gap-2">
            <input
              className={inputClass}
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              placeholder="Paste your key — never leaves this browser"
              autoComplete="off"
              onChange={(e) => patchApiKey(e.target.value)}
            />
            <Button type="button" onClick={() => setShowKey((v) => !v)}>
              {showKey ? 'Hide' : 'Show'}
            </Button>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Tip: you can also open{' '}
            <span className="font-mono">#/settings?key=YOUR_KEY</span> — the key is saved and the
            URL is cleaned immediately. The fragment is never sent to any server.
          </p>
        </Field>
      </div>

      {(() => {
        const manual = PROVIDER_MANUALS[settings.provider]
        if (!manual) return null
        return (
          <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              📖 How to get a {provider.label} API key
            </summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              {manual.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {manual.warn && <p className="mt-2 text-xs font-medium text-amber-700">⚠ {manual.warn}</p>}
          </details>
        )
      })()}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" variant="primary" disabled={testing} onClick={() => void runTest()}>
          {testing ? 'Testing…' : 'Test connection'}
        </Button>
        {result?.ok && (
          <span className="text-sm font-medium text-emerald-700">
            ✓ Connected: {result.model} @ {result.baseUrl} · {result.ms} ms · replied “{result.reply}”
          </span>
        )}
        {result && !result.ok && (
          <span className="text-sm font-medium text-red-600">✗ Failed — see details below</span>
        )}
      </div>

      {result && !result.ok && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-mono text-xs">{result.error}</p>
          {result.hint && <p className="mt-2 font-medium">{result.hint}</p>}
          {probe && (
            <p className="mt-2 flex flex-wrap items-center gap-2">
              <span>
                Your key <span className="font-semibold">works</span> on{' '}
                <span className="font-mono text-xs">{probe.baseUrl}</span>
              </span>
              <Button type="button" onClick={() => void applyProbe()}>
                Use this endpoint
              </Button>
            </p>
          )}
          <p className="mt-2 text-red-600">
            Checklist: key has no extra spaces · base URL matches the platform the key came from ·
            model ID exists in your account (copy it exactly from the provider console).
          </p>
        </div>
      )}
      </Card>
    </div>
  )
}
