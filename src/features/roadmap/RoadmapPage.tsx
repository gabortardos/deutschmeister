import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card } from '../../components/ui'
import type { LearnerGoal } from '../../db/types'
import { PATH_LEVELS, curriculumStats, projectEta, toPathLevel, type PathLevel, type UnitProgress } from '../../engine/curriculum'
import { useAppStore } from '../../state/store'
import { GOAL_MOTIVATIONS, type GoalDraft } from '../onboarding/welcome'
import { GoalFields } from './GoalFields'
import { useCurriculum, type CurriculumSnapshot } from './useCurriculum'

/**
 * M15 `#/roadmap` — the visible investment→achievement path: goal → ETA
 * projection → vertical path of level bands with completed/current/locked
 * units. Everything derives live from the curriculum engine (offline,
 * deterministic); nothing is persisted per unit.
 */
export default function RoadmapPage() {
  const { hydrated, profile, patchProfile } = useAppStore()
  const { loading, snapshot } = useCurriculum()
  const [editing, setEditing] = useState(false)

  if (!hydrated || !profile) {
    return <p className="text-sm text-slate-500">Loading your data…</p>
  }

  const goal = profile.goal ?? null
  const target = toPathLevel(goal?.targetLevel ?? profile.level)

  return (
    <div className="space-y-6">
      <Card
        title="🗺️ Your roadmap"
        description="A guided path from where you are to where you want to be — built from your placement, mastery and vocabulary."
      >
        {goal && !editing ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-700">
              {GOAL_MOTIVATIONS.find((m) => m.id === goal.motivation)?.emoji}{' '}
              {GOAL_MOTIVATIONS.find((m) => m.id === goal.motivation)?.label} →{' '}
              <span className="font-semibold text-indigo-700">{goal.targetLevel}</span> ·{' '}
              {goal.horizonWeeks === 104 ? '2 years' : `${goal.horizonWeeks} weeks`} ·{' '}
              {goal.minutesPerDay} min/day
            </p>
            <Button variant="ghost" onClick={() => setEditing(true)}>
              Edit goal
            </Button>
          </div>
        ) : (
          <GoalEditor
            initial={goal}
            onSave={async (g) => {
              await patchProfile({ goal: g })
              setEditing(false)
            }}
            onCancel={goal ? () => setEditing(false) : null}
          />
        )}
      </Card>

      {goal && snapshot && <EtaPanel target={target} />}

      <Card
        title="The path"
        description="Units unlock in order; the Grammar page stays open for free exploration at any time."
      >
        {loading || !snapshot ? (
          <p className="text-sm text-slate-500">Mapping your path…</p>
        ) : (
          <div className="space-y-8">
            {PATH_LEVELS.map((level) => (
              <LevelBand key={level} level={level} snapshot={snapshot} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ goal */

function GoalEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: LearnerGoal | null
  onSave: (goal: LearnerGoal) => Promise<void>
  onCancel: (() => void) | null
}) {
  const [draft, setDraft] = useState<GoalDraft>(
    initial ?? { motivation: null, targetLevel: 'B1', horizonWeeks: 52, minutesPerDay: 15 },
  )
  const [busy, setBusy] = useState(false)
  const motivation = draft.motivation

  return (
    <div className="grid gap-4">
      {!initial && (
        <p className="text-sm text-slate-600">
          Set your destination first — the ETA projection below is computed from it.
        </p>
      )}
      <GoalFields draft={draft} onChange={setDraft} />
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          variant="primary"
          disabled={busy || motivation === null}
          onClick={() => {
            if (motivation === null) return
            setBusy(true)
            void onSave({
              motivation,
              targetLevel: draft.targetLevel,
              horizonWeeks: draft.horizonWeeks,
              minutesPerDay: draft.minutesPerDay,
            }).finally(() => setBusy(false))
          }}
        >
          {initial ? 'Save goal' : 'Set my goal →'}
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ ETA */

function EtaPanel({ target }: { target: PathLevel }) {
  const profile = useAppStore((s) => s.profile)
  const { snapshot } = useCurriculum()
  if (!profile || !snapshot) return null

  const stats = curriculumStats(snapshot.curriculum, snapshot.progress, target, snapshot.ctx)
  const eta = projectEta({
    wordsLeft: stats.wordsLeft,
    topicsLeft: stats.topicsLeft,
    dailyWordGoal: profile.dailyWordGoal,
  })
  const pct = stats.unitsTotal === 0 ? 0 : Math.round((stats.unitsDone / stats.unitsTotal) * 100)
  const horizonWeeks = profile.goal?.horizonWeeks ?? 52
  const slackDays = horizonWeeks * 7 - eta.days

  return (
    <Card
      title={`Projection → ${target}`}
      description={`Assuming ${profile.dailyWordGoal} new words per day and one grammar topic riding along.`}
    >
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              {stats.unitsDone} / {stats.unitsTotal} units done
            </span>
            <span className="font-semibold text-indigo-700">{pct}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <p className="text-sm text-slate-700">
          Left to {target}: <span className="font-semibold">{stats.wordsLeft}</span> words ·{' '}
          <span className="font-semibold">{stats.topicsLeft}</span> grammar topics — at your pace
          that is about <span className="font-semibold">{eta.days}</span> days, arriving around{' '}
          <span className="font-semibold text-indigo-700">
            {eta.arriveBy.toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          .
        </p>
        {stats.wordsLeft + stats.topicsLeft > 0 && (
          <p className={`text-xs ${slackDays >= 0 ? 'text-emerald-700' : 'text-amber-600'}`}>
            {slackDays >= 0
              ? `✅ Fits your ${horizonWeeks === 104 ? '2-year' : `${horizonWeeks}-week`} horizon with ~${Math.max(1, Math.round(slackDays / 7))} weeks to spare.`
              : `⚠️ About ${Math.round(-slackDays / 7)} weeks over your horizon — a bigger daily goal closes the gap.`}
          </p>
        )}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ path */

function LevelBand({ level, snapshot }: { level: PathLevel; snapshot: CurriculumSnapshot }) {
  const units = snapshot.progress.filter((p) => p.unit.level === level)
  const done = units.filter((p) => p.status === 'done').length
  const isCurrent = units.some((p) => p.status === 'current')
  const reached = units[0]?.placedOver === true || done > 0 || isCurrent

  return (
    <section aria-label={`${level} band`}>
      <div className="mb-3 flex items-center gap-2">
        <h3 className={`text-sm font-bold ${reached ? 'text-slate-900' : 'text-slate-400'}`}>
          {level}
        </h3>
        <span className="text-xs text-slate-400">
          {done}/{units.length} units
        </span>
        {isCurrent && (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            you are here
          </span>
        )}
      </div>
      <ol className="space-y-2 border-l-2 border-slate-100 pl-4">
        {units.map((p) => (
          <li key={p.unit.id} className="relative">
            <span
              aria-hidden
              className={`absolute -left-[1.4rem] top-4 h-3 w-3 rounded-full border-2 ${
                p.status === 'done'
                  ? 'border-emerald-500 bg-emerald-500'
                  : p.status === 'current'
                    ? 'border-indigo-600 bg-surface'
                    : 'border-slate-200 bg-surface'
              }`}
            />
            <UnitCard p={p} snapshot={snapshot} />
          </li>
        ))}
      </ol>
    </section>
  )
}

function UnitCard({ p, snapshot }: { p: UnitProgress; snapshot: CurriculumSnapshot }) {
  const { unit } = p
  const locked = p.status === 'locked'
  const firstTopicId = unit.topicIds[0] ?? null
  const scenario = unit.scenarioId != null ? snapshot.scenariosById.get(unit.scenarioId) : undefined

  return (
    <div
      className={`rounded-xl border p-3 ${
        p.status === 'current'
          ? 'border-indigo-300 bg-indigo-50/50'
          : locked
            ? 'border-slate-100 bg-surface opacity-70'
            : 'border-slate-200 bg-surface'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-sm font-semibold ${locked ? 'text-slate-400' : 'text-slate-800'}`}>
          {p.status === 'done' ? '✓' : locked ? '🔒' : '▶'} {unit.index}. {unit.title}
          {p.placedOver && (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              placed
            </span>
          )}
        </p>
        {unit.kind === 'milestone' ? (
          p.status === 'done' ? (
            <span className="text-xs font-medium text-emerald-700">passed 🎉</span>
          ) : locked ? null : (
            <Link to="/grammar/placement">
              <Button variant="primary">Take the level check →</Button>
            </Link>
          )
        ) : firstTopicId != null && !locked ? (
          <Link to={`/grammar/${firstTopicId}`}>
            <Button variant={p.status === 'current' ? 'primary' : 'secondary'}>
              {p.status === 'current' ? 'Continue unit →' : 'Review →'}
            </Button>
          </Link>
        ) : null}
      </div>
      {unit.kind === 'milestone' ? (
        <p className="mt-1 text-xs text-slate-500">
          Retake the adaptive placement and land above {unit.level} — or master every {unit.level}{' '}
          topic. Covers {unit.topicIds.length} topics.
        </p>
      ) : (
        <>
          <ul className="mt-1.5 space-y-0.5">
            {unit.topicIds.map((id) => {
              const t = snapshot.topicsById.get(id)
              const mastered = snapshot.ctx.masteredTopicIds.has(id)
              return (
                <li key={id} className={`text-xs ${locked ? 'text-slate-400' : 'text-slate-600'}`}>
                  {mastered ? '✅' : '◻️'} {t?.title ?? id}
                </li>
              )
            })}
          </ul>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {unit.vocabTheme != null && p.wordsTotal > 0 && (
              <span>
                🗂 {unit.vocabTheme}: {p.wordsIntroduced}/{p.wordsTotal} words
              </span>
            )}
            {scenario && !locked && (
              <Link
                to={`/conversation/${scenario.id}`}
                className="text-indigo-600 hover:underline"
              >
                💬 {scenario.emoji} {scenario.title}
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}


