import { ShortCourseLaunchBuilderClient } from '@/components/admin/short-courses/short-course-launch-builder-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';

export default function ShortCourseBuilderPage() {
  return (
    <ShortCourseShell
      title="AI course builder"
      description="Generate short courses with AI, review/edit the JSON blueprint, preview the student lesson, then save drafts for human review."
    >
      <ShortCourseLaunchBuilderClient />
    </ShortCourseShell>
  );
}
