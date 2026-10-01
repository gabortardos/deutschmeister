import { useEffect, useMemo, useState } from 'react'
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
import { CEFR_LEVELS, type CefrLevel, type VocabScope, type VocabWord } from '../../db/types'
import { clozeItems, type ClozeItem } from '../../engine/clozeReviews'
import { applyVocabScope, toggleScopeValue, vocabScopeIsEmpty } from '../../engine/vocabScope'
import { useAppStore } from '../../state/store'
import { ClozeSession } from './ClozeSession'
import { StudySession } from './StudySession'

/** A practice session recaps a random slice of the learned bank. */
const PRACTICE_SIZE = 10
/** Sentences per cloze review (M11.6). */
const CLOZE_SIZE = 8
const EXTRA_CHOICES = [5, 10, 15, 20] as const

/** M12.9: shared chip styling for the word-focus picker. */
function scopeChipClass(active: boolean): string {
  return `rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
    active
      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
      : 'border-slate-200 bg-surface text-slate-500 hover:border-slate-300 hover:text-slate-700'
  }`
}

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

interface ActiveSession {
  kind: 'study' | 'cloze'
  title: string
  description: string
  words: VocabWord[]
  /** Cloze items when kind === 'cloze' (built from `words` + the bank at start). */
  cloze?: ClozeItem[]
}

