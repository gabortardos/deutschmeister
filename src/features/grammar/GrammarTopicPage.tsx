import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MiniMarkdown } from '../../components/markdown'
import { Badge, Button, Card } from '../../components/ui'
import { lessonForTopic } from '../../content/grammar/lessons'
import type { DrillItem, GrammarTopic } from '../../db/types'
import { getDrillsForTopic, getTopic, recentWrongAnswers } from '../../db/repositories/grammarRepo'
import { hintForLlmError } from '../../llm/adapter'
import { explainGrammar } from '../../llm/services'
import { useAppStore } from '../../state/store'
import { useLlmDeps } from '../../state/useLlmDeps'
import DrillRunner from './DrillRunner'
import LessonView from './LessonView'
import { generateAndSaveDrills } from './drillGeneration'

/** Segmented-tab styling for the 📖 Lesson / ⚡ Quick reference switch. */
function tabClass(active: boolean): string {
  return `rounded-md px-3 py-1 text-xs font-medium transition-colors ${
    active ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
  }`
}

/** M14.1: completed-round counter per topic (localStorage nicety — powers the
 *  "fresh drills on repeat visits" behaviour; a UI hint, not user data, never syncs). */
const ROUNDS_KEY = 'dm-grammar-rounds'

function readRounds(topicId: string): number {
  try {
    const raw = JSON.parse(localStorage.getItem(ROUNDS_KEY) ?? '{}') as Record<string, number>
    return raw[topicId] ?? 0
  } catch {
    return 0
  }
}

function bumpRounds(topicId: string): void {
  try {
    const raw = JSON.parse(localStorage.getItem(ROUNDS_KEY) ?? '{}') as Record<string, number>
    raw[topicId] = (raw[topicId] ?? 0) + 1
    localStorage.setItem(ROUNDS_KEY, JSON.stringify(raw))
  } catch {
    // Storage blocked — reshuffling still works; only the auto-fresh hint is lost.
  }
}

/** Fisher–Yates on a copy — Math.random by design (round variety, like the mistake bank). */
function shuffleDrills<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}


export default function GrammarTopicPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const { profile, patchProfile, bumpDrills, refreshToday } = useAppStore()
  const [topic, setTopic] = useState<GrammarTopic | null>(null)
  const [drills, setDrills] = useState<DrillItem[] | null>(null)
  const [practicing, setPracticing] = useState(false)
  const [done, setDone] = useState(false)
  // M14.1: round variety — the active round's drill set + a remount sequence.
  const [practiceSet, setPracticeSet] = useState<DrillItem[] | null>(null)
  const [roundSeq, setRoundSeq] = useState(0)
  const [freshBusy, setFreshBusy] = useState(false)
  // M14: topics with an authored lesson open on the 📖 Lesson tab.
  const [tab, setTab] = useState<'lesson' | 'summary'>('lesson')

  // AI extras (only shown when a key is configured)
  const [explainMd, setExplainMd] = useState<string | null>(null)
  const [explainBusy, setExplainBusy] = useState(false)
  const [genBusy, setGenBusy] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [aiError, setAiError] = useState<{ message: string; hint?: string } | null>(null)

  // M8: BYO key → the user's provider; signed-in keyless → free $1 platform teaser.
  const { deps } = useLlmDeps('explain')

  // M14: authored lesson for this topic (static bundle content — 3 pilot topics).
  const lesson = topicId ? lessonForTopic(topicId) : undefined

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

  /**
   * M14.1 round starter. `fresh`: true → always add a new AI batch first;
   * false → never call AI (offline-safe reshuffle); undefined → auto: only when
   * the learner has completed rounds on this topic before, so repeat visits to
   * an already-learned topic serve new drills instead of the same fixed set.
   * Every round is reshuffled either way.
   */
  async function startPractice(fresh?: boolean): Promise<void> {
    if (!topic || !topicId || freshBusy) return
    const wantFresh = fresh ?? readRounds(topicId) > 0
    let pool = drills ?? []
    if (wantFresh && deps && !genBusy) {
      setFreshBusy(true)
      try {
        const saved = await generateAndSaveDrills(deps, topicId, 5)
        if (saved > 0) {
          pool = await getDrillsForTopic(topicId)
          setDrills(pool)
        }
      } catch {
        // Fresh drills are a bonus, never a blocker — fall back to the reshuffled pool.
      } finally {
        setFreshBusy(false)
      }
    }
    if (pool.length === 0) return
    setDone(false)
    setPracticeSet(shuffleDrills(pool))
    setRoundSeq((n) => n + 1)
    setPracticing(true)
  }

  useEffect(() => {
    setTopic(null)
    setDrills(null)
    setPracticeSet(null)
    setPracticing(false)
    setDone(false)
    setTab('lesson')
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

  if (practicing && practiceSet && practiceSet.length > 0) {
    return (
      <div className="space-y-4">
        <Link to="/grammar" className="text-xs text-slate-400 hover:text-slate-600">
          ← Leave practice
        </Link>
        <DrillRunner
          key={roundSeq}
          drills={practiceSet}
          title={topic.title}
          onFinish={() => {
            setPracticing(false)
            setDone(true)
            if (topicId) bumpRounds(topicId)
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
        {lesson && (
          <div
            role="tablist"
            aria-label="Topic content"
            className="mt-3 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
          >
            <button type="button" role="tab" aria-selected={tab === 'lesson'} onClick={() => setTab('lesson')} className={tabClass(tab === 'lesson')}>
              📖 Lesson
            </button>
            <button type="button" role="tab" aria-selected={tab === 'summary'} onClick={() => setTab('summary')} className={tabClass(tab === 'summary')}>
              ⚡ Quick reference
            </button>
          </div>
        )}
        {lesson && tab === 'lesson' && (
          <LessonView
            lesson={lesson}
            topic={topic}
            drillsCount={drills?.length ?? 0}
            onPractice={() => void startPractice()}
          />
        )}
        {(!lesson || tab === 'summary') && (
          <>
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
              <Button
                variant="primary"
                onClick={() => void startPractice()}
                disabled={freshBusy || (drills?.length ?? 0) === 0}
              >
                {freshBusy ? 'Preparing fresh drills…' : `Practice ${drills?.length ?? 0} drills →`}
              </Button>
              <Link to="/vocab">
                <Button>Study related words</Button>
              </Link>
            </div>
          </>
        )}

        {done && !practicing && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-sm font-medium text-emerald-800">
              Round complete — attempts recorded, mastery updated.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button disabled={freshBusy} onClick={() => void startPractice(false)}>
                {freshBusy ? 'Preparing…' : '🔁 Practice again (new order)'}
              </Button>
              {deps && (
                <Button variant="primary" disabled={freshBusy} onClick={() => void startPractice(true)}>
                  ✨ Practice again + 5 new drills
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
