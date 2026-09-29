import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, inputClass } from '../../components/ui'
import { MistakeExplainer } from '../mistakes/MistakeExplainer'
import {
  WRITING_MAX_WORDS,
  WRITING_MIN_WORDS,
  countWords,
  promptForDay,
  writingQuota,
  writingWordCap,
} from '../../engine/writing'
import { keyOfDay } from '../../engine/progressStats'
import { allPieces, savePiece } from '../../db/repositories/writingRepo'
import { CEFR_LEVELS, type CefrLevel, type WritingPiece } from '../../db/types'
import { hintForLlmError } from '../../llm/adapter'
import { PlatformAiError } from '../../llm/platform'
import { gradeWriting } from '../../llm/services'
import { newId } from '../../utils/id'
import { useAppStore } from '../../state/store'
import { useLlmDeps } from '../../state/useLlmDeps'
import { usePlatformStore } from '../../state/platformStore'

function toError(e: unknown): { message: string; hint?: string } {
  if (e instanceof PlatformAiError) return { message: e.message, hint: e.hint }
  const message = e instanceof Error ? e.message : String(e)
  return { message, hint: hintForLlmError(message) }
}

/** localStorage key for the chosen CEFR level (falls back to the profile level). */
const LEVEL_KEY = 'dm-writing-level'

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

function isCefr(value: string | null): value is CefrLevel {
  return value !== null && (CEFR_LEVELS as readonly string[]).includes(value)
}

/**
 * Read-only feedback view for one graded piece — fresh grading and archive
 * replay share it. Corrections are MistakeExplainer rows (tap → micro-lesson
 * + Explain ✨), exactly like the chat pages.
 */