export default function VocabPage() {
  const { hydrated, profile, todayLog, stats, settings, refreshToday, bumpDrills, patchSettings } = useAppStore()
  const [bank, setBank] = useState<VocabWord[]>([])
  const [learned, setLearned] = useState<VocabWord[]>([])
  const [session, setSession] = useState<ActiveSession | null>(null)
  const [introToday, setIntroToday] = useState(0)
  const [extraCount, setExtraCount] = useState<number>(10)

  useEffect(() => {
    void refreshToday()
    void getAllWords().then(setBank)
  }, [refreshToday])

  // M12.9: learned words for the scope-aware unseen count; reloaded whenever
  // stats change, so finishing a session updates "left in focus" immediately.
  useEffect(() => {
    void introducedWords().then(setLearned)
  }, [stats])

  useEffect(() => {
    if (!todayLog || todayLog.newWordIds.length === 0) {
      setIntroToday(0)
      return
    }
    void getCards(todayLog.newWordIds).then((cards) => setIntroToday(cards.length))
  }, [todayLog])

  // M12.9 word focus: which slice of the corpus new words are drawn from.
  const scope = settings?.vocabScope ?? null
  const scopeActive = !vocabScopeIsEmpty(scope)
  const scopedCount = applyVocabScope(bank, scope).length
  const scopeLevels = useMemo(() => {
    const present = new Set(bank.map((w) => w.cefr))
    return CEFR_LEVELS.filter((level) => present.has(level))
  }, [bank])
  const themeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const w of bank) counts.set(w.theme, (counts.get(w.theme) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], 'de'))
  }, [bank])

  function updateScope(next: VocabScope): void {
    void patchSettings({ vocabScope: vocabScopeIsEmpty(next) ? null : next })
  }

  async function startSession(): Promise<void> {
    if (!todayLog) return
    const [planWords, cards] = await Promise.all([
      getWords(todayLog.newWordIds),
      getCards(todayLog.newWordIds),
    ])
    const done = new Set(cards.map((c) => c.wordId))
    setSession({
      kind: 'study',
      title: "Today's new words",
      description: 'Your daily goal from Settings, planned once per calendar day.',
      words: planWords.filter((w) => !done.has(w.id)),
    })
  }

  /** Anytime recap of already-learned words — every answer feeds SM-2. */
  async function startPractice(): Promise<void> {
    const words = shuffle(applyVocabScope(await introducedWords(), scope)).slice(0, PRACTICE_SIZE)
    setSession({
      kind: 'study',
      title: 'Practice — learned words',
      description: `A recap of ${words.length} word(s) you already know. Results update your SRS schedule.`,
      words,
    })
  }

  /** Learn more new words beyond the daily goal, as many as you like. */
  async function startExtra(): Promise<void> {
    const words = await nextUnseenWords(extraCount, scope)
    setSession({
      kind: 'study',
      title: `Extra new words (+${words.length})`,
      description: 'Beyond today’s goal — these words count as introduced right away.',
      words,
    })
  }

  /** M11.6: cloze review — fill the gap in example sentences of learned words. */
  async function startCloze(): Promise<void> {
    const words = shuffle(applyVocabScope(await introducedWords(), scope))
    const items = clozeItems(words, bank, CLOZE_SIZE)
    setSession({
      kind: 'cloze',
      title: 'Cloze review — fill the gap',
      description: 'Sentences from your learned words with one word missing — pick the right one.',
      words,
      cloze: items,
    })
  }

  if (!hydrated || !profile) {
    return <p className="text-sm text-slate-500">Loading your data…</p>
  }

  if (session) {
    const sessionEmpty = session.kind === 'study' ? session.words.length === 0 : (session.cloze?.length ?? 0) === 0
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-slate-900">{session.title}</h1>
        {sessionEmpty ? (
          <Card title="Nothing to study here 🎉">
            <p className="text-sm text-slate-600">This session has no words left. Back to the overview for more!</p>
            <div className="mt-4">
              <Button onClick={() => setSession(null)}>Back to overview</Button>
            </div>
          </Card>
        ) : session.kind === 'cloze' ? (
          <ClozeSession
            items={session.cloze ?? []}
            onWordReviewed={(wordId, quality) => reviewWord(wordId, quality)}
            onDrillDone={() => bumpDrills()}
            onFinish={() => {
              setSession(null)
              void refreshToday()
            }}
          />
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
  const unseenLeft = Math.max(0, scopedCount - applyVocabScope(learned, scope).length)

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
        title="Word focus"
        description="Choose which slice of the corpus new words come from — CEFR levels and themes. Vocab batches ship as themes, so the theme chips double as the batch picker."
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Levels</span>
          {scopeLevels.map((level) => {
            const active = scope?.levels.includes(level) ?? false
            return (
              <button
                key={level}
                type="button"
                className={scopeChipClass(active)}
                onClick={() =>
                  updateScope({
                    levels: toggleScopeValue(scope?.levels ?? [], level) as CefrLevel[],
                    themes: scope?.themes ?? [],
                  })
                }
              >
                {level}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Themes</span>
          {themeCounts.map(([theme, count]) => {
            const active = scope?.themes.includes(theme) ?? false
            return (
              <button
                key={theme}
                type="button"
                className={scopeChipClass(active)}
                onClick={() =>
                  updateScope({
                    levels: scope?.levels ?? [],
                    themes: toggleScopeValue(scope?.themes ?? [], theme),
                  })
                }
              >
                {theme} <span className="opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            {scopeActive
              ? `${scopedCount.toLocaleString('en-US')} of ${bank.length.toLocaleString('en-US')} words in focus — applies to today’s plan (immediately), extra words, practice and cloze. Learned words outside the focus still come up for review.`
              : `No focus — all ${bank.length.toLocaleString('en-US')} words are in play. Pick levels or themes to concentrate new words.`}
          </p>
          <Button disabled={!scopeActive} onClick={() => updateScope({ levels: [], themes: [] })}>
            Clear focus
          </Button>
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
          <Button disabled={introduced === 0} onClick={() => void startCloze()}>
            🧩 Cloze review
          </Button>
          <Link to="/practice">
            <Button disabled={introduced === 0}>🎧 Speak &amp; Listen</Button>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">➕ Learn</span>
            <select
              className="rounded-md border border-slate-300 bg-surface px-2 py-1.5 text-sm text-slate-700"
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
            : `${unseenLeft} unseen word(s) left ${scopeActive ? 'in your word focus' : 'in the corpus'}. Extra words count as introduced immediately — tomorrow's plan skips them.`}
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
          <div className="mt-4">
            <Link to="/words">
              <Button>Browse & practice learned words →</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}

