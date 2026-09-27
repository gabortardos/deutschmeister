import { useEffect, useState } from 'react'
import { Card } from '../../components/ui'
import { activityDays, cardDueDates } from '../../db/repositories/statsRepo'
import { vocabStats } from '../../db/repositories/vocabRepo'
import { HEATMAP_DAYS, computeProgressStats, type ProgressStats } from '../../engine/progressStats'

const HEAT_LEVEL_CLASS = [
  'bg-slate-200',
  'bg-indigo-200',
  'bg-indigo-400',
  'bg-indigo-600',
  'bg-indigo-800',
] as const

/** Parses a YYYY-MM-DD key into a local Date (never `new Date(string)` — UTC drift). */
function parseDateKey(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function weekdayLabel(date: string): string {
  return parseDateKey(date).toLocaleDateString(undefined, { weekday: 'narrow' })
}

/** Monday = 0 … Sunday = 6, for heatmap row alignment. */
function weekdayIndex(date: string): number {
  return (parseDateKey(date).getDay() + 6) % 7
}

function ProgressRing({ stats }: { stats: ProgressStats }) {
  const { ring } = stats
  const share = ring.matureShare ?? 0
  const R = 52
  const C = 2 * Math.PI * R
  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        viewBox="0 0 120 120"
        className="h-32 w-32"
        role="img"
        aria-label={`${Math.round(share * 100)} percent of introduced words are mature`}
      >
        <circle cx="60" cy="60" r={R} fill="none" strokeWidth="10" className="stroke-slate-200" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-indigo-600"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - share)}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="57" textAnchor="middle" className="fill-slate-900 text-xl font-bold">
          {Math.round(share * 100)}%
        </text>
        <text x="60" y="74" textAnchor="middle" className="fill-slate-400 text-[10px]">
          mature
        </text>
      </svg>
      <p className="mt-2 text-center text-xs text-slate-500">
        {ring.matureShare == null
          ? 'Introduce your first words to start the ring.'
          : `${ring.review} of ${ring.introduced} introduced words are long-term memories`}
      </p>
      {ring.coverage != null && (
        <p className="mt-1 text-center text-xs text-slate-400">
          {Math.round(ring.coverage * 100)}% of the {ring.totalWords}-word bank explored
        </p>
      )}
    </div>
  )
}

function Heatmap({ stats }: { stats: ProgressStats }) {
  const pad = weekdayIndex(stats.heat[0].date)
  return (
    <div className="flex flex-col justify-center">
      <div
        className="grid grid-flow-col grid-rows-7 gap-1"
        role="img"
        aria-label={`Activity over the last ${HEATMAP_DAYS} days: ${stats.activeDays} active`}
      >
        {Array.from({ length: pad }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {stats.heat.map((cell) => (
          <div
            key={cell.date}
            title={`${cell.date}: ${cell.actions} ${cell.actions === 1 ? 'action' : 'actions'}`}
            className={`h-3 w-3 rounded-sm ${HEAT_LEVEL_CLASS[cell.level]}`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {stats.activeDays} active {stats.activeDays === 1 ? 'day' : 'days'} in the last {HEATMAP_DAYS / 7} weeks
      </p>
      {/* Streaks stay dormant (PHASE2 Dormant option #2): currentStreak is
          computed by the engine but intentionally not shown yet. */}
    </div>
  )
}

function Forecast({ stats }: { stats: ProgressStats }) {
  const max = Math.max(1, ...stats.forecast.map((d) => d.due))
  return (
    <div className="flex flex-col justify-center">
      <div className="flex h-24 items-end gap-2" role="img" aria-label={`Reviews due in the next 7 days: ${stats.forecastTotal}`}>
        {stats.forecast.map((d, i) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ${d.due} due`}>
            <span className="text-[10px] text-slate-400">{d.due > 0 ? d.due : ''}</span>
            <div
              className={`w-full rounded-t-sm ${i === 0 ? 'bg-indigo-600' : 'bg-indigo-300'}`}
              style={{ height: `${Math.max(d.due > 0 ? 4 : 2, Math.round((d.due / max) * 72))}px` }}
            />
            <span className={`text-[10px] ${i === 0 ? 'font-semibold text-slate-700' : 'text-slate-400'}`}>
              {weekdayLabel(d.date)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {stats.forecastTotal} {stats.forecastTotal === 1 ? 'review' : 'reviews'} due in the next 7 days
      </p>
    </div>
  )
}

/**
 * M10.1 dashboard stats zone: progress ring (mature share), 12-week activity
 * heatmap and a 7-day review forecast. Loads its own data on mount — the store
 * stays untouched. Renders nothing until data lands (no layout jump).
 */
export default function StatsZone() {
  const [stats, setStats] = useState<ProgressStats | null>(null)

  useEffect(() => {
    let live = true
    void (async () => {
      const [days, dueDates, vocab] = await Promise.all([activityDays(), cardDueDates(), vocabStats()])
      if (!live) return
      setStats(computeProgressStats({ days, dueDates, vocab }))
    })()
    return () => {
      live = false
    }
  }, [])

  if (!stats) return null

  return (
    <Card title="Your progress" description="Built from your own learning history — everything stays on this device.">
      <div className="grid gap-6 md:grid-cols-3">
        <ProgressRing stats={stats} />
        <Heatmap stats={stats} />
        <Forecast stats={stats} />
      </div>
    </Card>
  )
}