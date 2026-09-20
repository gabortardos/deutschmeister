import { useState } from 'react'
import { Button, Card, Field, inputClass } from '../../../components/ui'
import { llmConfigFromSettings, testConnection, type TestResult } from '../../../llm/adapter'
import { getProvider, PROVIDERS, type ProviderId } from '../../../llm/providers'
import { useAppStore } from '../../../state/store'

export default function AiModelSection() {
  const settings = useAppStore((s) => s.settings)
  const patchSettings = useAppStore((s) => s.patchSettings)
  const apiKey = useAppStore((s) => s.apiKey)
  const patchApiKey = useAppStore((s) => s.patchApiKey)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [probe, setProbe] = useState<{ baseUrl: string } | null>(null)

  if (!settings) return null
  const provider = getProvider(settings.provider)

  const changeProvider = async (id: ProviderId): Promise<void> => {
    const p = getProvider(id)
    setResult(null)
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
    <Card
      title="AI Model"
      description="Bring your own key. It is stored only in this browser and sent directly to the provider you choose."
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

        <Field label="Model ID" hint="Free-text on purpose: paste any model your account offers.">
          <input
            className={inputClass}
            value={settings.model}
            list="dm-model-suggestions"
            placeholder={provider.defaultModel}
            onChange={(e) => void patchSettings({ model: e.target.value })}
          />
          <datalist id="dm-model-suggestions">
            {provider.modelSuggestions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Field>

        <Field
          label="API base URL"
          hint={provider.note ?? 'API endpoint, OpenAI-compatible.'}
        >
          <input
            className={inputClass}
            value={settings.baseUrl}
            placeholder={provider.baseUrl}
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
  )
}
