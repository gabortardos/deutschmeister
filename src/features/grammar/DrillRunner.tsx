import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, inputClass } from '../../components/ui'
import type { DrillItem } from '../../db/types'
import { recordDrillAttempt } from '../../db/repositories/grammarRepo'
import {
  drillHint,
  drillInstruction,
  drillOptions,
  drillTokens,
  gradeDrill,
  needsGermanKeys,
} from '../../engine/exerciseRunner'
import type { GradeResult } from '../../engine/grader'

interface Props {
  drills: DrillItem[]
  title?: string
  onFinish?: (score: { ok: number; bad: number }) => void
}

const TYPE_LABEL: Record<string, string> = {
  cloze: 'Fill the gap',
  choice: 'Pick the right one',
  transform: 'Transform the sentence',
  wordorder: 'Build the sentence',
  translate_de_en: 'Translate → English',
  translate_en_de: 'Translate → German',
}

/** Interactive runner for one drill round: Enter submits, 1–4 pick options. */
export default function DrillRunner({ drills, title, onFinish }: Props) {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<GradeResult | null>(null)
  const [score, setScore] = useState({ ok: 0, bad: 0 })
  const [busy, setBusy] = useState(false)

  const item = drills[index]
  const options = useMemo(() => (item?.type === 'choice' ? drillOptions(item) : []), [item])
  const tokens = useMemo(() => (item?.type === 'wordorder' ? drillTokens(item) : []), [item])
  const showKeys = item ? needsGermanKeys(item.type) : false
  const instruction = item?.type === 'transform' ? drillInstruction(item) : null
  const hint = item ? drillHint(item) : null

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (!item) return
      if (result !== null && e.key === 'Enter') {
        e.preventDefault()
        next()
        return
      }
      if (result !== null || busy) return
      if (item.type === 'choice') {
        const n = Number(e.key)
        if (n >= 1 && n <= options.length) {
          e.preventDefault()
          void submit(options[n - 1] ?? '')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })

  async function submit(given: string, revealed = false): Promise<void> {
    if (!item || result !== null || busy) return
    if (!revealed && given.trim().length === 0) return
    setBusy(true)
    const graded = revealed ? { correct: false, matched: null } : gradeDrill(item, given)
    setResult(graded)
    setScore((s) => ({ ok: s.ok + (graded.correct ? 1 : 0), bad: s.bad + (graded.correct ? 0 : 1) }))
    await recordDrillAttempt(item.id, graded.correct, revealed ? '(revealed)' : given)
    setBusy(false)
  }

  function next(): void {
    setAnswer('')
    setResult(null)
    if (index + 1 >= drills.length) onFinish?.(score)
    else setIndex((i) => i + 1)
  }

  if (!item) return null
  const progress = Math.round((index / drills.length) * 100)
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {title ? `${title} · ` : ''}Drill {index + 1} / {drills.length} · {TYPE_LABEL[item.type] ?? item.type}
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
        {instruction && (
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-indigo-600">{instruction}</p>
        )}
        <p className="text-center text-2xl font-bold leading-snug text-slate-900">{item.prompt}</p>
        {item.type === 'wordorder' && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {tokens.map((t, i) => (
              <Button
                key={`${t}-${i}`}
                type="button"
                disabled={result !== null}
                onClick={() => setAnswer((a) => (a.length === 0 ? t : `${a} ${t}`))}
              >
                {t}
              </Button>
            ))}
          </div>
        )}

        {item.type === 'choice' ? (
          <div className="mt-5 grid gap-2">
            {options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                disabled={result !== null}
                onClick={() => void submit(opt)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                  result !== null && opt === item.acceptedAnswers[0]
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{i + 1}</span>
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              void submit(answer)
            }}
          >
            <input
              className={`${inputClass} text-center text-lg`}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer…"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={result !== null}
              autoFocus
            />
            {showKeys && (
              <div className="flex justify-center gap-2">
                {['ä', 'ö', 'ü', 'ß'].map((ch) => (
                  <Button key={ch} type="button" disabled={result !== null} onClick={() => setAnswer((t) => t + ch)}>
                    {ch}
                  </Button>
                ))}
              </div>
            )}
            {result === null && (
              <div className="flex justify-center gap-2">
                <Button variant="primary" type="submit" disabled={answer.trim().length === 0 || busy}>
                  Check
                </Button>
                <Button type="button" disabled={busy} onClick={() => void submit('', true)}>
                  Show answer
                </Button>
              </div>
            )}
          </form>
        )}

        {hint && result === null && item.type !== 'transform' && (
          <p className="mt-3 text-center text-xs text-slate-400">Hint: {hint}</p>
        )}

        {result !== null && (
          <div className="mt-4 space-y-3 text-center">
            {result.correct ? <Badge tone="ok">Richtig!</Badge> : <Badge tone="bad">Correct: {item.acceptedAnswers[0]}</Badge>}
            <div>
              <Button variant="primary" onClick={next}>
                {index + 1 >= drills.length ? 'Finish' : 'Next →'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
