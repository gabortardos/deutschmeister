import { useMemo, useRef, useState } from 'react'
import { Badge, Button, Card, inputClass } from '../../components/ui'
import type { VocabWord } from '../../db/types'
import { gradeAnswer } from '../../engine/grader'
import { tts } from '../../speech/tts'

export interface StudySessionProps {
  words: VocabWord[]
  bank: VocabWord[]
  onWordReviewed: (wordId: string, quality: number) => Promise<unknown>
  onDrillDone: () => Promise<unknown>
  onFinish: () => void
}

type Phase = 'intro' | 'choice' | 'type'

const ARTICLE_CLASS: Record<string, string> = {
  der: 'text-sky-600',
  die: 'text-rose-600',
  das: 'text-emerald-600',
}

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** The word plus 3 distractors (same theme preferred), shuffled. */
function choiceOptions(word: VocabWord, bank: VocabWord[]): VocabWord[] {
  const others = bank.filter((w) => w.id !== word.id)
  const sameTheme = shuffle(others.filter((w) => w.theme === word.theme))
  const rest = shuffle(others.filter((w) => w.theme !== word.theme))
  return shuffle([word, ...[...sameTheme, ...rest].slice(0, 3)])
}

/**
 * Teaches today's new words in three steps each: flashcard (DE→EN reveal),
 * multiple choice (DE→EN), typing (EN→DE, umlaut-tolerant). The final typing
 * result feeds SM-2: correct → quality 4, wrong → quality 2 (relearn tomorrow).
 */
