import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui'
import { recentSessions } from '../../db/repositories/conversationRepo'
import { curriculumStats, projectEta, toPathLevel } from '../../engine/curriculum'
import { useAppStore } from '../../state/store'
import { useCurriculum } from '../roadmap/useCurriculum'

interface PlaylistStep {
  key: string
  icon: string
  label: string
  meta: string
  done: boolean
  to: string
  cta: string
}

/**
 * M15 guided session playlist — "Today" stops being a menu and becomes an
 * ordered session: reviews → new words → lesson+drills → conversation. The
 * first unfinished step is the primary action; every step keeps its deep link
 * so free-range learning stays one click away.
 */
export function TodayPlaylist({ introToday }: { introToday: number }) {
  const { profile, todayLog, dueCount } = useAppStore()
  const { snapshot } = useCurriculum()
  const [talkedToday, setTalkedToday] = useState(false)

  useEffect(() => {
    let cancelled = false
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    void recentSessions(8).then((list) => {
      if (!cancelled) setTalkedToday(list.some((s) => s.startedAt >= startOfDay.getTime()))
    })
    return () => {
      cancelled = true
    }
  }, [todayLog])

  if (!profile) return null

  const newTotal = todayLog?.newWordIds.length ?? 0
  const wordsLeft = newTotal - introToday
  const currentUnit = snapshot?.current ?? null
  const topicId = currentUnit?.unit.topicIds[0] ?? profile.currentGrammarTopicId ?? null
  const topic = topicId != null ? snapshot?.topicsById.get(topicId) : undefined
  const scenarioId = currentUnit?.unit.scenarioId ?? null
  const scenario = scenarioId != null ? snapshot?.scenariosById.get(scenarioId) : undefined
  const drillsToday = todayLog?.drillsDone ?? 0

  const steps: PlaylistStep[] = [
    {
      key: 'review',
      icon: '🔁',
      label: 'Review due cards',
      meta: dueCount === 0 ? 'nothing due' : `${dueCount} due`,
      done: dueCount === 0,
      to: '/review',
      cta: 'Review →',
    },
    {
      key: 'words',
      icon: '🆕',
      label: 'Learn today’s new words',
      meta: newTotal === 0 ? 'none planned' : `${introToday}/${newTotal} introduced`,
      done: wordsLeft <= 0,
      to: '/vocab',
      cta: 'Learn →',
    },
    {
      key: 'lesson',
      icon: '📖',
      label: topic ? `Lesson + drills: ${topic.title}` : 'Grammar lesson + drills',
      meta: drillsToday > 0 ? `${drillsToday} drills today` : 'current unit',
      done: drillsToday > 0,
      to: topicId != null ? `/grammar/${topicId}` : '/grammar',
      cta: 'Study →',
    },
    {
      key: 'talk',
      icon: '💬',
      label: scenario ? `Speak: ${scenario.emoji} ${scenario.title}` : 'Speak a scenario',
      meta: talkedToday ? 'practiced today' : 'suggested for your unit',
      done: talkedToday,
      to: scenarioId != null ? `/conversation/${scenarioId}` : '/conversation',
      cta: 'Speak →',
    },
  ]

  const primary = steps.find((s) => !s.done) ?? null

  return (
    <ol className="space-y-2">
      {steps.map((s) => (
        <li
          key={s.key}
          className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
            s.done
              ? 'border-emerald-100 bg-emerald-50/40'
              : primary?.key === s.key
                ? 'border-indigo-300 bg-indigo-50/50'
                : 'border-slate-200 bg-surface'
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-lg leading-none" aria-hidden>
              {s.done ? '✅' : s.icon}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{s.label}</p>
              <p className="text-xs text-slate-500">{s.meta}</p>
            </div>
          </div>
          {s.done ? (
            <span className="text-xs font-medium text-emerald-700">done</span>
          ) : (
            <Link to={s.to}>
              <Button variant={primary?.key === s.key ? 'primary' : 'secondary'}>{s.cta}</Button>
            </Link>
          )}
        </li>
      ))}
    </ol>
  )
}

/**
 * Mini version of the roadmap for the Dashboard header: position + ETA at a
 * glance, or a prompt to set the goal in the first place.
 */
export function RoadmapStrip() {
  const { profile } = useAppStore()
  const { snapshot } = useCurriculum()
  if (!profile) return null

  if (!profile.goal || !snapshot) {
    return (
      <p className="text-sm text-slate-600">
        🗺️{' '}
        <Link to="/roadmap" className="font-medium text-indigo-700 underline">
          Set your German goal
        </Link>{' '}
        — and see the whole road to it.
      </p>
    )
  }

  const target = toPathLevel(profile.goal.targetLevel)
  const stats = curriculumStats(snapshot.curriculum, snapshot.progress, target, snapshot.ctx)
  const eta = projectEta({
    wordsLeft: stats.wordsLeft,
    topicsLeft: stats.topicsLeft,
    dailyWordGoal: profile.dailyWordGoal,
  })
  const reached = stats.wordsLeft + stats.topicsLeft === 0
  const nextUnit = Math.min(stats.unitsDone + 1, stats.unitsTotal)

  return (
    <p className="text-sm text-slate-600">
      🗺️ Roadmap: unit {nextUnit} of {stats.unitsTotal} →{' '}
      <span className="font-semibold text-indigo-700">{target}</span>
      {reached
        ? ' · destination reached 🎉'
        : ` · around ${eta.arriveBy.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`}{' '}
      <Link to="/roadmap" className="font-medium text-indigo-700 underline">
        open →
      </Link>
    </p>
  )
}

