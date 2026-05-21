import { JsonCourseBuilderClient } from '@/components/admin/short-courses/json-course-builder-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';

export default function JsonBuilderPage() {
  return (
    <ShortCourseShell
      title="JSON course builder"
      description="Build courses faster by selecting modules and lessons with buttons, then editing the selected content as JSON."
    >
      <JsonCourseBuilderClient />
    </ShortCourseShell>
  );
}
