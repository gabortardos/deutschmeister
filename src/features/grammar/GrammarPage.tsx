import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card } from '../../components/ui'
import { getAllTopics, masteryByTopic, nextTopic } from '../../db/repositories/grammarRepo'
import type { GrammarTopic } from '../../db/types'
import { masteryPercent } from '../../engine/mastery'
import type { MasteryInfo } from '../../engine/mastery'
import { useAppStore } from '../../state/store'

const LEVELS = ['A1', 'A2', 'B1'] as const

export default function GrammarPage() {
  const { hydrated, profile } = useAppStore()
  const [topics, setTopics] = useState<GrammarTopic[] | null>(null)
  const [mastery, setMastery] = useState<Map<string, MasteryInfo> | null>(null)
  const [upNext, setUpNext] = useState<GrammarTopic | null>(null)

  useEffect(() => {
    void (async () => {
      const [all, m] = await Promise.all([getAllTopics(), masteryByTopic()])
      setTopics(all)
      setMastery(m)
    })()
  }, [])

  useEffect(() => {
    if (profile && topics) void nextTopic(profile.level).then(setUpNext)
  }, [profile, topics])

  if (!hydrated || !profile) {
    return <p className="text-sm text-slate-500">Loading your data…</p>
  }
  if (!topics || !mastery) {
    return <p className="text-sm text-slate-500">Loading the grammar syllabus…</p>
  }

  return (
    <div className="space-y-6">
      {!profile.placementResult ? (
        <Card title="New here?" description="Find your starting level in ~5 minutes.">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-600">
              Take the adaptive placement quiz — 10–20 questions, vocabulary and grammar, skippable at any time.
            </p>
            <Link to="/grammar/placement">
              <Button variant="primary">Take the placement quiz →</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card title={`Your level: ${profile.level}`} description={`Placed ${new Date(profile.placementResult.takenAt).toLocaleDateString()}.`}>
          <div className="flex flex-wrap gap-2">
            {upNext && (
              <Link to={`/grammar/${upNext.id}`}>
                <Button variant="primary">Continue: {upNext.title} →</Button>
              </Link>
            )}
            <Link to="/grammar/placement">
              <Button>Retake placement</Button>
            </Link>
          </div>
        </Card>
      )}

      {LEVELS.map((level) => {
        const levelTopics = topics.filter((t) => t.cefr === level)
        if (levelTopics.length === 0) return null
        const masteredCount = levelTopics.filter((t) => mastery.get(t.id)?.mastered).length
        return (
          <Card key={level} title={`Level ${level}`} description={`${masteredCount} / ${levelTopics.length} topics mastered`}>
            <ul className="divide-y divide-slate-100">
              {levelTopics.map((t) => {
                const m = mastery.get(t.id)
                return (
                  <li key={t.id}>
                    <Link to={`/grammar/${t.id}`} className="flex items-center gap-3 py-2.5 group">
                      <span className="text-sm font-medium text-slate-800 group-hover:text-indigo-700">{t.title}</span>
                      <span className="hidden truncate text-xs text-slate-400 sm:inline">{t.focus}</span>
                      <span className="ml-auto flex items-center gap-2">
                        {m && m.attempts > 0 && (
                          <span className="text-xs text-slate-400">
                            {masteryPercent(m)}% · {m.attempts} attempts
                          </span>
                        )}
                        {m?.mastered ? <Badge tone="ok">mastered ✓</Badge> : null}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Card>
        )
      })}
    </div>
  )
}
