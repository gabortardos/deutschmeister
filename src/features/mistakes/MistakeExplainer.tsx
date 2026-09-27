import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MiniMarkdown } from '../../components/markdown'
import { Button } from '../../components/ui'
import { getAllTopics } from '../../db/repositories/grammarRepo'
import { findTopicForMistake, mistakeLesson } from '../../engine/mistakeLessons'
import { explainMistake, normalizeCategory } from '../../llm/services'
import { useAppStore } from '../../state/store'
import { useLlmDeps } from '../../state/useLlmDeps'

interface Props {
  said: string
  corrected: string
  /** Raw category string from the turn payload — normalized defensively. */
  type: string
  /** Button chrome: red pill in the chat transcript, plain row elsewhere. */
  variant?: 'pill' | 'plain'
  children: ReactNode
}

/**
 * M11.3 hybrid mistake explanation (PHASE2_PLAN): tap the correction →
 * (a) instant static micro-lesson from engine/mistakeLessons (free, offline),
 * deep link to the matching grammar topic, plus (b) optional "Explain ✨"
 * LLM call — 2–3 sentences about THIS sentence, routed through LlmCache so
 * repeat explanations are free. Click/tap only (mobile-first PWA, no hover).
 */
export function MistakeExplainer({ said, corrected, type, variant = 'plain', children }: Props) {
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState<{ id: string; title: string } | null | undefined>(undefined)
  const [aiText, setAiText] = useState<string | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const { deps } = useLlmDeps('explain-mistake')
  const level = useAppStore((s) => s.profile?.level) ?? 'A1'
  const lesson = mistakeLesson(type)

  // Topic deep link is resolved lazily on first open (one cheap DB read).
  useEffect(() => {
    if (!open || topic !== undefined) return
    let alive = true
    void getAllTopics().then((topics) => {
      if (alive) setTopic(findTopicForMistake(type, topics))
    })
    return () => {
      alive = false
    }
  }, [open, topic, type])

  // Esc collapses (same pattern as MobileNav's More sheet).
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function explain(): Promise<void> {
    if (!deps || aiBusy) return
    setAiBusy(true)
    setAiError(null)
    try {
      setAiText(await explainMistake(deps, { said, corrected, type: normalizeCategory(type), cefr: level }))
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI call failed')
    } finally {
      setAiBusy(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-label="Explain this correction"
        onClick={() => setOpen((v) => !v)}
        className={
          variant === 'pill'
            ? 'w-full rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 transition-colors hover:border-red-300'
            : 'w-full text-left'
        }
      >
        {children}
      </button>

      {open && (
        <div className="mt-1 rounded-lg border border-slate-200 bg-surface p-3 text-left text-xs text-slate-600">
          <p className="text-sm font-semibold text-slate-800">{lesson.title}</p>
          <p className="mt-1 leading-relaxed">{lesson.rule}</p>
          <ul className="mt-2 space-y-1">
            {lesson.examples.map((ex) => (
              <li key={ex.bad}>
                <span className="text-red-700 line-through">{ex.bad}</span> →{' '}
                <span className="font-medium text-emerald-700">{ex.good}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 italic text-slate-500">💡 {lesson.tip}</p>

          {topic && (
            <p className="mt-2">
              <Link to={`/grammar/${topic.id}`} className="font-medium text-indigo-700 hover:underline">
                → Review the topic: {topic.title}
              </Link>
            </p>
          )}

          <div className="mt-3 border-t border-slate-100 pt-2">
            {deps ? (
              aiText ? (
                <MiniMarkdown md={aiText} className="leading-relaxed" />
              ) : (
                <div>
                  <Button disabled={aiBusy} onClick={() => void explain()}>
                    {aiBusy ? 'Explaining…' : 'Explain this ✨'}
                  </Button>
                  {aiError && <p className="mt-2 text-red-600">{aiError}</p>}
                </div>
              )
            ) : (
              <p className="text-slate-400">Add an AI key in Settings for an explanation of this exact sentence.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