function PieceResult({
  piece,
  onDone,
  canWriteAnother,
}: {
  piece: WritingPiece
  onDone: () => void
  canWriteAnother: boolean
}) {
  const mistakes = piece.mistakes ?? []
  return (
    <Card title="Your feedback ✍️" description="Saved on this device — corrections also land in the Mistake bank.">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {piece.cefr} · {piece.wordCount} words · {dateFmt.format(new Date(piece.createdAt))}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-800">{piece.promptDe}</p>
      <p className="text-xs text-slate-500">{piece.promptEn}</p>

      <div className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        {piece.text}
      </div>

      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
        <p className="text-sm text-slate-700">{piece.feedback}</p>
        {piece.strengths.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {piece.strengths.map((s, i) => (
              <Badge key={`${i}-${s}`} tone="ok">
                👍 {s}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Corrections ({mistakes.length})</p>
        {mistakes.length === 0 ? (
          <p className="text-sm text-slate-500">No corrections — a clean text. 🎉</p>
        ) : (
          mistakes.map((m, i) => (
            <MistakeExplainer key={i} said={m.said} corrected={m.corrected} type={m.type}>
              <p className="text-sm">
                <span className="text-red-700 line-through">{m.said}</span>
                {' → '}
                <span className="font-medium text-emerald-700">{m.corrected}</span>
              </p>
            </MistakeExplainer>
          ))
        )}
        <p className="text-xs text-slate-500">
          Every correction also lands in the{' '}
          <Link to="/mistakes" className="font-medium text-indigo-700 hover:underline">
            Mistake bank
          </Link>
          .
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canWriteAnother && (
          <Button variant="primary" onClick={onDone}>
            Write another ✍️
          </Button>
        )}
        <Button onClick={onDone}>Close</Button>
      </div>
    </Card>
  )
}

/**
 * M11.9 free writing: one prompt a day per CEFR level (🎲 shuffles through the
 * static bank), a live word counter against the soft cap, and homework-style
 * grading via `gradeWriting` — overall feedback, strengths and a correction
 * list that reuses the conversation-mistake pipeline (Mistake bank + Insights
 * + streak). Day limits: 1 free · 3 Basic/Plus · 5 Pro (M11.10) · 10 BYO.
 */
export default function WritingPage() {
  const { profile } = useAppStore()
  const [levelChoice, setLevelChoice] = useState<CefrLevel | null>(() => {
    const saved = localStorage.getItem(LEVEL_KEY)
    return isCefr(saved) ? saved : null
  })
  const [shuffle, setShuffle] = useState(0)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null)
  const [pieces, setPieces] = useState<WritingPiece[]>([])
  const [viewing, setViewing] = useState<WritingPiece | null>(null)

  const { deps, route } = useLlmDeps('writing')
  const plan = usePlatformStore((s) => s.plan)
  const aiReady = route !== 'none'
  const level = levelChoice ?? profile?.level ?? 'A1'

  useEffect(() => {
    void refreshPieces()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (levelChoice) localStorage.setItem(LEVEL_KEY, levelChoice)
  }, [levelChoice])

  async function refreshPieces(): Promise<void> {
    setPieces(await allPieces())
  }

  const dayKey = keyOfDay(Date.now())
  const prompt = promptForDay(level, dayKey, shuffle)
  const quota = writingQuota(pieces, route, plan, Date.now())
  const cap = writingWordCap(plan)
  const words = countWords(text)
  const overCap = words > cap
  const tooLong = words > WRITING_MAX_WORDS
  const tooShort = words > 0 && words < WRITING_MIN_WORDS
  const canSubmit = aiReady && !busy && quota.left > 0 && words >= WRITING_MIN_WORDS && !tooLong

  async function submit(): Promise<void> {
    const trimmed = text.trim()
    if (!deps || busy || !canSubmit) return
    setError(null)
    setBusy(true)
    try {
      const grade = await gradeWriting(deps, {
        level,
        promptDe: prompt.taskDe,
        promptEn: prompt.taskEn,
        text: trimmed,
      })
      const now = Date.now()
      const piece: WritingPiece = {
        id: newId(),
        updatedAt: now,
        createdAt: now,
        cefr: level,
        promptId: prompt.id,
        promptDe: prompt.taskDe,
        promptEn: prompt.taskEn,
        text: trimmed,
        wordCount: countWords(trimmed),
        mistakes: grade.mistakes,
        feedback: grade.overall,
        strengths: grade.strengths,
      }
      await savePiece(piece)
      setViewing(piece)
      setText('')
      setShuffle(0)
      await refreshPieces()
    } catch (e) {
      setError(toError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Free writing ✍️</h1>
        <p className="mt-1 text-sm text-slate-500">
          Write a short text on a prompt at your level — the tutor grades it like homework: overall feedback,
          strengths and every mistake.
        </p>
      </div>

      {!aiReady && (
        <Card>
          <p className="text-sm text-slate-600">
            ✍️ Grading needs AI. Add your own key in{' '}
            <Link to="/settings" className="font-medium text-indigo-700 underline underline-offset-2">
              Settings → AI Model
            </Link>{' '}
            — or sign in (Settings → Account) for the free $1 AI credit. Prompts and your saved pieces keep
            working without either.
          </p>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          Level
          <select
            className={`${inputClass} w-auto`}
            value={level}
            onChange={(e) => {
              setLevelChoice(e.target.value as CefrLevel)
              setShuffle(0)
              setText('')
              setViewing(null)
            }}
          >
            {CEFR_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        {aiReady && (
          <Badge tone={quota.left > 0 ? 'ok' : 'bad'}>
            {quota.left} of {quota.limit} {quota.limit === 1 ? 'piece' : 'pieces'} left today
          </Badge>
        )}
        {route === 'byo' && <span className="text-xs text-slate-400">your key, your tokens</span>}
      </div>

      {viewing ? (
        <PieceResult
          piece={viewing}
          canWriteAnother={aiReady && quota.left > 0}
          onDone={() => setViewing(null)}
        />
      ) : aiReady && quota.left === 0 ? (
        <Card title="Daily limit reached 🌙">
          <p className="text-sm text-slate-600">
            You have had {quota.usedToday} of {quota.limit} graded {quota.usedToday === 1 ? 'piece' : 'pieces'}{' '}
            today — grading comes back tomorrow. Your texts stay saved below.
          </p>
          {route === 'platform' && plan === 'free' && (
            <p className="mt-2 text-xs text-slate-500">
              Need more? Basic and Plus include 3 graded pieces per day — see{' '}
              <Link to="/settings" className="font-medium text-indigo-700 underline underline-offset-2">
                Settings → Account &amp; Billing
              </Link>
              .
            </p>
          )}
        </Card>
      ) : (
        <Card
          title={`Today's prompt — ${level}`}
          description={`Aim for ~${cap} words. The grader quotes every real mistake — it never rewrites your text.`}
        >
          <p className="text-base font-medium text-slate-900">{prompt.taskDe}</p>
          <p className="mt-1 text-sm text-slate-500">{prompt.taskEn}</p>
          <div className="mt-2">
            <Button onClick={() => setShuffle((s) => s + 1)}>🎲 Another prompt</Button>
          </div>

          <form
            className="mt-4 space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            <textarea
              className={inputClass}
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Schreib auf Deutsch…"
              disabled={busy || !aiReady}
            />
            <p className={`text-xs ${tooLong ? 'text-red-600' : overCap ? 'text-amber-600' : 'text-slate-400'}`}>
              {words} / {cap} words
              {tooLong && ` — too long: please trim to ${WRITING_MAX_WORDS} words to submit`}
              {!tooLong && overCap && ' — past the soft cap: fine, just pricier to grade'}
              {!tooLong && tooShort && ` — write at least ${WRITING_MIN_WORDS} words to submit`}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="primary" type="submit" disabled={!canSubmit}>
                {busy ? 'Grading…' : 'Check my writing ✨'}
              </Button>
              {text.length > 0 && !busy && (
                <Button type="button" onClick={() => setText('')}>
                  Clear
                </Button>
              )}
            </div>
          </form>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p>{error.message}</p>
              {error.hint && <p className="mt-1 text-xs text-red-600">{error.hint}</p>}
            </div>
          )}
        </Card>
      )}

      {pieces.length > 0 && (
        <Card
          title="Your recent pieces"
          description="Every graded piece is saved on this device — tap View to read the feedback again."
        >
          <ul className="divide-y divide-slate-100">
            {pieces.slice(0, 10).map((p) => {
              const corrections = p.mistakes?.length ?? 0
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                  <span className="font-medium text-slate-800">{p.cefr}</span>
                  <span className="min-w-0 flex-1 truncate text-slate-500">{p.promptDe}</span>
                  <span className="text-xs text-slate-400">
                    {p.wordCount} words · {corrections} correction{corrections === 1 ? '' : 's'} ·{' '}
                    {dateFmt.format(new Date(p.createdAt))}
                  </span>
                  <Button onClick={() => setViewing(p)}>View</Button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}