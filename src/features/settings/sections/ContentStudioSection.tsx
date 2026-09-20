import { useEffect, useState } from 'react'
import { Button, Card, Field, inputClass } from '../../../components/ui'
import {
  addCustomScenario,
  addCustomWord,
  clearLlmCache,
  contentCounts,
  parseKeyPhrases,
  type ContentCounts,
} from '../../../db/repositories/contentRepo'
import { CEFR_LEVELS, type CefrLevel } from '../../../db/types'

const ARTICLE_OPTIONS = ['', 'der', 'die', 'das'] as const

export default function ContentStudioSection() {
  const [counts, setCounts] = useState<ContentCounts | null>(null)

  // Custom word form
  const [wGerman, setWGerman] = useState('')
  const [wEnglish, setWEnglish] = useState('')
  const [wArticle, setWArticle] = useState<(typeof ARTICLE_OPTIONS)[number]>('')
  const [wPlural, setWPlural] = useState('')
  const [wTheme, setWTheme] = useState('Custom')
  const [wCefr, setWCefr] = useState<CefrLevel>('A1')

  // Custom scenario form
  const [sTitle, setSTitle] = useState('')
  const [sCefr, setSCefr] = useState<CefrLevel>('A1')
  const [sDescription, setSDescription] = useState('')
  const [sGoal, setSGoal] = useState('')
  const [sPhrases, setSPhrases] = useState('')

  const [message, setMessage] = useState('')

  useEffect(() => {
    void contentCounts().then(setCounts)
  }, [])

  const refreshCounts = async (): Promise<void> => {
    setCounts(await contentCounts())
  }

  const submitWord = async (): Promise<void> => {
    if (!wGerman.trim() || !wEnglish.trim()) {
      setMessage('Word needs at least the German and English fields.')
      return
    }
    await addCustomWord({
      german: wGerman,
      english: wEnglish,
      article: wArticle === '' ? null : wArticle,
      plural: wPlural || null,
      theme: wTheme,
      cefr: wCefr,
    })
    setMessage(`Added “${wGerman.trim()}” to your vocabulary.`)
    setWGerman('')
    setWEnglish('')
    setWPlural('')
    setWArticle('')
    await refreshCounts()
  }

  const submitScenario = async (): Promise<void> => {
    if (!sTitle.trim() || !sGoal.trim()) {
      setMessage('Scenario needs at least a title and a goal.')
      return
    }
    await addCustomScenario({
      title: sTitle,
      cefr: sCefr,
      description: sDescription,
      goal: sGoal,
      keyPhrases: parseKeyPhrases(sPhrases),
    })
    setMessage(`Added scenario “${sTitle.trim()}”.`)
    setSTitle('')
    setSDescription('')
    setSGoal('')
    setSPhrases('')
    await refreshCounts()
  }

  return (
    <Card
      title="Content Studio"
      description="Add your own vocabulary and conversation scenarios. AI-generated drills arrive in M3."
    >
      {counts && (
        <p className="mb-4 text-xs text-slate-500">
          Library: {counts.words} words ({counts.customWords} custom) · {counts.scenarios} scenarios (
          {counts.customScenarios} custom) · {counts.cachedLlmItems} cached AI items
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Add a custom word</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="German *">
              <input className={inputClass} value={wGerman} onChange={(e) => setWGerman(e.target.value)} placeholder="die Bank" />
            </Field>
            <Field label="English *">
              <input className={inputClass} value={wEnglish} onChange={(e) => setWEnglish(e.target.value)} placeholder="bench" />
            </Field>
            <Field label="Article">
              <select className={inputClass} value={wArticle} onChange={(e) => setWArticle(e.target.value as (typeof ARTICLE_OPTIONS)[number])}>
                {ARTICLE_OPTIONS.map((option) => (
                  <option key={option || 'none'} value={option}>
                    {option === '' ? '— none —' : option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Plural">
              <input className={inputClass} value={wPlural} onChange={(e) => setWPlural(e.target.value)} placeholder="Bänke" />
            </Field>
            <Field label="Theme">
              <input className={inputClass} value={wTheme} onChange={(e) => setWTheme(e.target.value)} />
            </Field>
            <Field label="Level">
              <select className={inputClass} value={wCefr} onChange={(e) => setWCefr(e.target.value as CefrLevel)}>
                {CEFR_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </Field>
          </div>
          <Button variant="primary" onClick={() => void submitWord()}>Add word</Button>
        </div>

        <div className="space-y-3 rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Add a custom conversation scenario</h3>
          <Field label="Title *">
            <input className={inputClass} value={sTitle} onChange={(e) => setSTitle(e.target.value)} placeholder="At the pharmacy" />
          </Field>
          <Field label="Description">
            <input className={inputClass} value={sDescription} onChange={(e) => setSDescription(e.target.value)} placeholder="Describe symptoms and buy medicine" />
          </Field>
          <Field label="Goal *">
            <input className={inputClass} value={sGoal} onChange={(e) => setSGoal(e.target.value)} placeholder="Ask for something against a headache" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Level">
              <select className={inputClass} value={sCefr} onChange={(e) => setSCefr(e.target.value as CefrLevel)}>
                {CEFR_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </Field>
            <Field label="Key phrases" hint="One per line: German | English">
              <textarea
                className={`${inputClass} h-20`}
                value={sPhrases}
                onChange={(e) => setSPhrases(e.target.value)}
                placeholder={'Ich habe Kopfschmerzen | I have a headache'}
              />
            </Field>
          </div>
          <Button variant="primary" onClick={() => void submitScenario()}>Add scenario</Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button disabled title="Arrives in Milestone 3">
          Generate drills with AI (M3)
        </Button>
        <Button
          disabled={!counts || counts.cachedLlmItems === 0}
          onClick={() => {
            void clearLlmCache().then(refreshCounts)
          }}
        >
          Clear AI cache
        </Button>
        {message && <span className="text-sm text-emerald-700">{message}</span>}
      </div>
    </Card>
  )
}
