import type { VocabWord } from '../../db/types'
import { conjugateVerb, isVerbWord } from '../../engine/verbForms'

export const ARTICLE_CLASS: Record<string, string> = {
  der: 'text-sky-600',
  die: 'text-rose-600',
  das: 'text-emerald-600',
}

/** Grammatical gender colors are shared with StudySession. */
const VERB_PERSONS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'Sie/sie'] as const

/**
 * Word forms shown while learning/browsing: nouns get their plural, verbs the
 * full Präsens conjugation plus Präteritum and Perfekt (er/sie/es).
 */
export function WordFormsPanel({ word }: { word: VocabWord }) {
  if (word.article !== null) {
    if (!word.plural) return null
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
        <span className="mr-2 font-medium text-slate-500">Plural</span>
        <span className="font-semibold text-slate-800">
          <span className="text-rose-600">die</span> {word.plural}
        </span>
      </div>
    )
  }

  if (!isVerbWord(word)) return null
  const forms = conjugateVerb(word.german)
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <table className="w-full">
        <tbody>
          {VERB_PERSONS.map((person, i) => (
            <tr key={person}>
              <td className="w-28 py-0.5 pr-2 align-top text-slate-500">{person}</td>
              <td className="py-0.5 font-medium text-slate-800">{forms.praesens[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 space-y-1 border-t border-slate-200 pt-2">
        <p>
          <span className="mr-1 text-slate-500">Präteritum:</span>
          <span className="font-semibold text-slate-800">{forms.praeteritum}</span>
          <span className="ml-1 text-xs text-slate-400">(ich/er)</span>
        </p>
        <p>
          <span className="mr-1 text-slate-500">Perfekt:</span>
          <span className="font-semibold text-slate-800">{forms.perfekt}</span>
          <span className="ml-1 text-xs text-slate-400">(er/sie/es)</span>
        </p>
      </div>
    </div>
  )
}
