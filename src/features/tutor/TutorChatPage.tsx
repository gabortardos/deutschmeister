import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, inputClass } from '../../components/ui'
import { MistakeExplainer } from '../mistakes/MistakeExplainer'
import {
  addTurn,
  endSession,
  getSessionTurns,
  latestTutorSession,
  startTutorSession,
} from '../../db/repositories/conversationRepo'
import { CEFR_LEVELS, type CefrLevel, type ConversationMistake } from '../../db/types'
import { hintForLlmError } from '../../llm/adapter'
import { PlatformAiError } from '../../llm/platform'
import { tutorChatTurn } from '../../llm/services'
import { isTutorChatMode, TUTOR_MODES, type TutorChatMode } from '../../engine/tutorChat'
import { useAppStore } from '../../state/store'
import { useLlmDeps } from '../../state/useLlmDeps'
import { takeTutorPrefill } from './tutorPrefill'

interface UiTurn {
  id: string
  role: 'user' | 'tutor'
  text: string
  translation: string | null
  mistakes: ConversationMistake[] | null
}

function toError(e: unknown): { message: string; hint?: string } {
  if (e instanceof PlatformAiError) return { message: e.message, hint: e.hint }
  const message = e instanceof Error ? e.message : String(e)
  return { message, hint: hintForLlmError(message) }
}

/** localStorage key for the last chat/ask mode (a small continuity nicety). */
const MODE_KEY = 'dm-tutor-mode'

/**
 * M11.8 free-form tutor chat — the "just talk to me" page. Two modes share one
 * transcript: 🗣️ Free chat (German conversation at the learner's level, mistakes
 * corrected silently) and ❓ Ask the tutor (questions about German, answered in
 * English). Corrections reuse the conversation pipeline, so they land in the
 * Mistake bank and Insights exactly like role-play corrections.
 */