export function StudySession({ words, bank, onWordReviewed, onDrillDone, onFinish }: StudySessionProps) {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('intro')
  const [revealed, setRevealed] = useState(false)
  const [choicePick, setChoicePick] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [typeResult, setTypeResult] = useState<{ correct: boolean; matched: string | null } | null>(null)
  const [score, setScore] = useState({ introduced: 0, correct: 0, wrong: 0 })
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const word = words[index]
  const options = useMemo(() => (word ? choiceOptions(word, bank) : []), [word, bank])

  function speakWord(): void {
    if (word) tts.speak(word.german)
  }

  function speakExample(): void {
    if (word?.exampleSentenceDe) tts.speak(word.exampleSentenceDe)
  }

  function resetWordState(): void {
    setRevealed(false)
    setChoicePick(null)
    setTyped('')
    setTypeResult(null)
  }

  async function completeWord(quality: number): Promise<void> {
    if (!word || busy) return
    setBusy(true)
    try {
      await onWordReviewed(word.id, quality)
      await onDrillDone()
      setScore((s) => ({
        introduced: s.introduced + 1,
        correct: s.correct + (quality >= 4 ? 1 : 0),
        wrong: s.wrong + (quality < 4 ? 1 : 0),
      }))
      resetWordState()
      setPhase('intro')
      setIndex((i) => i + 1)
    } finally {
      setBusy(false)
    }
  }

  function submitTyped(): void {
    if (!word || typeResult || busy) return
    const accepted = word.article ? [`${word.article} ${word.german}`, word.german] : [word.german]
    const result = gradeAnswer(typed, accepted, { articleOptional: word.article !== null })
    setTypeResult({ correct: result.correct, matched: result.matched })
    if (result.correct) speakWord()
  }

  if (!word) {
    return (
      <Card title="Session complete 🎉">
        <p className="text-sm text-slate-600">
          You introduced <span className="font-semibold text-indigo-700">{score.introduced}</span> new words
          ({score.correct} typed correctly, {score.wrong} to relearn).
        </p>
        <p className="mt-2 text-sm text-slate-500">
          SM-2 scheduled the first reviews — come back tomorrow and check <span className="font-medium">Review</span>.
        </p>
        <div className="mt-4">
          <Button variant="primary" onClick={onFinish}>
            Back to overview
          </Button>
        </div>
      </Card>
    )
  }

  const full = word.article ? `${word.article} ${word.german}` : word.german
  const phaseLabel = phase === 'intro' ? '1 · Flashcard' : phase === 'choice' ? '2 · Multiple choice' : '3 · Typing'
  const progress = Math.round((index / words.length) * 100)

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Word {index + 1} / {words.length} · {phaseLabel}
          </span>
          <button type="button" className="text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline" onClick={() => void completeWord(2)}>
            skip
          </button>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
      {phase === 'intro' && (
        <Card>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              New word · {word.cefr} · {word.theme}
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-900">
              {word.article && <span className={`mr-2 ${ARTICLE_CLASS[word.article]}`}>{word.article}</span>}
              {word.german}
            </p>
            {word.plural && <p className="mt-1 text-sm text-slate-500">Plural: {word.plural}</p>}
            <div className="mt-3 flex justify-center gap-2">
              <Button onClick={speakWord}>🔊 Word</Button>
              {word.exampleSentenceDe && <Button onClick={speakExample}>🔊 Example</Button>}
            </div>
            {word.exampleSentenceDe && (
              <p className="mt-4 text-sm italic text-slate-600">{word.exampleSentenceDe}</p>
            )}
            {revealed && word.exampleSentenceEn && (
              <p className="mt-1 text-sm italic text-slate-400">{word.exampleSentenceEn}</p>
            )}
            {revealed ? (
              <p className="mt-6 text-2xl font-semibold text-indigo-700">{word.english}</p>
            ) : (
              <Button variant="primary" className="mt-6" onClick={() => setRevealed(true)}>
                Show meaning
              </Button>
            )}
            <div className="mt-6">
              <Button variant="primary" disabled={!revealed} onClick={() => { speakWord(); setPhase('choice') }}>
                Continue →
              </Button>
            </div>
          </div>
        </Card>
      )}

      {phase === 'choice' && (
        <Card>
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">What does it mean?</p>
          <p className="mt-2 text-center text-3xl font-bold text-slate-900">{full}</p>
          <div className="mt-3 flex justify-center">
            <Button onClick={speakWord}>🔊 Listen</Button>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {options.map((opt) => {
              const picked = choicePick === opt.id
              const isRight = opt.id === word.id
              const showState = choicePick !== null
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={showState || busy}
                  onClick={() => {
                    setChoicePick(opt.id)
                    if (isRight) speakWord()
                  }}
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    showState && isRight
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : showState && picked
                        ? 'border-red-300 bg-red-50 text-red-800'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.english}
                </button>
              )
            })}
          </div>
          {choicePick !== null && (
            <div className="mt-4 text-center">
              {choicePick === word.id ? (
                <Badge tone="ok">Richtig!</Badge>
              ) : (
                <Badge tone="bad">The meaning is “{word.english}”</Badge>
              )}
              <div className="mt-3">
                <Button variant="primary" onClick={() => setPhase('type')}>
                  Continue →
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
      {phase === 'type' && (
        <Card>
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Type it in German</p>
          <p className="mt-2 text-center text-3xl font-bold text-slate-900">{word.english}</p>
          {word.exampleSentenceEn && (
            <p className="mt-1 text-center text-sm italic text-slate-400">{word.exampleSentenceEn}</p>
          )}
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              submitTyped()
            }}
          >
            <input
              ref={inputRef}
              className={`${inputClass} text-center text-lg`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={word.article ? `z. B. ${word.article} …` : 'German answer…'}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={typeResult !== null}
            />
            {word.article && (
              <div className="flex justify-center gap-2">
                {['ä', 'ö', 'ü', 'ß'].map((ch) => (
                  <Button key={ch} type="button" disabled={typeResult !== null} onClick={() => setTyped((t) => t + ch)}>
                    {ch}
                  </Button>
                ))}
              </div>
            )}
            {!typeResult && (
              <div className="text-center">
                <Button variant="primary" type="submit" disabled={typed.trim().length === 0}>
                  Check
                </Button>
              </div>
            )}
          </form>
          {typeResult && (
            <div className="mt-4 space-y-3 text-center">
              {typeResult.correct ? (
                <Badge tone="ok">Richtig! {full}</Badge>
              ) : (
                <Badge tone="bad">Correct answer: {full}</Badge>
              )}
              <p className="text-xs text-slate-400">umlaut-free typing is accepted (uebung = Übung)</p>
              <div>
                <Button variant="primary" disabled={busy} onClick={() => void completeWord(typeResult.correct ? 4 : 2)}>
                  {index + 1 >= words.length ? 'Finish' : 'Next word →'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
