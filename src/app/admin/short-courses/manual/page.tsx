import { ShortCourseLaunchBuilderClient } from '@/components/admin/short-courses/short-course-launch-builder-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';

export default function ManualPage() {
  return (
    <ShortCourseShell title="Manual course builder" description="Create a short course manually and save it as a draft for review.">
      <ShortCourseLaunchBuilderClient />
    </ShortCourseShell>
  );
}
