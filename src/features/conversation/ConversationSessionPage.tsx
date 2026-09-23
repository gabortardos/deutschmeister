import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Badge, Button, Card, inputClass } from '../../components/ui'
import DrillRunner from '../grammar/DrillRunner'
import { addTurn, endSession, startSession } from '../../db/repositories/conversationRepo'
import { getDrillsForTopic, saveDrills } from '../../db/repositories/grammarRepo'
import { ensureScenariosSeeded, getScenario } from '../../db/repositories/scenarioRepo'
import type { ConversationMistake, DrillItem, Scenario } from '../../db/types'
import { hintForLlmError } from '../../llm/adapter'
import { PlatformAiError } from '../../llm/platform'
import {
  mistakesToDrills,
  sessionFeedback,
  suggestReply,
  conversationTurn,
  MISTAKE_CATEGORY_LABEL,
  type SessionFeedback,
  type SuggestedReply,
} from '../../llm/services'
import { newId } from '../../utils/id'
import { stt } from '../../speech/stt'
import { tts } from '../../speech/tts'
import { useHandsFree } from './useHandsFree'
import { useAppStore } from '../../state/store'
import { useLlmDeps } from '../../state/useLlmDeps'

interface UiTurn {
  id: string
  role: 'user' | 'tutor'
  text: string
  translation: string | null
  mistakes: ConversationMistake[] | null
  assisted: boolean
}

function toError(e: unknown): { message: string; hint?: string } {
  if (e instanceof PlatformAiError) return { message: e.message, hint: e.hint }
  const message = e instanceof Error ? e.message : String(e)
  return { message, hint: hintForLlmError(message) }
}

/**
 * One role-play session: chat bubbles (text + STT input + TTS playback +
 * assisted Hint), then an end-of-session feedback report whose mistakes can
 * be turned into drills and practiced immediately.
 */
