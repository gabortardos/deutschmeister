import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card } from '../../components/ui'
import {
  getAllWords,
  getCards,
  getWords,
  introducedWords,
  nextUnseenWords,
  reviewWord,
} from '../../db/repositories/vocabRepo'
import type { VocabWord } from '../../db/types'
import { useAppStore } from '../../state/store'
import { StudySession } from './StudySession'

/** A practice session recaps a random slice of the learned bank. */
const PRACTICE_SIZE = 10
const EXTRA_CHOICES = [5, 10, 15, 20] as const

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

interface ActiveSession {
  title: string
  description: string
  words: VocabWord[]
}

export default function VocabPage() {
  const { hydrated, profile, todayLog, stats, refreshToday, bumpDrills } = useAppStore()
  const [bank, setBank] = useState<VocabWord[]>([])
  const [session, setSession] = useState<ActiveSession | null>(null)
  const [introToday, setIntroToday] = useState(0)
  const [extraCount, setExtraCount] = useState<number>(10)

  useEffect(() => {
    void refreshToday()
    void getAllWords().then(setBank)
  }, [refreshToday])

  useEffect(() => {
    if (!todayLog || todayLog.newWordIds.length === 0) {
      setIntroToday(0)
      return
    }
    void getCards(todayLog.newWordIds).then((cards) => setIntroToday(cards.length))
  }, [todayLog])

  async function startSession(): Promise<void> {
    if (!todayLog) return
    const [planWords, cards] = await Promise.all([
      getWords(todayLog.newWordIds),
      getCards(todayLog.newWordIds),
    ])
    const done = new Set(cards.map((c) => c.wordId))
    setSession({
      title: "Today's new words",
      description: 'Your daily goal from Settings, planned once per calendar day.',
      words: planWords.filter((w) => !done.has(w.id)),
    })
  }

  /** Anytime recap of already-learned words — every answer feeds SM-2. */
  async function startPractice(): Promise<void> {
    const words = shuffle(await introducedWords()).slice(0, PRACTICE_SIZE)
    setSession({
      title: 'Practice — learned words',
      description: `A recap of ${words.length} word(s) you already know. Results update your SRS schedule.`,
      words,
    })
  }

  /** Learn more new words beyond the daily goal, as many as you like. */
  async function startExtra(): Promise<void> {
    const words = await nextUnseenWords(extraCount)
    setSession({
      title: `Extra new words (+${words.length})`,
      description: 'Beyond today’s goal — these words count as introduced right away.',
      words,
    })
  }

  if (!hydrated || !profile) {
    return <p className="text-sm text-slate-500">Loading your data…</p>
  }

  if (session) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-slate-900">{session.title}</h1>
        {session.words.length === 0 ? (
          <Card title="Nothing to study here 🎉">
            <p className="text-sm text-slate-600">This session has no words left. Back to the overview for more!</p>
            <div className="mt-4">
              <Button onClick={() => setSession(null)}>Back to overview</Button>
            </div>
          </Card>
        ) : (
          <StudySession
            words={session.words}
            bank={bank}
            onWordReviewed={(wordId, quality) => reviewWord(wordId, quality)}
            onDrillDone={() => bumpDrills()}
            onFinish={() => {
              setSession(null)
              void refreshToday()
            }}
          />
        )}
      </div>
    )
  }

  const goal = todayLog?.newWordIds.length ?? profile.dailyWordGoal
  const done = Math.min(introToday, goal)
  const pct = goal === 0 ? 100 : Math.round((done / goal) * 100)
  const introduced = stats?.introduced ?? 0
  const unseenLeft = stats ? Math.max(0, stats.totalWords - introduced) : 0

  return (
    <div className="space-y-6">
      <Card title="Today's lesson" description="Your daily goal from Settings, planned once per calendar day.">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">
            {done} / {goal} new words introduced
          </span>
          <span className="text-slate-400">{todayLog ? `drills done: ${todayLog.drillsDone}` : '…'}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" disabled={done >= goal} onClick={() => void startSession()}>
            {done >= goal ? 'Goal reached ✓' : 'Start studying →'}
          </Button>
          {stats && stats.dueNow > 0 && (
            <Link to="/review">
              <Button>Review {stats.dueNow} due</Button>
            </Link>
          )}
        </div>
      </Card>

      <Card
        title="Want more?"
        description="Practice your learned words any time, or keep learning new words beyond today's goal."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={introduced === 0} onClick={() => void startPractice()}>
            🔁 Practice {introduced === 0 ? 'learned words' : `${Math.min(PRACTICE_SIZE, introduced)} learned words`}
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">➕ Learn</span>
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
              value={extraCount}
              onChange={(e) => setExtraCount(Number(e.target.value))}
            >
              {EXTRA_CHOICES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-sm text-slate-500">new words</span>
            <Button variant="primary" disabled={unseenLeft === 0} onClick={() => void startExtra()}>
              Start extra session →
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {introduced === 0
            ? 'Practice unlocks after your first study session.'
            : `${unseenLeft} unseen word(s) left in the corpus. Extra words count as introduced immediately — tomorrow's plan skips them.`}
        </p>
      </Card>

      {stats && (
        <Card title="Your word bank" description="Seeded corpus plus your custom words, tracked by SM-2.">
          <div className="flex flex-wrap gap-2">
            <Badge tone="ok">{stats.introduced} introduced</Badge>
            <Badge tone="warn">{stats.learning} learning</Badge>
            <Badge tone="ok">{stats.review} mature</Badge>
            <Badge tone="bad">{stats.dueNow} due now</Badge>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Total words available: <span className="font-semibold text-slate-700">{stats.totalWords}</span> (1,000+ A1–B1
            seed corpus + your custom words). Review direction alternates; typing accepts ae/oe/ue/ss for umlauts.
          </p>
        </Card>
      )}
    </div>
  )
}

