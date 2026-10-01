/**
 * M14 lesson schema — the deterministic "teacher at the blackboard".
 *
 * Lessons are static seed content shipped in the bundle (like grammar topics):
 * local, typed, free, offline, testable — never synced, never AI-generated.
 * The AI layer stays interactive on top ("Ask about this lesson"), never the
 * base teaching prose. Authoring pipeline: fixed template → agent drafts →
 * **owner reviews the German didactics** (the one human step in the loop).
 */
export interface LessonTable {
  caption: string
  headers: string[]
  rows: string[][]
}

export interface LessonSection {
  heading: string
  /** Teaching prose paragraphs; supports the MiniMarkdown inline subset (**bold**). */
  prose: string[]
  table?: LessonTable
}

/** A common learner mistake: wrong form → right form → why. */
export interface LessonMistake {
  wrong: string
  right: string
  why: string
}

/**
 * Offline-gradable comprehension checkpoint (multiple choice).
 * `answer` is the index into `options`; grading lives in `src/engine/lessons.ts`.
 */
export interface LessonCheckpoint {
  id: string
  question: string
  options: string[]
  answer: number
  explain: string
}

export interface Lesson {
  /** Owning topic id (e.g. 'g-a1-02') — must exist in SEED_GRAMMAR_TOPICS. */
  topicId: string
  /** Rough reading time in minutes (guidance only). */
  minutes: number
  /** Why it matters — the motivational opener (2–3 sentences). */
  hook: string
  sections: LessonSection[]
  mistakes: LessonMistake[]
  checkpoints: LessonCheckpoint[]
  /** Printable cheat-sheet summary lines (support **bold**). */
  cheatSheet: string[]
}
