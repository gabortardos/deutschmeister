import { normalize, stripArticle } from './text'

export interface GradeResult {
  correct: boolean
  /** The normalized accepted answer that matched, when correct. */
  matched: string | null
}

export interface GradeOptions {
  /** Accept answers that omit the article (nouns): "Apfel" ≡ "der Apfel". */
  articleOptional?: boolean
}

/**
 * Rule-based grader for closed drills. The LLM never grades these.
 * Correct iff the normalized user answer equals one of the normalized accepted answers
 * (with article-stripped comparison as a fallback when articleOptional).
 */
export function gradeAnswer(
  userAnswer: string,
  acceptedAnswers: readonly string[],
  options: GradeOptions = {},
): GradeResult {
  const user = normalize(userAnswer)
  if (user.length === 0) return { correct: false, matched: null }

  const accepted = acceptedAnswers.map((a) => normalize(a))
  const exact = accepted.find((a) => a === user)
  if (exact !== undefined) return { correct: true, matched: exact }

  if (options.articleOptional) {
    const strippedUser = stripArticle(user)
    const stripped = accepted.find((a) => stripArticle(a) === strippedUser)
    if (stripped !== undefined) return { correct: true, matched: stripped }
  }

  return { correct: false, matched: null }
}
