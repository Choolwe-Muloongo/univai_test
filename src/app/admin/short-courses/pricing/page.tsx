import { ShortCourseMetricsClient } from '@/components/admin/short-courses/short-course-metrics-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';

export default function ShortCoursePricingPage() {
  return (
    <ShortCourseShell
      title="Short-course pricing"
      description="Review entry fees, certificate fees, free courses and pricing readiness across the short-course catalogue."
    >
      <ShortCourseMetricsClient mode="pricing" />
    </ShortCourseShell>
  );
}
