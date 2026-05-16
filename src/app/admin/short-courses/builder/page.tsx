import { ShortCourseBuilderSafeClient } from '@/components/admin/short-courses/short-course-builder-safe-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';

export default function ShortCourseBuilderPage() {
  return (
    <ShortCourseShell
      title="AI course builder"
      description="Generate short courses with AI, edit every module, lesson and card, preview the student experience, then save drafts for review."
    >
      <ShortCourseBuilderSafeClient />
    </ShortCourseShell>
  );
}
