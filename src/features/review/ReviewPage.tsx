import { MilestoneStub } from '../../components/ui'

export default function ReviewPage() {
  return (
    <MilestoneStub
      milestone="Milestone 1 & 2"
      title="Review"
      points={[
        'Spaced-repetition queue for vocabulary due today',
        'Mixed drill types: cloze, choice, transformation, word order, translation',
        'Works fully offline — no AI needed for grading',
      ]}
    />
  )
}
