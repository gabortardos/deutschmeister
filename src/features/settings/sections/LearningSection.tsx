import { Link } from 'react-router-dom'
import { Badge, Button, Card, Field, inputClass } from '../../../components/ui'
import { CEFR_LEVELS, type CefrLevel } from '../../../db/types'
import { useAppStore } from '../../../state/store'

export default function LearningSection() {
  const profile = useAppStore((s) => s.profile)
  const settings = useAppStore((s) => s.settings)
  const patchProfile = useAppStore((s) => s.patchProfile)

  if (!profile) return null

  // M12.9: read-only mirror of the word focus — the full picker lives on the
  // Vocab page (levels × themes chips with live counts).
  const scope = settings?.vocabScope ?? null
  const scopeSummary =
    !scope || (scope.levels.length === 0 && scope.themes.length === 0)
      ? 'All words'
      : [
          scope.levels.length > 0 ? `levels ${scope.levels.join(' · ')}` : null,
          scope.themes.length > 0 ? `themes ${scope.themes.join(' · ')}` : null,
        ]
          .filter(Boolean)
          .join(' + ')

  return (
    <Card title="Learning" description="Your daily rhythm and starting level.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Your name">
          <input
            className={inputClass}
            value={profile.name}
            onChange={(e) => void patchProfile({ name: e.target.value })}
          />
        </Field>

        <Field label="Level" hint="Set manually or via the placement quiz.">
          <select
            className={inputClass}
            value={profile.level}
            onChange={(e) => void patchProfile({ level: e.target.value as CefrLevel })}
          >
            {CEFR_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Daily word goal" hint="New words per day (1–10).">
          <input
            className={inputClass}
            type="number"
            min={1}
            max={10}
            value={profile.dailyWordGoal}
            onChange={(e) => {
              const parsed = Number(e.target.value)
              const clamped = Math.min(10, Math.max(1, Number.isFinite(parsed) ? parsed : 5))
              void patchProfile({ dailyWordGoal: clamped })
            }}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Word focus" hint="Which slice of the corpus new words come from.">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={scopeSummary === 'All words' ? 'ok' : 'warn'}>
              {scopeSummary === 'All words' ? '🎯 All words' : `🎯 ${scopeSummary}`}
            </Badge>
            <Link to="/vocab">
              <Button>Change on the Vocab page →</Button>
            </Link>
          </div>
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/grammar/placement">
          <Button>Re-run placement quiz</Button>
        </Link>
        <Button disabled title="Arrives in a later milestone">
          Regenerate today&apos;s lesson
        </Button>
      </div>
    </Card>
  )
}
