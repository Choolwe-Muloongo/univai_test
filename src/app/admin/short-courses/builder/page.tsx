import { ShortCourseAiBuilderV2Client } from '@/components/admin/short-courses/short-course-ai-builder-v2-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';

export default function ShortCourseBuilderPage() {
  return (
    <ShortCourseShell title="AI course builder" description="Generate short courses from one prompt and one or many source documents, then save drafts for review.">
      <ShortCourseAiBuilderV2Client />
    </ShortCourseShell>
  );
}
