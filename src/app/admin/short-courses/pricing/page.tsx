import { ShortCourseMetricsClient } from '@/components/admin/short-courses/short-course-metrics-client';
import { ShortCoursePlanEditorClient } from '@/components/admin/short-courses/short-course-plan-editor-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';

export default function ShortCoursePricingPage() {
  return (
    <ShortCourseShell
      title="Short-course pricing"
      description="Edit monthly access plans, AI quotas, certificate inclusion and review pricing readiness across the short-course catalogue."
    >
      <div className="space-y-6">
        <ShortCoursePlanEditorClient />
        <ShortCourseMetricsClient mode="pricing" />
      </div>
    </ShortCourseShell>
  );
}
