import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui'
import type { Lesson, LessonCheckpoint, LessonTable } from '../../content/grammar/lessons/types'
import type { GrammarTopic } from '../../db/types'
import { gradeCheckpoint, lessonProgress } from '../../engine/lessons'
import { setTutorPrefill } from '../tutor/tutorPrefill'

/** Inline **bold** renderer — the MiniMarkdown subset, inline only. */
function rich(text: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))
}

function RichTable({ table }: { table: LessonTable }) {
  return (
    <div className="space-y-1">
      {table.caption && <p className="text-xs italic text-slate-500">{table.caption}</p>}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr>
              {table.headers.map((h, i) => (
                <th
                  key={i}
                  className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r} className="border-b border-slate-100 last:border-0">
                {row.map((cell, c) => (
                  <td key={c} className="px-3 py-1.5 text-slate-700">
                    {rich(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const SECTION_H = 'mt-5 text-sm font-bold uppercase tracking-wide text-indigo-700'

function CheckpointItem({
  cp,
  index,
  chosen,
  onPick,
}: {
  cp: LessonCheckpoint
  index: number
  chosen: number | undefined
  onPick: (optionIndex: number) => void
}) {
  const outcome = chosen === undefined ? null : gradeCheckpoint(cp, chosen)
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-sm font-medium text-slate-800">
        {index + 1}. {cp.question}
      </p>
      <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
        {cp.options.map((opt, oi) => {
          const revealed = chosen !== undefined
          const isAnswer = oi === cp.answer
          const isChosen = chosen === oi
          let cls = 'border-slate-300 bg-surface text-slate-700 hover:border-indigo-400'
          if (revealed && isChosen && isAnswer) cls = 'border-emerald-500 bg-emerald-50 text-emerald-800'
          else if (revealed && isChosen) cls = 'border-red-400 bg-red-50 text-red-700'
          else if (revealed && isAnswer) cls = 'border-emerald-300 bg-surface text-emerald-700'
          return (
            <button
              key={oi}
              type="button"
              onClick={() => onPick(oi)}
              className={`rounded-lg border px-3 py-1.5 text-left text-sm transition-colors ${cls}`}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {outcome && (
        <p className={`mt-2 text-xs ${outcome.correct ? 'text-emerald-700' : 'text-slate-600'}`}>
          {outcome.correct ? '✅ ' : '❌ Not quite — try again. '}
          {rich(outcome.explanation)}
        </p>
      )}
    </div>
  )
}


/** Prints just the cheat sheet via a hidden iframe — no global print CSS needed. */
function printCheatSheet(lesson: Lesson, topic: GrammarTopic): void {
  const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const items = lesson.cheatSheet
    .map((line) => `<li>${esc(line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>`)
    .join('')
  const html = [
    '<!doctype html><html><head><meta charset="utf-8">',
    `<title>${esc(topic.title)} — cheat sheet</title>`,
    '<style>body{font-family:Georgia,serif;max-width:640px;margin:28px auto;color:#111}',
    'h1{font-size:18px;margin:0 0 2px}p.sub{font-size:12px;color:#555;margin:0 0 14px}',
    'ul{padding-left:18px}li{margin:7px 0;font-size:14px;line-height:1.45}</style></head><body>',
    `<h1>${esc(topic.title)}</h1><p class="sub">${esc(topic.cefr)} · ${esc(topic.focus)} · DeutschMeister cheat sheet</p>`,
    `<ul>${items}</ul>`,
    '</body></html>',
  ].join('')
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  if (doc) {
    doc.open()
    doc.write(html)
    doc.close()
    window.setTimeout(() => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
      frame.remove()
    }, 100)
  } else {
    frame.remove()
  }
}

/**
 * M14 — the 📖 Lesson tab body: hook → worked sections → mistakes →
 * interactive checkpoints → printable cheat sheet → "Now practice it" CTA.
 */
export default function LessonView({
  lesson,
  topic,
  drillsCount,
  onPractice,
}: {
  lesson: Lesson
  topic: GrammarTopic
  drillsCount: number
  onPractice: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const progress = lessonProgress(lesson.checkpoints, answers)

  return (
    <div className="mt-2 space-y-3">
      <p className="text-sm leading-relaxed text-slate-600">
        <span className="font-semibold text-indigo-700">📖 {lesson.minutes} min lesson.</span> {rich(lesson.hook)}
      </p>

      {lesson.sections.map((section, i) => (
        <div key={i} className="space-y-2">
          <h3 className={SECTION_H}>{section.heading}</h3>
          {section.prose.map((p, j) => (
            <p key={j} className="text-sm leading-relaxed text-slate-700">
              {rich(p)}
            </p>
          ))}
          {section.table && <RichTable table={section.table} />}
        </div>
      ))}

      <h3 className={SECTION_H}>Typical mistakes — see the trap, dodge the trap</h3>
      <div className="space-y-2">
        {lesson.mistakes.map((m, i) => (
          <div key={i} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <p className="text-sm">
              <span className="text-red-700 line-through">{m.wrong}</span>
              {' → '}
              <span className="font-medium text-emerald-700">{m.right}</span>
            </p>
            <p className="mt-1 text-xs text-slate-600">{rich(m.why)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className={SECTION_H}>Checkpoints</h3>
        <span className="text-xs font-medium text-slate-500">
          {progress.correct}/{progress.total} solved
        </span>
      </div>
      <div className="space-y-2">
        {lesson.checkpoints.map((cp, i) => (
          <CheckpointItem
            key={cp.id}
            cp={cp}
            index={i}
            chosen={answers[cp.id]}
            onPick={(oi) => setAnswers((prev) => ({ ...prev, [cp.id]: oi }))}
          />
        ))}
      </div>
      {progress.solvedAll && (
        <p className="text-xs font-medium text-emerald-700">
          All checkpoints solved — now lock it in with the drills!
        </p>
      )}

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">🖨 Cheat sheet</p>
          <Button onClick={() => printCheatSheet(lesson, topic)}>Print cheat sheet</Button>
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {lesson.cheatSheet.map((line, i) => (
            <li key={i} className="text-sm text-slate-700">
              {rich(line)}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={onPractice} disabled={drillsCount === 0}>
          Now practice it → {drillsCount > 0 ? `(${drillsCount} drills)` : ''}
        </Button>
        <Link
          to="/tutor"
          onClick={() =>
            setTutorPrefill({
              question: `About the lesson “${topic.title}” (${topic.cefr}): `,
              // M14.1: carry the cheat sheet along so the tutor teaches grounded in
              // what the lesson actually said (and can go deeper than it).
              context: [
                `Lesson topic: ${topic.title} (${topic.cefr}).`,
                ...lesson.cheatSheet.map((line) => `- ${line.replace(/\*\*/g, '')}`),
              ].join('\n'),
            })
          }
        >
          <Button>💬 Ask about this lesson</Button>
        </Link>
      </div>
    </div>
  )
}
