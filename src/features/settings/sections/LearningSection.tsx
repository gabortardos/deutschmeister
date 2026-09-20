import { Button, Card, Field, inputClass } from '../../../app/ui'
import { CEFR_LEVELS, type CefrLevel } from '../../../db/types'
import { useAppStore } from '../../../state/store'

export default function LearningSection() {
  const profile = useAppStore((s) => s.profile)
  const patchProfile = useAppStore((s) => s.patchProfile)

  if (!profile) return null

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

        <Field label="Level" hint="Placement quiz arrives in M2.">
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

      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled title="Arrives in Milestone 2">
          Re-run placement quiz (M2)
        </Button>
        <Button disabled title="Arrives in Milestone 1">
          Regenerate today&apos;s lesson (M1)
        </Button>
      </div>
    </Card>
  )
}
