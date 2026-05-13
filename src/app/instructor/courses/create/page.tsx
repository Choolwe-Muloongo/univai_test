import { PlatformPage } from '@/components/platform/platform-page';

export default function InstructorCreateCoursePage() {
  return (
    <PlatformPage
      eyebrow="Manual Builder"
      title="Create short course manually"
      description="The manual builder is free for approved instructors and supports lessons, PDFs, videos, quizzes and final assessment drafts."
      items={['Course outline', 'Lessons', 'PDFs and videos', 'Manual quizzes', 'Certificate exam', 'Submit for review']}
    />
  );
}
