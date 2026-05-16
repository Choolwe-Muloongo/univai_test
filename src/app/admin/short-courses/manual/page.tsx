import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';
import { VisualManualCourseBuilderClient } from '@/components/admin/short-courses/visual-manual-course-builder-client';

export default function ManualPage() {
  return (
    <ShortCourseShell title="Manual course builder" description="Create and edit a short course visually with live student preview. No JSON editing required.">
      <VisualManualCourseBuilderClient />
    </ShortCourseShell>
  );
}
