import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, inputClass } from '../../components/ui'
import { introducedWords, reviewWord } from '../../db/repositories/vocabRepo'
import { gradeAnswer } from '../../engine/grader'
import {
  gradeSpoken,
  qualityForVerdict,
  speakListenItems,
  type SpeakListenItem,
  type SpokenGrade,
} from '../../engine/speakListen'
import { useAppStore } from '../../state/store'
import { stt } from '../../speech/stt'
import { tts } from '../../speech/tts'

/** Words per speak & listen session (each word yields one listen + one speak item). */
const SESSION_WORDS = 10

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

type Phase = 'idle' | 'session' | 'done'

interface ListenResult {
  correct: boolean
  revealed: boolean
}

interface SpeakState {
  heard: string
  grade: SpokenGrade
  best: SpokenGrade
}

/**
 * M4 speaking & listening drills over the learned word bank.
 * Listening: TTS speaks the German word → the learner types it (umlaut-tolerant).
 * Speaking: the learner sees the English meaning → says the German word → the STT
 * transcript is matched with the speech matcher (verdict + similarity feedback).
 * Every answer feeds SM-2 via reviewWord, like the other practice modes.
 */
export default function SpeakListenPage() {
  const { hydrated, bumpDrills, refreshToday } = useAppStore()
  const settings = useAppStore((s) => s.settings)

  const [phase, setPhase] = useState<Phase>('idle')
  const [items, setItems] = useState<SpeakListenItem[]>([])
  const [index, setIndex] = useState(0)
  const [introduced, setIntroduced] = useState<number | null>(null)

  const [typed, setTyped] = useState('')
  const [listenResult, setListenResult] = useState<ListenResult | null>(null)
  const [speakState, setSpeakState] = useState<SpeakState | null>(null)
  const [listening, setListening] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [score, setScore] = useState({ ok: 0, almost: 0, bad: 0 })
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const sttAvailable = stt.supported && settings?.sttEnabled !== false
  const item = items[index]

  const speak = (text: string, slower = false): void => {
    tts.speak(text, {
      rate: (settings?.ttsRate ?? 0.9) * (slower ? 0.7 : 1),
      voiceURI: settings?.ttsVoice,
    })
  }

  useEffect(() => {
    void introducedWords().then((words) => setIntroduced(words.length))
  }, [])

  // Auto-play the audio when a listening item arrives.
  useEffect(() => {
    if (phase === 'session' && item?.kind === 'listen') {
      speak(item.answer)
      inputRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, phase])

  const summary = useMemo(() => {
    const total = score.ok + score.almost + score.bad
    return { total, percent: total === 0 ? 0 : Math.round(((score.ok + score.almost * 0.5) / total) * 100) }
  }, [score])

  function resetItemState(): void {
    setTyped('')
    setListenResult(null)
    setSpeakState(null)
    setMicError(null)
  }

  async function startSession(): Promise<void> {
    const words = shuffle(await introducedWords()).slice(0, SESSION_WORDS)
    setItems(speakListenItems(words, { sttAvailable }))
    setIndex(0)
    setScore({ ok: 0, almost: 0, bad: 0 })
    resetItemState()
    setPhase('session')
  }

  function submitListen(revealed = false): void {
    if (!item || item.kind !== 'listen' || listenResult || busy) return
    if (!revealed && typed.trim().length === 0) return
    const graded = revealed ? { correct: false } : gradeAnswer(typed, item.accepted, { articleOptional: true })
    setListenResult({ correct: graded.correct, revealed })
    setScore((s) => ({ ...s, ok: s.ok + (graded.correct ? 1 : 0), bad: s.bad + (graded.correct ? 0 : 1) }))
    if (graded.correct) speak(item.answer)
  }

  async function mic(): Promise<void> {
    if (!item || item.kind !== 'speak' || listening) return
    setListening(true)
    setMicError(null)
    try {
      const res = await stt.listenOnce('de-DE')
      const grade = gradeSpoken(res.transcript, item.accepted)
      setSpeakState((prev) => ({
        heard: res.transcript,
        grade,
        // Best attempt across retries decides the SRS quality.
        best: prev && prev.best.similarity > grade.similarity ? prev.best : grade,
      }))
      if (grade.verdict === 'correct') speak(item.answer)
    } catch (e) {
      setMicError(e instanceof Error ? e.message : 'Microphone error')
    } finally {
      setListening(false)
    }
  }

  function submitSpeakTyped(): void {
    if (!item || item.kind !== 'speak' || speakState || busy) return
    if (typed.trim().length === 0) return
    const grade = gradeSpoken(typed, item.accepted)
    setSpeakState({ heard: `(typed) ${typed}`, grade, best: grade })
    if (grade.verdict === 'correct') speak(item.answer)
  }

  async function next(): Promise<void> {
    if (!item || busy) return
    setBusy(true)
    try {
      if (item.kind === 'listen' && listenResult) {
        await reviewWord(item.wordId, listenResult.revealed ? 1 : listenResult.correct ? 4 : 1)
        await bumpDrills()
      } else if (item.kind === 'speak' && speakState) {
        await reviewWord(item.wordId, qualityForVerdict(speakState.best.verdict))
        await bumpDrills()
      }
      if (index + 1 >= items.length) await refreshToday()
      resetItemState()
      if (index + 1 >= items.length) setPhase('done')
      else setIndex((i) => i + 1)
    } finally {
      setBusy(false)
    }
  }

  // Enter after a result → next item (matches the grammar DrillRunner UX).
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Enter' && ((item?.kind === 'listen' && listenResult) || (item?.kind === 'speak' && speakState))) {
        e.preventDefault()
        void next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })

  if (!hydrated) return <p className="text-sm text-slate-500">Loading your data…</p>

  if (phase === 'idle') {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-slate-900">Speak &amp; Listen</h1>
        <Card
          title="Train your ears and your pronunciation 🎧🎤"
          description={`A mixed session over ${SESSION_WORDS} words from your learned bank — every answer updates your SRS schedule.`}
        >
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>
              <span className="font-medium text-slate-800">Listening:</span> hear the German word, type what you heard
              (umlaut-free typing accepted).
            </li>
            <li>
              <span className="font-medium text-slate-800">Speaking:</span> see the English meaning, say the German word
              — your speech is transcribed and matched, with similarity feedback.
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone={tts.supported ? 'ok' : 'bad'}>TTS {tts.supported ? 'available' : 'unsupported'}</Badge>
            <Badge tone={sttAvailable ? 'ok' : 'warn'}>
              Microphone {sttAvailable ? 'available' : 'typing only (speaking drills skipped)'}
            </Badge>
          </div>
          <div className="mt-4">
            {introduced === 0 ? (
              <p className="text-sm text-slate-500">
                Learn your first words first —{' '}
                <Link className="font-medium text-indigo-700" to="/vocab">
                  Vocabulary
                </Link>{' '}
                unlocks this trainer.
              </p>
            ) : (
              <Button variant="primary" onClick={() => void startSession()}>
                Start session →
              </Button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-slate-900">Speak &amp; Listen</h1>
        <Card title="Session complete 🎉">
          <p className="text-sm text-slate-600">
            {summary.total} drills: <span className="font-semibold text-emerald-700">{score.ok} correct</span>,{' '}
            <span className="font-semibold text-amber-700">{score.almost} almost</span>,{' '}
            <span className="font-semibold text-red-700">{score.bad} missed</span> · score {summary.percent}%.
          </p>
          <p className="mt-2 text-sm text-slate-500">All results fed your SM-2 schedule — see Review for the plan.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={() => void startSession()}>
              Another round 🔁
            </Button>
            <Button onClick={() => setPhase('idle')}>Back</Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!item) return null
  const progress = Math.round((index / items.length) * 100)
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Drill {index + 1} / {items.length} ·{' '}
            {item.kind === 'listen' ? '🔊 Listen — type what you hear' : '🎤 Speak — say it in German'}
          </span>
          <span>
            {score.ok} ✓ · {score.almost} ~ · {score.bad} ✗
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {item.kind === 'listen' ? (
        <Card>
          <div className="text-center">
            <button
              type="button"
              className="text-5xl transition-transform hover:scale-110"
              onClick={() => speak(item.answer)}
              aria-label="Play the German word"
            >
              🔊
            </button>
            <div className="mt-3 flex justify-center gap-2">
              <Button type="button" onClick={() => speak(item.answer)}>
                Play again
              </Button>
              <Button type="button" onClick={() => speak(item.answer, true)}>
                🐢 Slower
              </Button>
            </div>
          </div>
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              submitListen()
            }}
          >
            <input
              ref={inputRef}
              className={`${inputClass} text-center text-lg`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type what you heard…"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={listenResult !== null}
            />
            {!listenResult && (
              <div className="flex justify-center gap-2">
                <Button variant="primary" type="submit" disabled={typed.trim().length === 0}>
                  Check
                </Button>
                <Button type="button" onClick={() => submitListen(true)}>
                  Show answer
                </Button>
              </div>
            )}
          </form>
          {listenResult && (
            <div className="mt-4 space-y-3 text-center">
              {listenResult.correct ? (
                <Badge tone="ok">Richtig! {item.answer}</Badge>
              ) : (
                <Badge tone="bad">
                  {listenResult.revealed ? 'It was' : 'Correct'}: {item.answer} — {item.prompt}
                </Badge>
              )}
              <div>
                <Button variant="primary" disabled={busy} onClick={() => void next()}>
                  {index + 1 >= items.length ? 'Finish' : 'Next →'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Say it in German</p>
          <p className="mt-2 text-center text-3xl font-bold text-slate-900">{item.prompt}</p>
          {item.accepted.length > 1 && (
            <p className="mt-1 text-center text-xs text-slate-400">noun — article included in the answer</p>
          )}
          <div className="mt-5 text-center">
            <Button variant="primary" type="button" disabled={listening} onClick={() => void mic()}>
              {listening ? '● Listening…' : '🎤 Say it'}
            </Button>
          </div>
          {micError && !speakState && (
            <div className="mt-4 text-center">
              <p className="text-xs text-red-600">{micError}</p>
              <form
                className="mt-2 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  submitSpeakTyped()
                }}
              >
                <input
                  className={`${inputClass} text-center`}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Microphone failed — type the German instead…"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <Button variant="primary" type="submit" disabled={typed.trim().length === 0}>
                  Check
                </Button>
              </form>
            </div>
          )}
          {speakState && (
            <div className="mt-4 space-y-3 text-center">
              <p className="text-sm text-slate-500">
                I heard: <span className="font-medium text-slate-800">„{speakState.heard}“</span>
              </p>
              {speakState.grade.verdict === 'correct' && <Badge tone="ok">Richtig! {item.answer}</Badge>}
              {speakState.grade.verdict === 'almost' && (
                <Badge tone="warn">
                  Fast! {Math.round(speakState.grade.similarity * 100)}% — correct: {item.answer}
                </Badge>
              )}
              {speakState.grade.verdict === 'incorrect' && (
                <Badge tone="bad">
                  Not quite ({Math.round(speakState.grade.similarity * 100)}%) — correct: {item.answer}
                </Badge>
              )}
              <div className="flex justify-center gap-2">
                <Button type="button" onClick={() => speak(item.answer)}>
                  🔊 Hear it
                </Button>
                <Button type="button" disabled={listening} onClick={() => void mic()}>
                  Try again
                </Button>
                <Button variant="primary" disabled={busy} onClick={() => void next()}>
                  {index + 1 >= items.length ? 'Finish' : 'Next →'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
