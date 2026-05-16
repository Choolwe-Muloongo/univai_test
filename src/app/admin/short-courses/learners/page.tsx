import { ShortCourseMetricsClient } from '@/components/admin/short-courses/short-course-metrics-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';

export default function ShortCourseLearnersPage() {
  return (
    <ShortCourseShell
      title="Short-course learners"
      description="Review learner-progress readiness across courses and confirm the progress and certificate data sources are connected."
    >
      <ShortCourseMetricsClient mode="learners" />
    </ShortCourseShell>
  );
}
