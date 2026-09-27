import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, Field, inputClass } from '../../components/ui'
import { addCustomScenario } from '../../db/repositories/contentRepo'
import type { CefrLevel } from '../../db/types'
import { generateScenario, type GeneratedScenario } from '../../llm/services'
import { useAppStore } from '../../state/store'
import { useLlmDeps } from '../../state/useLlmDeps'

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/**
 * M11.4 custom scenario builder: describe a situation → `generateScenario`
 * (LlmCache-routed) → preview → `addCustomScenario` into the local library.
 * Without AI deps the form stays visible with a hint, mirroring the page's
 * offline-friendly pattern.
 */
export function ScenarioBuilder({ onSaved }: { onSaved: () => void }) {
  const { deps } = useLlmDeps('conversation')
  const profileLevel = useAppStore((s) => s.profile?.level)
  const [description, setDescription] = useState('')
  const [cefrChoice, setCefrChoice] = useState<CefrLevel | ''>('')
  const level: CefrLevel = cefrChoice || profileLevel || 'A1'
  const [preview, setPreview] = useState<GeneratedScenario | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedTitle, setSavedTitle] = useState<string | null>(null)

  async function generate(): Promise<void> {
    if (!deps || busy) return
    if (description.trim().length < 8) {
      setError('Describe the situation in a few more words (at least 8 characters).')
      return
    }
    setBusy(true)
    setError(null)
    setSavedTitle(null)
    try {
      setPreview(await generateScenario(deps, { description: description.trim(), cefr: level }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI call failed')
    } finally {
      setBusy(false)
    }
  }

  async function save(): Promise<void> {
    if (!preview) return
    const { title, emoji, description: desc, goal, keyPhrases } = preview
    await addCustomScenario({ title, emoji, description: desc, goal, keyPhrases, cefr: level })
    setSavedTitle(title)
    setPreview(null)
    setDescription('')
    onSaved()
  }

  return (
    <Card
      title="Create your own scenario ⭐"
      description="Describe a situation — AI turns it into a role-play in your library."
    >
      <Field label="Situation you want to practice">
        <textarea
          className={`${inputClass} min-h-[72px]`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. I'm at a Berlin flea market negotiating the price of an old record player"
        />
      </Field>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <Field label="Level">
          <select
            className={inputClass}
            value={cefrChoice}
            onChange={(e) => setCefrChoice(e.target.value as CefrLevel | '')}
          >
            <option value="">{profileLevel ? `${profileLevel} (my level)` : 'A1'}</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        {deps ? (
          <Button variant="primary" disabled={busy} onClick={() => void generate()}>
            {busy ? 'Designing…' : 'Generate ✨'}
          </Button>
        ) : (
          <p className="text-xs text-slate-400">
            Add an{' '}
            <Link to="/settings" className="font-medium text-indigo-700 hover:underline">
              AI key in Settings
            </Link>{' '}
            to generate scenarios.
          </p>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {savedTitle && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved “{savedTitle}” — it&apos;s at the top of your library below. 👇
        </p>
      )}

      {preview && (
        <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50/60 p-4">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-semibold text-slate-900">
              <span className="mr-2">{preview.emoji}</span>
              {preview.title}
            </h4>
            <Badge tone="ok">{level}</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-700">{preview.description}</p>
          <p className="mt-1 text-xs italic text-slate-500">Goal: {preview.goal}</p>
          <ul className="mt-3 space-y-1">
            {preview.keyPhrases.map((p) => (
              <li key={p.de} className="text-sm">
                <span className="font-medium text-slate-800">{p.de}</span>{' '}
                <span className="text-slate-500">— {p.en}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-400">
            Not quite right? Tweak your description and generate again — it&apos;s free for the same text.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => void save()}>
              Save to my library
            </Button>
            <Button onClick={() => setPreview(null)}>Discard</Button>
          </div>
        </div>
      )}
    </Card>
  )
}
