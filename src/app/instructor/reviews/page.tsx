import { PlatformPage } from '@/components/platform/platform-page';

export default function InstructorReviewsPage() {
  return (
    <PlatformPage
      eyebrow="Reviews"
      title="Course reviews and feedback"
      description="Monitor learner reviews, admin review notes and quality signals for marketplace courses."
      items={['Learner reviews', 'Admin notes', 'Needs changes', 'Quality score']}
    />
  );
}
