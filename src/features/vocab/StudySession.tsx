import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Card, inputClass, Kbd } from '../../components/ui'
import type { VocabWord } from '../../db/types'
import { gradeAnswer } from '../../engine/grader'
import { choiceKeyIndex, introKeyAction, resultKeyAction, skipKeyAction } from '../../engine/sessionKeys'
import { exampleSentences, type ExampleSentence } from '../../llm/services'
import { useAppStore } from '../../state/store'
import { useLlmDeps } from '../../state/useLlmDeps'
import { tts } from '../../speech/tts'
import { ARTICLE_CLASS, WordFormsPanel } from './WordForms'

export interface StudySessionProps {
  words: VocabWord[]
  bank: VocabWord[]
  onWordReviewed: (wordId: string, quality: number) => Promise<unknown>
  onDrillDone: () => Promise<unknown>
  onFinish: () => void
}

type Phase = 'intro' | 'choice' | 'type'

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
  const [score, setScore] = useState({ introduced: 0, correct: 0, wrong: 0, skipped: 0 })
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  /** M10.5: guards double completion (focused button Enter + key handler). */
  const completingRef = useRef(false)
  const speechSettings = useAppStore((s) => s.settings)

  // AI example sentences (M3) — only available with a configured key
  const [aiExamples, setAiExamples] = useState<ExampleSentence[] | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const aiDeps = useLlmDeps('examples').deps

  const word = words[index]
  const options = useMemo(() => (word ? choiceOptions(word, bank) : []), [word, bank])

  // M10.5: keyboard study — Space reveals/continues, 1–4 pick options, Enter
  // continues after results. While typing without a result, keys stay with
  // the input/form. completingRef makes double-firing impossible when a
  // focused button's native Enter ALSO triggers this handler.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (!word || busy || aiBusy || completingRef.current) return
      if (phase === 'type' && typeResult === null) return
      // M12.9: S = "Known — skip" (perfect SM-2 review) at any point before
      // completion. The guard above means a live typing input never reaches
      // here, so typing 's' stays in the answer where it belongs.
      if (skipKeyAction(e.key)) {
        e.preventDefault()
        void skipKnown()
        return
      }
      if (phase === 'intro') {
        const action = introKeyAction(e.key, revealed)
        if (!action) return
        e.preventDefault()
        if (action === 'reveal') setRevealed(true)
        else {
          speakWord()
          setPhase('choice')
        }
      } else if (phase === 'choice') {
        if (choicePick !== null) {
          if (resultKeyAction(e.key)) {
            e.preventDefault()
            setPhase('type')
          }
          return
        }
        const i = choiceKeyIndex(e.key, options.length)
        if (i !== null) {
          e.preventDefault()
          setChoicePick(options[i].id)
          if (options[i].id === word.id) speakWord()
        }
      } else if (typeResult !== null && resultKeyAction(e.key)) {
        e.preventDefault()
        void completeWord(typeResult.correct ? 4 : 2)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, revealed, choicePick, typeResult, options, word, busy, aiBusy])

  // M10.5: caret straight into the typing field when the phase starts.
  useEffect(() => {
    if (phase === 'type') inputRef.current?.focus()
  }, [phase, index])

  async function loadExamples(): Promise<void> {
    if (!aiDeps || !word || aiBusy) return
    setAiBusy(true)
    setAiError(null)
    try {
      const list = await exampleSentences(aiDeps, {
        word: { german: word.german, english: word.english },
        cefr: word.cefr,
        n: 3,
      })
      setAiExamples(list)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e))
    } finally {
      setAiBusy(false)
    }
  }

  function speakWord(): void {
    if (word)
      tts.speak(word.german, { rate: speechSettings?.ttsRate, voiceURI: speechSettings?.ttsVoice })
  }

  function speakExample(): void {
    if (word?.exampleSentenceDe)
      tts.speak(word.exampleSentenceDe, {
        rate: speechSettings?.ttsRate,
        voiceURI: speechSettings?.ttsVoice,
      })
  }

  function resetWordState(): void {
    setRevealed(false)
    setChoicePick(null)
    setTyped('')
    setTypeResult(null)
    setAiExamples(null)
    setAiError(null)
  }

  async function completeWord(quality: number): Promise<void> {
    if (!word || busy || completingRef.current) return
    completingRef.current = true
    setBusy(true)
    try {
      await onWordReviewed(word.id, quality)
      await onDrillDone()
      setScore((s) => ({
        introduced: s.introduced + 1,
        correct: s.correct + (quality >= 4 ? 1 : 0),
        wrong: s.wrong + (quality < 4 ? 1 : 0),
        skipped: s.skipped,
      }))
      resetWordState()
      setPhase('intro')
      setIndex((i) => i + 1)
    } finally {
      setBusy(false)
      completingRef.current = false
    }
  }

  /**
   * M12.9 "Known — skip": the learner already knows this word, so it gets a
   * perfect SM-2 review (quality 5, same as markWordKnown) and the session
   * advances past the remaining drill steps. Not counted as a drill.
   */
  async function skipKnown(): Promise<void> {
    if (!word || busy || completingRef.current) return
    completingRef.current = true
    setBusy(true)
    try {
      await onWordReviewed(word.id, 5)
      setScore((s) => ({ introduced: s.introduced + 1, correct: s.correct, wrong: s.wrong, skipped: s.skipped + 1 }))
      resetWordState()
      setPhase('intro')
      setIndex((i) => i + 1)
    } finally {
      setBusy(false)
      completingRef.current = false
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
          ({score.correct} typed correctly, {score.wrong} to relearn
          {score.skipped > 0 ? `, ${score.skipped} skipped as known` : ''}).
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
          <span className="flex items-center gap-1">
            <button
              type="button"
              disabled={busy}
              className="text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline disabled:opacity-50"
              onClick={() => void skipKnown()}
            >
              Known — skip
            </button>
            <Kbd>S</Kbd>
          </span>
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
            <div className="mx-auto mt-3 w-full max-w-sm">
              <WordFormsPanel word={word} />
            </div>
            <div className="mt-3 flex justify-center gap-2">
              <Button onClick={speakWord}>🔊 Word</Button>
              {word.exampleSentenceDe && <Button onClick={speakExample}>🔊 Example</Button>}
              {aiDeps && (
                <Button disabled={aiBusy} onClick={() => void loadExamples()}>
                  {aiBusy ? '✨ …' : '✨ AI examples'}
                </Button>
              )}
            </div>
            {aiExamples && aiExamples.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-left">
                {aiExamples.map((ex) => (
                  <li key={ex.de} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm">
                    <button
                      type="button"
                      className="mr-1 text-slate-400 hover:text-slate-600"
                      onClick={() =>
                        tts.speak(ex.de, { rate: speechSettings?.ttsRate, voiceURI: speechSettings?.ttsVoice })
                      }
                    >
                      🔊
                    </button>
                    <span className="font-medium text-slate-800">{ex.de}</span>{' '}
                    <span className="text-xs text-slate-400">({ex.cefr}) — {ex.en}</span>
                  </li>
                ))}
              </ul>
            )}
            {aiError && <p className="mt-2 text-xs text-red-600">AI examples failed: {aiError}</p>}
            {word.exampleSentenceDe && (
              <p className="mt-4 text-sm italic text-slate-600">{word.exampleSentenceDe}</p>
            )}
            {revealed && word.exampleSentenceEn && (
              <p className="mt-1 text-sm italic text-slate-400">{word.exampleSentenceEn}</p>
            )}
            {revealed ? (
              <p className="dm-reveal mt-6 text-2xl font-semibold text-indigo-700">{word.english}</p>
            ) : (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button variant="primary" onClick={() => setRevealed(true)}>
                  Show meaning
                </Button>
                <Kbd>Space</Kbd>
              </div>
            )}
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button variant="primary" disabled={!revealed} onClick={() => { speakWord(); setPhase('choice') }}>
                Continue →
              </Button>
              {revealed && <Kbd>Space</Kbd>}
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
            {options.map((opt, optIndex) => {
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
                  className={`flex items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    showState && isRight
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : showState && picked
                        ? 'border-red-300 bg-red-50 text-red-800'
                        : 'border-slate-300 bg-surface text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex-1">{opt.english}</span>
                  <Kbd>{optIndex + 1}</Kbd>
                </button>
              )
            })}
          </div>
          {choicePick !== null && (
            <div className="dm-reveal mt-4 text-center">
              {choicePick === word.id ? (
                <Badge tone="ok">Richtig!</Badge>
              ) : (
                <Badge tone="bad">The meaning is “{word.english}”</Badge>
              )}
              <div className="mt-3 flex items-center justify-center gap-2">
                <Button variant="primary" onClick={() => setPhase('type')}>
                  Continue →
                </Button>
                <Kbd>Enter</Kbd>
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
            <div className="dm-reveal mt-4 space-y-3 text-center">
              {typeResult.correct ? (
                <Badge tone="ok">Richtig! {full}</Badge>
              ) : (
                <Badge tone="bad">Correct answer: {full}</Badge>
              )}
              <p className="text-xs text-slate-400">umlaut-free typing is accepted (uebung = Übung)</p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="primary" disabled={busy} onClick={() => void completeWord(typeResult.correct ? 4 : 2)}>
                  {index + 1 >= words.length ? 'Finish' : 'Next word →'}
                </Button>
                <Kbd>Enter</Kbd>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
