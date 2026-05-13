import { PlatformPage } from '@/components/platform/platform-page';

export default function InstructorCourseBuilderPage() {
  return (
    <PlatformPage
      eyebrow="Course Builder"
      title="Manual course production"
      description="Build course materials from instructor-owned content before submitting to the UnivAI review queue."
      items={['Lesson editor', 'Material uploads', 'Quiz builder', 'Assignment builder', 'Review submission']}
    />
  );
}