export default function ConversationSessionPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const [searchParams] = useSearchParams()
  const { profile, settings } = useAppStore()

  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [missing, setMissing] = useState(false)
  const [turns, setTurns] = useState<UiTurn[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [sttError, setSttError] = useState<string | null>(null)
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null)
  const [hint, setHint] = useState<SuggestedReply | null>(null)
  const [assistedNext, setAssistedNext] = useState(false)
  const [showPhrases, setShowPhrases] = useState(false)
  const [translated, setTranslated] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<SessionFeedback | null>(null)
  const [drillsAdded, setDrillsAdded] = useState<number | null>(null)
  const [practiceDrills, setPracticeDrills] = useState<DrillItem[] | null>(null)
  const [practiceDone, setPracticeDone] = useState(false)

  const bottomRef = useRef<HTMLDivElement | null>(null)
  const sessionRef = useRef<string | null>(null)
  const openerDone = useRef(false)

  // M8: BYO key → the user's provider as before; signed-in keyless → free $1
  // platform teaser (metered by the ai-proxy Edge Function). No AI at all → hint UI.
  const { deps, route } = useLlmDeps('conversation')
  const aiReady = route !== 'none'
  const level = profile?.level ?? scenario?.cefr ?? 'A1'
  const practiceMode = searchParams.get('practice') === '1'

  // Reset per-scenario state; start the session (unless in practice mode).
  useEffect(() => {
    setScenario(null)
    setMissing(false)
    setTurns([])
    setFeedback(null)
    setDrillsAdded(null)
    setPracticeDrills(null)
    setPracticeDone(false)
    setError(null)
    setHint(null)
    setInput('')
    setTranslated(new Set())
    openerDone.current = false
    sessionRef.current = null
    if (!scenarioId) return
    void (async () => {
      await ensureScenariosSeeded()
      const s = await getScenario(scenarioId)
      if (!s) {
        setMissing(true)
        return
      }
      setScenario(s)
      if (practiceMode) {
        setPracticeDrills(await getDrillsForTopic(s.id))
        return
      }
      sessionRef.current = (await startSession(s.id)).id
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId, practiceMode])

  // Tutor opener — runs once deps are ready (settings hydrate asynchronously).
  useEffect(() => {
    if (!scenario || !deps || openerDone.current || turns.length > 0 || practiceMode) return
    openerDone.current = true
    void (async () => {
      setBusy(true)
      try {
        const res = await conversationTurn(deps, { scenario, level, history: [], userText: null })
        setTurns((t) => [
          ...t,
          {
            id: newId(),
            role: 'tutor',
            text: res.reply,
            translation: res.replyTranslationEn || null,
            mistakes: null,
            assisted: false,
          },
        ])
        if (sessionRef.current) {
          await addTurn(sessionRef.current, {
            role: 'tutor',
            text: res.reply,
            translation: res.replyTranslationEn || null,
          })
        }
      } catch (e) {
        setError(toError(e))
      } finally {
        setBusy(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, deps, turns.length, practiceMode])

  // Keep the newest bubble in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns.length, busy, feedback])

  const speak = (text: string): void => {
    tts.speak(text, { rate: settings?.ttsRate, voiceURI: settings?.ttsVoice })
  }

  async function send(): Promise<void> {
    const text = input.trim()
    if (!text) return
    const wasAssisted = assistedNext
    setAssistedNext(false)
    setInput('')
    const reply = await sendText(text, wasAssisted)
    if (reply === null) setInput(text) // let the learner retry the same message
  }

  /**
   * Shared pipeline for typed and spoken turns (also drives hands-free). Resolves the tutor
   * reply text, or null when the turn was skipped or failed (the error card shows why).
   */
  async function sendText(text: string, wasAssisted: boolean): Promise<string | null> {
    if (!text.trim() || !deps || !scenario || busy || feedback) return null
    setHint(null)
    setError(null)
    const userTurn: UiTurn = {
      id: newId(),
      role: 'user',
      text,
      translation: null,
      mistakes: null,
      assisted: wasAssisted,
    }
    setTurns((t) => [...t, userTurn])
    setBusy(true)
    try {
      const history = [...turns, userTurn].map((t) => ({ role: t.role, text: t.text }))
      const res = await conversationTurn(deps, { scenario, level, history, userText: text })
      if (sessionRef.current) {
        await addTurn(sessionRef.current, {
          role: 'user',
          text,
          mistakes: res.mistakes.length > 0 ? res.mistakes : null,
          assisted: wasAssisted,
        })
        await addTurn(sessionRef.current, {
          role: 'tutor',
          text: res.reply,
          translation: res.replyTranslationEn || null,
        })
      }
      setTurns((t) => [
        ...t.map((x) => (x.id === userTurn.id ? { ...x, mistakes: res.mistakes } : x)),
        {
          id: newId(),
          role: 'tutor',
          text: res.reply,
          translation: res.replyTranslationEn || null,
          mistakes: null,
          assisted: false,
        },
      ])
      return res.reply
    } catch (e) {
      setError(toError(e))
      return null
    } finally {
      setBusy(false)
    }
  }

  // Hands-free voice loop (M6.3): mic → silence commit → sendText → auto-speak reply → listen again.
  const handsFree = useHandsFree({
    sendUserText: (text) => sendText(text, false),
    speakReply: (text, notifyDone) => {
      const started = tts.speak(text, {
        rate: settings?.ttsRate,
        voiceURI: settings?.ttsVoice,
        onEnd: notifyDone,
      })
      if (!started) notifyDone() // no TTS available — don't stall the loop
    },
  })

  async function mic(): Promise<void> {
    if (listening || busy) return
    setSttError(null)
    setListening(true)
    try {
      const res = await stt.listenOnce('de-DE')
      setInput((prev) => (prev.trim().length === 0 ? res.transcript : `${prev.trim()} ${res.transcript}`))
    } catch (e) {
      setSttError(e instanceof Error ? e.message : String(e))
    } finally {
      setListening(false)
    }
  }

  async function requestHint(): Promise<void> {
    if (!deps || !scenario || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await suggestReply(deps, {
        scenario,
        level,
        history: turns.map((t) => ({ role: t.role, text: t.text })),
      })
      setHint(res)
    } catch (e) {
      setError(toError(e))
    } finally {
      setBusy(false)
    }
  }

  async function finish(): Promise<void> {
    handsFree.stop()
    if (!deps || !scenario || busy || feedback) return
    setBusy(true)
    setError(null)
    try {
      const fb = await sessionFeedback(deps, {
        scenario,
        level,
        history: turns.map((t) => ({ role: t.role, text: t.text })),
      })
      setFeedback(fb)
      if (sessionRef.current) {
        await endSession(sessionRef.current, `Score ${fb.overallScore} · ${fb.summary}`)
      }
    } catch (e) {
      setError(toError(e))
    } finally {
      setBusy(false)
    }
  }

  async function addMistakeDrills(): Promise<void> {
    if (!feedback || !scenario || drillsAdded !== null) return
    const drills = mistakesToDrills(feedback.mistakes, scenario.cefr, scenario.id)
    if (drills.length > 0) await saveDrills(drills)
    setDrillsAdded(drills.length)
  }

  function toggleTranslation(id: string): void {
    setTranslated((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (missing) {
    return (
      <Card title="Scenario not found">
        <p className="text-sm text-slate-600">This conversation scenario does not exist (yet).</p>
        <Link to="/conversation">
          <Button className="mt-3">← Back to scenarios</Button>
        </Link>
      </Card>
    )
  }

  if (!scenario) {
    return <p className="text-sm text-slate-500">Loading…</p>
  }

  if (practiceMode) {
    return (
      <div className="space-y-4">
        <Link to="/conversation" className="text-xs text-slate-400 hover:text-slate-600">
          ← All scenarios
        </Link>
        {practiceDone || !practiceDrills || practiceDrills.length === 0 ? (
          <Card title={`Mistake drills · ${scenario.title}`}>
            {practiceDrills && practiceDrills.length === 0 ? (
              <p className="text-sm text-slate-600">
                No saved drills for this scenario yet. Finish a role-play session and tap “Add mistakes as drills”.
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-600">Round complete — every attempt was recorded.</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="primary" onClick={() => setPracticeDone(false)}>
                    Practice again
                  </Button>
                  <Link to="/conversation">
                    <Button>Back to scenarios</Button>
                  </Link>
                </div>
              </>
            )}
          </Card>
        ) : (
          <DrillRunner
            drills={practiceDrills}
            title={`Mistakes · ${scenario.title}`}
            onFinish={() => setPracticeDone(true)}
          />
        )}
      </div>
    )
  }

  const userTurnCount = turns.filter((t) => t.role === 'user').length

  return (
    <div className="space-y-4">
      <Link to="/conversation" className="text-xs text-slate-400 hover:text-slate-600">
        ← All scenarios
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              <span className="mr-2">{scenario.emoji}</span>
              {scenario.title}
            </h1>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge tone="ok">{scenario.cefr}</Badge>
              <Badge tone="warn">level {level}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-600">{scenario.description}</p>
            <p className="mt-1 text-xs italic text-slate-400">Goal: {scenario.goal}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button onClick={() => setShowPhrases((v) => !v)}>
              {showPhrases ? 'Hide' : 'Show'} key phrases
            </Button>
            <Button variant="primary" disabled={busy || feedback !== null || userTurnCount === 0} onClick={() => void finish()}>
              End &amp; get feedback →
            </Button>
          </div>
        </div>
        {showPhrases && (
          <div className="mt-4 grid gap-1.5 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
            {scenario.keyPhrases.map((p) => (
              <p key={p.de} className="text-xs text-slate-600">
                <span className="font-medium text-slate-800">{p.de}</span>
                <span className="text-slate-400"> — {p.en}</span>
              </p>
            ))}
          </div>
        )}
      </Card>

      {/* Transcript */}
      <div className="space-y-3">
        {turns.map((t) =>
          t.role === 'user' ? (
            <div key={t.id} className="flex flex-col items-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2 text-sm text-white">
                {t.text}
                {t.assisted && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide opacity-80">✨ assisted</span>
                )}
              </div>
              {t.mistakes && t.mistakes.length > 0 && (
                <ul className="mt-1 max-w-[85%] space-y-1">
                  {t.mistakes.map((m, i) => (
                    <li
                      key={`${t.id}-m-${i}`}
                      className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700"
                    >
                      <span className="line-through opacity-70">{m.said}</span> → <strong>{m.corrected}</strong>
                      <span className="ml-1 opacity-60">({m.type})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div key={t.id} className="flex flex-col items-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800">
                {t.text}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <button type="button" className="text-slate-400 hover:text-slate-600" onClick={() => speak(t.text)}>
                  🔊 Listen
                </button>
                {t.translation && (
                  <button
                    type="button"
                    className="text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
                    onClick={() => toggleTranslation(t.id)}
                  >
                    {translated.has(t.id) ? 'hide EN' : 'EN'}
                  </button>
                )}
              </div>
              {t.translation && translated.has(t.id) && (
                <p className="mt-0.5 max-w-[85%] text-xs text-slate-400">{t.translation}</p>
              )}
            </div>
          ),
        )}
        {busy && (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
            Tutor is thinking…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm font-medium text-red-700">AI call failed: {error.message}</p>
          {error.hint && <p className="mt-1 text-xs text-red-600">{error.hint}</p>}
          <Button className="mt-2" onClick={() => setError(null)}>
            Try again
          </Button>
        </Card>
      )}

      {feedback ? (
        <Card title="Session feedback" description="Your tutor reviewed the whole conversation.">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={feedback.overallScore >= 70 ? 'ok' : feedback.overallScore >= 40 ? 'warn' : 'bad'}>
              Score {feedback.overallScore}/100
            </Badge>
            {feedback.recommendedDrillTopics.map((topic) => (
              <span key={topic} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700">
                next: {topic}
              </span>
            ))}
          </div>
          {feedback.summary && <p className="mt-3 text-sm text-slate-700">{feedback.summary}</p>}
          {feedback.strengths.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-emerald-700">
              {feedback.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          {feedback.mistakes.length > 0 ? (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-800">Mistakes to work on</h4>
              <ul className="mt-2 space-y-1.5">
                {feedback.mistakes.map((m, i) => (
                  <li key={`${m.said}-${i}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                    <span className="text-slate-500 line-through">{m.said}</span> →{' '}
                    <span className="font-medium text-slate-900">{m.corrected}</span>{' '}
                    <span className="text-xs text-slate-400">({MISTAKE_CATEGORY_LABEL[m.type]})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-sm text-emerald-700">No significant mistakes — stark! 🎉</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="primary"
              disabled={feedback.mistakes.length === 0 || drillsAdded !== null}
              onClick={() => void addMistakeDrills()}
            >
              {drillsAdded !== null
                ? `Added ${drillsAdded} drill${drillsAdded === 1 ? '' : 's'} ✓`
                : feedback.mistakes.length === 0
                  ? 'Nothing to add'
                  : 'Add mistakes as drills'}
            </Button>
            {drillsAdded !== null && drillsAdded > 0 && (
              <Link to={`/conversation/${scenario.id}?practice=1`}>
                <Button>Practice them now →</Button>
              </Link>
            )}
            <Link to="/conversation">
              <Button>New session</Button>
            </Link>
          </div>
        </Card>
      ) : !aiReady ? (
        <Card>
          <p className="text-sm text-slate-600">
            🗣️ This role-play needs AI: add your own key in{' '}
            <Link to="/settings" className="font-medium text-indigo-700 underline underline-offset-2">
              Settings → AI Model
            </Link>{' '}
            — or sign in (Settings → Account) for the free $1 AI credit.
          </p>
        </Card>
      ) : (
        <>
          {hint && (
            <Card className="border-amber-200 bg-amber-50">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Suggested reply ✨ (assisted)
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">{hint.suggestion}</p>
              {hint.translationEn && <p className="text-xs text-slate-500">{hint.translationEn}</p>}
              <div className="mt-2 flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setInput(hint.suggestion)
                    setAssistedNext(true)
                    setHint(null)
                  }}
                >
                  Use it
                </Button>
                <Button onClick={() => setHint(null)}>Dismiss</Button>
              </div>
            </Card>
          )}

          {stt.supported && !feedback && (
            <Card className={handsFree.active ? 'border-indigo-300 bg-indigo-50/60' : undefined}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">🎙 Hands-free conversation</p>
                  <p className="text-xs text-slate-500">
                    {!handsFree.active
                      ? 'Talk naturally: the mic listens, your turn sends when you pause, replies are spoken back.'
                      : handsFree.state === 'listening'
                        ? 'Speak German — it sends automatically when you pause.'
                        : handsFree.state === 'thinking'
                          ? 'Your tutor is thinking…'
                          : 'Your tutor is speaking…'}
                  </p>
                  {handsFree.active && handsFree.state === 'listening' && handsFree.partial && (
                    <p className="mt-1 truncate text-sm italic text-indigo-700" aria-live="polite">
                      “{handsFree.partial}”
                    </p>
                  )}
                  {handsFree.micError && (
                    <p className="mt-1 text-xs text-red-600">{handsFree.micError}</p>
                  )}
                </div>
                {handsFree.active ? (
                  <Button onClick={() => handsFree.stop()}>■ Stop</Button>
                ) : (
                  <Button type="button" disabled={busy} onClick={() => handsFree.start()}>
                    Start
                  </Button>
                )}
              </div>
            </Card>
          )}

          <Card>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void send()
              }}
            >
              <textarea
                className={inputClass}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
                placeholder="Schreib auf Deutsch… (Enter sends, Shift+Enter = new line)"
                disabled={busy || handsFree.active}
                autoFocus
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {stt.supported ? (
                  <Button type="button" disabled={busy || listening || handsFree.active} onClick={() => void mic()}>
                    {listening ? '● Listening…' : '🎤 Speak'}
                  </Button>
                ) : (
                  <span className="text-xs text-slate-400">Mic needs Chrome/Edge — typing works everywhere.</span>
                )}
                <Button type="button" disabled={busy || handsFree.active} onClick={() => void requestHint()}>
                  💡 Hint
                </Button>
                <Button variant="primary" type="submit" disabled={busy || handsFree.active || input.trim().length === 0}>
                  Send →
                </Button>
                {assistedNext && <span className="text-xs text-amber-600">next send is marked ✨ assisted</span>}
              </div>
              {sttError && <p className="mt-2 text-xs text-red-600">{sttError}</p>}
            </form>
          </Card>
        </>
      )}

    </div>
  )
}
