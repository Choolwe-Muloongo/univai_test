import { ShortCourseMetricsClient } from '@/components/admin/short-courses/short-course-metrics-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';

export default function ShortCourseEnrolmentsPage() {
  return (
    <ShortCourseShell
      title="Short-course enrolments"
      description="Review which courses are ready for enrolment, payment unlocking, progress tracking, exams and certificate release."
    >
      <ShortCourseMetricsClient mode="enrolments" />
    </ShortCourseShell>
  );
}
