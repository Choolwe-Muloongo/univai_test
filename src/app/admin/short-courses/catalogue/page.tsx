import { ShortCourseCatalogueClient } from '@/components/admin/short-courses/short-course-catalogue-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';

export default function ShortCourseCataloguePage() {
  return (
    <ShortCourseShell
      title="Course catalogue"
      description="View all short courses, their launch status, pricing, duration and review actions in one focused catalogue page."
    >
      <ShortCourseCatalogueClient />
    </ShortCourseShell>
  );
}
