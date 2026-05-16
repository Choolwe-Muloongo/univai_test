import { DedicatedManualCourseBuilderV2Client } from '@/components/admin/short-courses/dedicated-manual-course-builder-v2-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';

export default function ManualPage() {
  return (
    <ShortCourseShell
      title="Manual course builder"
      description="Build short courses manually with a guided visual studio. Use AI only when you choose to switch to the AI helper."
    >
      <DedicatedManualCourseBuilderV2Client />
    </ShortCourseShell>
  );
}