export default function TutorChatPage() {
  const { profile } = useAppStore()
  const [mode, setMode] = useState<TutorChatMode>(() => {
    const saved = localStorage.getItem(MODE_KEY)
    return isTutorChatMode(saved) ? saved : 'chat'
  })
  const [levelOverride, setLevelOverride] = useState<CefrLevel | null>(null)
  const [turns, setTurns] = useState<UiTurn[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null)
  // M14.1: lesson handoff context ("Ask about this lesson") — kept for the whole
  // conversation so follow-up questions stay grounded in that lesson's content.
  const [lessonContext, setLessonContext] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement | null>(null)
  const sessionRef = useRef<string | null>(null)

  const { deps, route } = useLlmDeps('tutor')
  const aiReady = route !== 'none'
  const level = levelOverride ?? profile?.level ?? 'A1'

  // Resume the latest tutor chat — the page behaves like a messenger, not a scene.
  useEffect(() => {
    void (async () => {
      const sess = await latestTutorSession()
      if (!sess) return
      sessionRef.current = sess.id
      const rows = await getSessionTurns(sess.id)
      setTurns(
        rows.map((t) => ({
          id: t.id,
          role: t.role,
          text: t.text,
          translation: t.translation,
          mistakes: t.mistakes,
        })),
      )
    })()
  }, [])

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode)
  }, [mode])

  // M14: lesson pages hand off a preseeded question ("Ask about this lesson") —
  // consume it once: switch to Ask mode and prefill the textarea.
  useEffect(() => {
    const prefill = takeTutorPrefill()
    if (prefill && prefill.question.trim().length > 0) {
      setInput(prefill.question)
      if (prefill.context) setLessonContext(prefill.context)
      setMode('ask')
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, busy])

  async function send(): Promise<void> {
    const text = input.trim()
    if (busy || text.length === 0 || !deps) return
    setError(null)
    setInput('')
    setBusy(true)
    const pendingId = `pending-${Date.now()}`
    const priorTurns = turns
    setTurns([...priorTurns, { id: pendingId, role: 'user', text, translation: null, mistakes: null }])
    try {
      if (!sessionRef.current) {
        sessionRef.current = (await startTutorSession()).id
      }
      const result = await tutorChatTurn(deps, {
        mode,
        level,
        history: priorTurns.map((t) => ({ role: t.role, text: t.text })),
        userText: text,
        lessonContext: lessonContext ?? undefined,
      })
      const userTurn = await addTurn(sessionRef.current, {
        role: 'user',
        text,
        mistakes: result.mistakes,
      })
      const tutorTurn = await addTurn(sessionRef.current, {
        role: 'tutor',
        text: result.reply,
        translation: result.replyTranslationEn,
      })
      setTurns((prev) => [
        ...prev.map((t) =>
          t.id === pendingId ? { ...t, id: userTurn.id, mistakes: result.mistakes } : t,
        ),
        {
          id: tutorTurn.id,
          role: 'tutor',
          text: result.reply,
          translation: result.replyTranslationEn,
          mistakes: null,
        },
      ])
    } catch (e) {
      setError(toError(e))
      setInput(text) // don't eat the learner's message
    } finally {
      setBusy(false)
    }
  }

  async function newChat(): Promise<void> {
    if (sessionRef.current && turns.length > 0) {
      await endSession(sessionRef.current, `${turns.length} messages`)
    }
    sessionRef.current = (await startTutorSession()).id
    setTurns([])
    setError(null)
    setLessonContext(null)
  }

  const meta = TUTOR_MODES[mode]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tutor chat</h1>
          <p className="mt-1 text-sm text-slate-500">{meta.hint}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500" htmlFor="tutor-level">
            Level
          </label>
          <select
            id="tutor-level"
            className="rounded-lg border border-slate-200 bg-surface px-2 py-1.5 text-sm text-slate-700"
            value={level}
            onChange={(e) => setLevelOverride(e.target.value as CefrLevel)}
          >
            {CEFR_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode toggle — one transcript, two tutors. */}
      <div className="flex gap-2" role="tablist" aria-label="Tutor chat mode">
        {(Object.keys(TUTOR_MODES) as TutorChatMode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-200 bg-surface text-slate-600 hover:border-indigo-300'
            }`}
          >
            {TUTOR_MODES[m].emoji} {TUTOR_MODES[m].label}
          </button>
        ))}
      </div>

      {!aiReady && (
        <Card>
          <p className="text-sm text-slate-600">
            🎓 Tutor chat needs AI. Add your own key in{' '}
            <Link to="/settings" className="font-medium text-indigo-700 underline underline-offset-2">
              Settings → AI Model
            </Link>{' '}
            — or sign in (Settings → Account) for the free $1 AI credit.
          </p>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50/60">
          <p className="text-sm font-medium text-red-800">{error.message}</p>
          {error.hint && <p className="mt-1 text-xs text-red-600">{error.hint}</p>}
        </Card>
      )}

      <Card>
        <div className="max-h-[55vh] space-y-3 overflow-y-auto">
          {turns.length === 0 && !busy && (
            <p className="py-6 text-center text-sm text-slate-400">
              {mode === 'chat'
                ? 'Say hello — auf Deutsch geht’s los! 👋'
                : 'Ask anything: “Warum sagt man ‘zu Hause’?” …'}
            </p>
          )}
          {turns.map((t) => (
            <div
              key={t.id}
              className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  t.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-surface text-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{t.text}</p>
                {t.role === 'tutor' && t.translation && (
                  <p className="mt-1 border-t border-slate-100 pt-1 text-xs text-slate-400">
                    {t.translation}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Corrections from recent learner messages (same pipeline as role-play). */}
          {turns.some((t) => t.role === 'user' && t.mistakes && t.mistakes.length > 0) && (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Corrections from your recent messages
              </p>
              {turns
                .filter((t) => t.role === 'user' && t.mistakes && t.mistakes.length > 0)
                .slice(-3)
                .flatMap((t) =>
                  (t.mistakes ?? []).map((m, i) => (
                    <MistakeExplainer
                      key={`${t.id}-${i}`}
                      said={m.said}
                      corrected={m.corrected}
                      type={m.type}
                    >
                      <p className="text-sm">
                        <span className="text-red-700 line-through">{m.said}</span>
                        {' → '}
                        <span className="font-medium text-emerald-700">{m.corrected}</span>
                      </p>
                    </MistakeExplainer>
                  )),
                )}
              <p className="text-xs text-slate-500">
                Every correction also lands in the{' '}
                <Link to="/mistakes" className="font-medium text-indigo-700 hover:underline">
                  Mistake bank
                </Link>
                .
              </p>
            </div>
          )}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-surface px-4 py-2 text-sm text-slate-400">
                {mode === 'chat' ? 'Dein Tutor denkt…' : 'Thinking…'}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          className="mt-4 border-t border-slate-100 pt-4"
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
            placeholder={
              mode === 'chat'
                ? 'Schreib auf Deutsch… (Enter sends, Shift+Enter = new line)'
                : 'Ask about German — in English or German…'
            }
            disabled={busy || !aiReady}
            autoFocus
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="ok">{level}</Badge>
            <span className="text-xs text-slate-400">
              {meta.emoji} {meta.label}
            </span>
            <span className="flex-1" />
            {turns.length > 0 && (
              <Button type="button" disabled={busy} onClick={() => void newChat()}>
                ＋ New chat
              </Button>
            )}
            <Button variant="primary" type="submit" disabled={busy || !aiReady || input.trim().length === 0}>
              Send →
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
