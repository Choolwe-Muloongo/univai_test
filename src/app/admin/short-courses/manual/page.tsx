import { DedicatedManualCourseBuilderClient } from '@/components/admin/short-courses/dedicated-manual-course-builder-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';

export default function ManualPage() {
  return (
    <ShortCourseShell
      title="Manual course builder"
      description="Build short courses manually with a guided visual studio. Use AI only when you choose to switch to the AI helper."
    >
      <DedicatedManualCourseBuilderClient />
    </ShortCourseShell>
  );
}
