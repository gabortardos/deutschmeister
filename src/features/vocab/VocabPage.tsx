import { MilestoneStub } from '../../components/ui'

export default function VocabPage() {
  return (
    <MilestoneStub
      milestone="Milestone 1"
      title="Vocabulary"
      points={[
        'Seed corpus of 500+ words from A1 to B1 with themes and frequency ranking',
        'Daily lesson planner: your goal is 5 new words per day (adjustable in Settings)',
        'SM-2 spaced-repetition review scheduling',
        'Flashcard and recognition drills with umlaut-tolerant grading',
      ]}
    />
  )
}
