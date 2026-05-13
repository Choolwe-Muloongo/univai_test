import { PlatformPage } from '@/components/platform/platform-page';

export default function InstructorLearnersPage() {
  return (
    <PlatformPage
      eyebrow="Learners"
      title="Short-course learner progress"
      description="Track learner enrolment, lesson completion, certificate eligibility and support needs for instructor-owned courses."
      items={['Enrolled learners', 'Progress', 'Quiz results', 'Certificate eligibility', 'Support flags']}
    />
  );
}
