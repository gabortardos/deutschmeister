import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MiniMarkdown } from '../../components/markdown'
import { Badge, Button, Card } from '../../components/ui'
import type { DrillItem, GrammarTopic } from '../../db/types'
import { getDrillsForTopic, getTopic, recentWrongAnswers } from '../../db/repositories/grammarRepo'
import { llmCachePort } from '../../db/repositories/llmCacheRepo'
import { hintForLlmError, llmConfigFromSettings } from '../../llm/adapter'
import { explainGrammar, type LlmServiceDeps } from '../../llm/services'
import { useAppStore } from '../../state/store'
import DrillRunner from './DrillRunner'
import { generateAndSaveDrills } from './drillGeneration'

export default function GrammarTopicPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const { profile, patchProfile, bumpDrills, refreshToday, settings, apiKey } = useAppStore()
  const [topic, setTopic] = useState<GrammarTopic | null>(null)
  const [drills, setDrills] = useState<DrillItem[] | null>(null)
  const [practicing, setPracticing] = useState(false)
  const [done, setDone] = useState(false)

  // AI extras (only shown when a key is configured)
  const [explainMd, setExplainMd] = useState<string | null>(null)
  const [explainBusy, setExplainBusy] = useState(false)
  const [genBusy, setGenBusy] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [aiError, setAiError] = useState<{ message: string; hint?: string } | null>(null)

  const keyReady = apiKey.trim().length > 0
  const deps: LlmServiceDeps | null =
    settings && keyReady ? { config: llmConfigFromSettings(settings, apiKey), cache: llmCachePort } : null

  async function runExplain(): Promise<void> {
    if (!deps || !topic || explainBusy) return
    setExplainBusy(true)
    setAiError(null)
    try {
      const mistakesContext = await recentWrongAnswers((drills ?? []).map((d) => d.id))
      const md = await explainGrammar(deps, {
        topic: {
          id: topic.id,
          title: topic.title,
          cefr: topic.cefr,
          focus: topic.focus,
          explanationMd: topic.explanationMd,
        },
        mistakesContext,
      })
      setExplainMd(md)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setAiError({ message, hint: hintForLlmError(message) })
    } finally {
      setExplainBusy(false)
    }
  }

  async function runGenerate(): Promise<void> {
    if (!deps || !topicId || genBusy) return
    setGenBusy(true)
    setAiError(null)
    setAiMessage('')
    try {
      const saved = await generateAndSaveDrills(deps, topicId, 5)
      setAiMessage(saved > 0 ? `Added ${saved} AI drills to this topic.` : 'All generated drills already exist here — try again later.')
      setDrills(await getDrillsForTopic(topicId))
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setAiError({ message, hint: hintForLlmError(message) })
    } finally {
      setGenBusy(false)
    }
  }

  useEffect(() => {
    setTopic(null)
    setDrills(null)
    setPracticing(false)
    setDone(false)
    if (!topicId) return
    void (async () => {
      const t = await getTopic(topicId)
      setTopic(t ?? null)
      if (t) {
        setDrills(await getDrillsForTopic(t.id))
        if (profile && profile.currentGrammarTopicId !== t.id) {
          await patchProfile({ currentGrammarTopicId: t.id })
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId])

  if (!topic) {
    return (
      <Card title="Topic not found">
        <p className="text-sm text-slate-600">This grammar topic does not exist (yet).</p>
        <Link to="/grammar">
          <Button className="mt-3">← Back to Grammar</Button>
        </Link>
      </Card>
    )
  }

  if (practicing && drills && drills.length > 0) {
    return (
      <div className="space-y-4">
        <Link to="/grammar" className="text-xs text-slate-400 hover:text-slate-600">
          ← Leave practice
        </Link>
        <DrillRunner
          drills={drills}
          title={topic.title}
          onFinish={() => {
            setPracticing(false)
            setDone(true)
            void bumpDrills()
            void refreshToday()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link to="/grammar" className="text-xs text-slate-400 hover:text-slate-600">
        ← All topics
      </Link>
      <Card
        title={topic.title}
        description={`${topic.cefr} · ${topic.focus}`}
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="ok">{topic.cefr}</Badge>
          {topic.relatedVocabTheme && <Badge tone="warn">Pairs with “{topic.relatedVocabTheme}” vocabulary</Badge>}
        </div>
        <div className="mt-3 space-y-2">
          <MiniMarkdown md={topic.explanationMd} />
        </div>
        {deps && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button disabled={explainBusy} onClick={() => void runExplain()}>
                {explainBusy ? 'Explaining…' : '✨ Explain for me'}
              </Button>
              <Button disabled={genBusy} onClick={() => void runGenerate()}>
                {genBusy ? 'Generating…' : '✨ Generate 5 more drills'}
              </Button>
            </div>
            {aiMessage && <p className="text-xs text-emerald-700">{aiMessage}</p>}
            {aiError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-xs font-medium text-red-700">AI call failed: {aiError.message}</p>
                {aiError.hint && <p className="mt-1 text-xs text-red-600">{aiError.hint}</p>}
              </div>
            )}
            {explainMd && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  AI explanation · tailored to your recent mistakes
                </p>
                <MiniMarkdown md={explainMd} />
              </div>
            )}
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => setPracticing(true)} disabled={(drills?.length ?? 0) === 0}>
            Practice {drills?.length ?? 0} drills →
          </Button>
          <Link to="/vocab">
            <Button>Study related words</Button>
          </Link>
        </div>
        {done && (
          <p className="mt-3 text-xs text-emerald-600">Round complete — attempts recorded, mastery updated.</p>
        )}
      </Card>
    </div>
  )
}
