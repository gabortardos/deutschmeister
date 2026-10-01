import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Card, Kbd } from '../../components/ui'
import { checkCloze, type ClozeItem } from '../../engine/clozeReviews'
import { choiceKeyIndex, resultKeyAction } from '../../engine/sessionKeys'
import { useAppStore } from '../../state/store'
import { tts } from '../../speech/tts'

export interface ClozeSessionProps {
  items: ClozeItem[]
  onWordReviewed: (wordId: string, quality: number) => Promise<unknown>
  onDrillDone: () => Promise<unknown>
  onFinish: () => void
}

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * M11.6 cloze review: example sentences of learned words with the word gapped
 * out — pick the missing word from 4 choices (same-theme distractors). Every
 * answer feeds SM-2 (correct 4 / wrong 1) like the other practice modes.
 */
export function ClozeSession({ items, onWordReviewed, onDrillDone, onFinish }: ClozeSessionProps) {
  const [index, setIndex] = useState(0)
  const [pick, setPick] = useState<string | null>(null)
  const [score, setScore] = useState({ ok: 0, bad: 0 })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  /** M10.5-style guard: focused-button Enter + key handler both fire otherwise. */
  const completingRef = useRef(false)
  const speechSettings = useAppStore((s) => s.settings)

  const item = items[index]
  // Engine returns [answer, ...distractors] deterministically — shuffle for display, stable per item.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => (item ? shuffle(item.options) : []), [item?.id])

  const correct = pick !== null && item ? checkCloze(item, pick) : false

  function speakSentence(): void {
    if (!item) return
    tts.speak(`${item.before}${item.answer}${item.after}`, {
      rate: speechSettings?.ttsRate,
      voiceURI: speechSettings?.ttsVoice,
    })
  }

  async function choose(choice: string): Promise<void> {
    if (!item || pick !== null || busy) return
    setBusy(true)
    const isCorrect = checkCloze(item, choice)
    setPick(choice)
    setScore((s) => ({ ok: s.ok + (isCorrect ? 1 : 0), bad: s.bad + (isCorrect ? 0 : 1) }))
    await onWordReviewed(item.wordId, isCorrect ? 4 : 1)
    await onDrillDone()
    if (isCorrect) speakSentence()
    setBusy(false)
  }

  function next(): void {
    if (!item || completingRef.current) return
    setPick(null)
    if (index + 1 >= items.length) {
      completingRef.current = true
      setDone(true)
    } else {
      setIndex((i) => i + 1)
    }
  }

  // M13.1 fix: next() latches the guard when it shows the done screen; re-arm
  // it once that screen renders so "Back to overview" (button + Enter) works.
  useEffect(() => {
    if (done) completingRef.current = false
  }, [done])

  function finish(): void {
    if (completingRef.current) return
    completingRef.current = true
    onFinish()
  }

  // M10.5 keyboard: 1–9 pick an option, Space/Enter continue after a result or on the summary.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (busy || completingRef.current) return
      if (done) {
        if (resultKeyAction(e.key)) {
          e.preventDefault()
          finish()
        }
        return
      }
      if (!item) return
      if (pick === null) {
        const i = choiceKeyIndex(e.key, options.length)
        if (i !== null) {
          e.preventDefault()
          void choose(options[i])
        }
        return
      }
      if (resultKeyAction(e.key)) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (done) {
    const total = score.ok + score.bad
    return (
      <Card title="Cloze review complete 🎉">
        <p className="text-sm text-slate-600">
          {total} sentence{total === 1 ? '' : 's'}:{' '}
          <span className="font-semibold text-emerald-700">{score.ok} correct</span>,{' '}
          <span className="font-semibold text-red-700">{score.bad} missed</span>.
        </p>
        <p className="mt-2 text-sm text-slate-500">All results fed your SM-2 schedule — see Review for the plan.</p>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="primary" onClick={finish}>
            Back to overview
          </Button>
          <Kbd>Enter</Kbd>
        </div>
      </Card>
    )
  }

  if (!item) return null
  const progress = Math.round((index / items.length) * 100)
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Cloze {index + 1} / {items.length} · pick the missing word
          </span>
          <span>
            {score.ok} ✓ · {score.bad} ✗
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Card>
        <p className="text-center text-lg font-semibold leading-relaxed text-slate-900">
          {item.before}
          <span
            className={`mx-1 inline-block min-w-16 rounded px-2 py-0.5 font-bold ${
              pick === null
                ? 'bg-slate-200 text-slate-400'
                : correct
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {pick === null ? '???' : item.answer}
          </span>
          {item.after}
        </p>
        {item.sentenceEn && <p className="mt-2 text-center text-sm italic text-slate-500">{item.sentenceEn}</p>}

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map((opt, i) => {
            const isPick = pick === opt
            const isAnswer = checkCloze(item, opt)
            const tone =
              pick === null
                ? ''
                : isAnswer
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                  : isPick
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'opacity-50'
            return (
              <button
                key={opt}
                type="button"
                disabled={pick !== null || busy}
                onClick={() => void choose(opt)}
                className={`flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-surface px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors ${tone}`}
              >
                <span>{opt}</span>
                <Kbd>{i + 1}</Kbd>
              </button>
            )
          })}
        </div>

        {pick !== null && (
          <div className="dm-reveal mt-4 space-y-3 text-center">
            {correct ? <Badge tone="ok">Richtig! {item.word}</Badge> : <Badge tone="bad">Answer: {item.answer}</Badge>}
            <p className="text-xs text-slate-400">every answer updates your SM-2 schedule</p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={speakSentence}>🔊 Hear sentence</Button>
              <Button variant="primary" onClick={next}>
                {index + 1 >= items.length ? 'Finish' : 'Next →'}
              </Button>
              <Kbd>Enter</Kbd>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

