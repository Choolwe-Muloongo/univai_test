import { ShortCourseStepwiseAiBuilderClient } from '@/components/admin/short-courses/short-course-stepwise-ai-builder-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';

export default function ShortCourseBuilderPage() {
  return (
    <ShortCourseShell title="AI-assisted course builder" description="Build courses one controlled section at a time using the same blueprint, preview, draft, review, and publish flow as the manual builder.">
      <ShortCourseStepwiseAiBuilderClient />
    </ShortCourseShell>
  );
}
