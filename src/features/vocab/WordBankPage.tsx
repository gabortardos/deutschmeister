import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, inputClass } from '../../components/ui'
import {
  getAllWords,
  getCards,
  introducedWords,
  reviewWord,
} from '../../db/repositories/vocabRepo'
import type { VocabCard, VocabWord } from '../../db/types'
import { useAppStore } from '../../state/store'
import { StudySession } from './StudySession'
import { ARTICLE_CLASS, WordFormsPanel } from './WordForms'

const PRACTICE_SIZE = 10

type SortKey = 'rank' | 'az' | 'due'

interface ActiveSession {
  title: string
  description: string
  words: VocabWord[]
}

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Umlaut-insensitive search folding (übung finds Übung). */
function fold(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
}

function dueLabel(dueDate: number, now: number): string {
  const diffDays = Math.round((dueDate - now) / 86_400_000)
  if (diffDays <= 0) return 'due now'
  if (diffDays === 1) return 'due tomorrow'
  return `due in ${diffDays} d`
}

export default function WordBankPage() {
  const { hydrated, bumpDrills, refreshToday } = useAppStore()
  const [learned, setLearned] = useState<VocabWord[] | null>(null)
  const [bank, setBank] = useState<VocabWord[]>([])
  const [cards, setCards] = useState<Map<string, VocabCard>>(new Map())
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState('all')
  const [cefr, setCefr] = useState('all')
  const [sort, setSort] = useState<SortKey>('rank')
  const [openId, setOpenId] = useState<string | null>(null)
  const [session, setSession] = useState<ActiveSession | null>(null)

  async function load(): Promise<void> {
    const words = await introducedWords()
    const [list, all] = await Promise.all([
      getCards(words.map((w) => w.id)),
      getAllWords(),
    ])
    setLearned(words)
    setCards(new Map(list.map((c) => [c.wordId, c])))
    setBank(all)
  }

  useEffect(() => {
    void load()
  }, [])

  const themes = useMemo(
    () => (learned ? [...new Set(learned.map((w) => w.theme))].sort((a, b) => a.localeCompare(b, 'de')) : []),
    [learned],
  )

  const filtered = useMemo(() => {
    if (!learned) return []
    const q = fold(query.trim())
    const matches = learned.filter((w) => {
      if (theme !== 'all' && w.theme !== theme) return false
      if (cefr !== 'all' && w.cefr !== cefr) return false
      return q.length === 0 || fold(`${w.german} ${w.english}`).includes(q)
    })
    const comparers: Record<SortKey, (a: VocabWord, b: VocabWord) => number> = {
      rank: (a, b) => a.frequencyRank - b.frequencyRank,
      az: (a, b) => a.german.localeCompare(b.german, 'de'),
      due: (a, b) =>
        (cards.get(a.id)?.dueDate ?? Number.MAX_SAFE_INTEGER) -
        (cards.get(b.id)?.dueDate ?? Number.MAX_SAFE_INTEGER),
    }
    return [...matches].sort(comparers[sort])
  }, [learned, query, theme, cefr, sort, cards])

  function startPractice(): void {
    const picked = shuffle(filtered).slice(0, PRACTICE_SIZE)
    const scope =
      theme === 'all' && cefr === 'all' && query.trim().length === 0 ? '' : ' (current filter)'
    setSession({
      title: `Practice — word bank${scope}`,
      description: `A recap of ${picked.length} word(s) from your learned words. Every answer updates your SRS schedule.`,
      words: picked,
    })
  }

  if (!hydrated || learned === null) {
    return <p className="text-sm text-slate-500">Loading your word bank…</p>
  }

  if (session) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-slate-900">{session.title}</h1>
        {session.words.length === 0 ? (
          <Card title="Nothing to practice 🎉">
            <p className="text-sm text-slate-600">
              This selection has no words. Adjust the filters and try again!
            </p>
            <div className="mt-4">
              <Button onClick={() => setSession(null)}>Back to word bank</Button>
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
              void load()
              void refreshToday()
            }}
          />
        )}
      </div>
    )
  }

  if (learned.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-slate-900">Word bank</h1>
        <Card title="No learned words yet">
          <p className="text-sm text-slate-600">
            Your word bank fills up as you study — every introduced word lands here with its forms,
            example sentence and SRS status.
          </p>
          <div className="mt-4">
            <Link to="/vocab">
              <Button variant="primary">Start your first study session →</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }
  const now = Date.now()
  const selectClass = 'rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700'

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">Word bank</h1>
      <Card
        title="Your learned words"
        description="Browse, search and practice everything you have introduced. Click a word for its forms and example."
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            className={`${inputClass} max-w-xs flex-1`}
            placeholder="Search German or English…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <select className={selectClass} value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="all">All themes</option>
            {themes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select className={selectClass} value={cefr} onChange={(e) => setCefr(e.target.value)}>
            <option value="all">All levels</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
          </select>
          <select
            className={selectClass}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="rank">Sort: frequency</option>
            <option value="az">Sort: A–Z</option>
            <option value="due">Sort: next review</option>
          </select>
          <Button variant="primary" disabled={filtered.length === 0} onClick={startPractice}>
            🔁 Practice these words
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Showing {filtered.length} of {learned.length} learned word(s)
          {filtered.length > PRACTICE_SIZE ? ` — practice picks ${PRACTICE_SIZE} at random` : ''}.
        </p>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">No words match your search or filters.</p>
        </Card>
      ) : (
        <Card className="!p-0">
          <ul>
            {filtered.map((w) => {
              const card = cards.get(w.id)
              const open = openId === w.id
              return (
                <li key={w.id} className="border-b border-slate-100 last:border-0">
                  <button
                    type="button"
                    className="flex w-full items-baseline gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                    onClick={() => setOpenId(open ? null : w.id)}
                  >
                    <span className="w-52 shrink-0 truncate">
                      {w.article && (
                        <span className={`mr-1 ${ARTICLE_CLASS[w.article]}`}>{w.article}</span>
                      )}
                      <span className="font-semibold text-slate-800">{w.german}</span>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{w.english}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                        {w.cefr}
                      </span>
                      {card && card.state === 'review' && <Badge tone="ok">mature</Badge>}
                      {card && card.state === 'learning' && <Badge tone="warn">learning</Badge>}
                      {card && card.dueDate <= now && (
                        <Badge tone="bad">{dueLabel(card.dueDate, now)}</Badge>
                      )}
                      <span className="text-xs text-slate-300">{open ? '▾' : '▸'}</span>
                    </span>
                  </button>
                  {open && (
                    <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                      {w.exampleSentenceDe && (
                        <div>
                          <p className="text-sm italic text-slate-700">{w.exampleSentenceDe}</p>
                          {w.exampleSentenceEn && (
                            <p className="text-sm italic text-slate-400">{w.exampleSentenceEn}</p>
                          )}
                        </div>
                      )}
                      <WordFormsPanel word={w} />
                      <p className="text-xs text-slate-400">
                        Theme: {w.theme} · Introduced{' '}
                        {new Date(card?.introducedDate ?? w.updatedAt).toLocaleDateString()}
                        {card &&
                          card.dueDate > now &&
                          ` · Next review: ${new Date(card.dueDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
