import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card } from '../../components/ui'
import { PLACEMENT_BANK } from '../../content/grammar/placement'
import { assessPlacement, nextPlacementQuestion } from '../../engine/placement'
import type { PlacementAnswer, PlacementQuestion } from '../../engine/placement'
import { useAppStore } from '../../state/store'

/**
 * Adaptive placement quiz: A1→B1 staircase, max 20 questions.
 * Skippable at any time — the assessment uses whatever history exists.
 */
export default function PlacementPage() {
  const { profile, patchProfile } = useAppStore()
  const [history, setHistory] = useState<PlacementAnswer[]>([])
  const [answered, setAnswered] = useState<{ q: PlacementQuestion; opt: string; correct: boolean } | null>(null)
  const [finished, setFinished] = useState(false)
  const [busy, setBusy] = useState(false)

  const question: PlacementQuestion | null = nextPlacementQuestion(PLACEMENT_BANK, history)

  useEffect(() => {
    setAnswered(null)
  }, [question?.id])

  async function finish(finalHistory: PlacementAnswer[]): Promise<void> {
    const assessment = assessPlacement(finalHistory)
    await patchProfile({
      level: assessment.assessedLevel,
      placementResult: {
        assessedLevel: assessment.assessedLevel,
        correctByLevel: assessment.correctByLevel,
        takenAt: Date.now(),
      },
    })
    setFinished(true)
  }

  async function answer(opt: string): Promise<void> {
    if (!question || answered !== null || busy) return
    setBusy(true)
    const correct = opt === question.answer
    setAnswered({ q: question, opt, correct })
    const nextHistory = [...history, { id: question.id, cefr: question.cefr, correct }]
    setHistory(nextHistory)
    setBusy(false)
  }

  function next(): void {
    if (nextPlacementQuestion(PLACEMENT_BANK, history) === null || history.length >= 20) {
      void finish(history)
    }
    setAnswered(null)
  }

  if (finished || question === null) {
    const assessment = assessPlacement(history)
    return (
      <Card title="Placement result 🎯">
        <p className="text-sm text-slate-600">You answered {history.length} questions. Suggested starting level:</p>
        <p className="mt-2 text-center text-3xl font-bold text-indigo-700">{assessment.assessedLevel}</p>
        <p className="mt-2 text-xs text-slate-400">
          {history.length === 0
            ? 'Skipped — level unchanged.'
            : Object.entries(assessment.askedByLevel)
                .filter(([, asked]) => asked > 0)
                .map(([level, asked]) => `${level}: ${assessment.correctByLevel[level] ?? 0}/${asked}`)
                .join(' · ')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/grammar">
            <Button variant="primary">Start learning at {assessment.assessedLevel} →</Button>
          </Link>
        </div>
      </Card>
    )
  }

  const shown: PlacementQuestion | null = answered?.q ?? question

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Placement · question {history.length} · level {shown?.cefr} ·{' '}
          {shown?.kind === 'vocab' ? 'vocabulary' : 'grammar'}
        </span>
        <span>max 20</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: `${((history.length - 1) / 20) * 100}%` }}
        />
      </div>

      <Card>
        {shown?.kind === 'vocab' && (
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">What does this mean?</p>
        )}
        <p className="mt-2 text-center text-3xl font-bold text-slate-900">
          {shown?.kind === 'vocab' && shown.germanWord ? shown.germanWord : shown?.prompt}
        </p>

        <div className="mt-5 grid gap-2">
          {shown?.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              disabled={answered !== null}
              onClick={() => void answer(opt)}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                answered !== null && opt === shown.answer
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : answered?.opt === opt
                    ? 'border-rose-400 bg-rose-50 text-rose-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{i + 1}</span>
              {opt}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {answered !== null ? (
            <>
              <Badge tone={answered.correct ? 'ok' : 'bad'}>
                {answered.correct ? 'Richtig!' : `Correct: ${answered.q.answer}`}
              </Badge>
              <Button variant="primary" onClick={next}>
                Next →
              </Button>
            </>
          ) : (
            <Button disabled={busy} onClick={() => void finish(history)}>
              Skip quiz — keep {profile?.level ?? 'A1'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
