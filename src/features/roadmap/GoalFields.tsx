import type { GoalDraft } from '../onboarding/welcome'
import { GOAL_MOTIVATIONS, HORIZON_OPTIONS, MINUTES_OPTIONS, WELCOME_LEVELS } from '../onboarding/welcome'

/**
 * M15 goal interview fields — shared by the welcome-flow step and the roadmap's
 * inline editor so the two can never drift apart. Pure presentational: the
 * parent owns the draft (welcome.ts owns validation).
 */
export function GoalFields({
  draft,
  onChange,
}: {
  draft: GoalDraft
  onChange: (next: GoalDraft) => void
}) {
  const chip = (selected: boolean): string =>
    `rounded-lg border px-3 py-2 text-sm transition-colors ${
      selected
        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
        : 'border-slate-300 bg-surface text-slate-700 hover:bg-slate-50'
    }`

  return (
    <div className="grid gap-4">
      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700">What is German for?</p>
        <div className="flex flex-wrap gap-2">
          {GOAL_MOTIVATIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={chip(draft.motivation === m.id)}
              onClick={() => onChange({ ...draft, motivation: m.id })}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700">Target level</p>
        <div className="flex flex-wrap gap-2">
          {WELCOME_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              className={chip(draft.targetLevel === l)}
              onClick={() => onChange({ ...draft, targetLevel: l })}
            >
              {l}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          B1 is the classic “real life in German” goal — everyday conversations, work basics,
          most exams.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Time horizon</p>
          <div className="flex flex-wrap gap-2">
            {HORIZON_OPTIONS.map((h) => (
              <button
                key={h}
                type="button"
                className={chip(draft.horizonWeeks === h)}
                onClick={() => onChange({ ...draft, horizonWeeks: h })}
              >
                {h === 104 ? '2 years' : `${h} weeks`}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Minutes per day</p>
          <div className="flex flex-wrap gap-2">
            {MINUTES_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                className={chip(draft.minutesPerDay === m)}
                onClick={() => onChange({ ...draft, minutesPerDay: m })}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
