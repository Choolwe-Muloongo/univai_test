import { PlatformPage } from '@/components/platform/platform-page';

export default function InstructorCourseReviewPage() {
  return (
    <PlatformPage
      eyebrow="Course Review"
      title="Submit course for UnivAI review"
      description="Instructor content and AI-generated material must be reviewed before publication."
      items={['Draft', 'AI Generated', 'Instructor Edited', 'Submitted for Review', 'Needs Changes', 'Approved', 'Published']}
    />
  );
}
