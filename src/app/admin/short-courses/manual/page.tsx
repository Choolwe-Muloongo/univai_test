import { DedicatedManualCourseBuilderClient } from '@/components/admin/short-courses/dedicated-manual-course-builder-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';
import { Button } from '@/components/ui/button';
import { buildApiUrl } from '@/lib/api/client';

export default function ManualPage() {
  return (
    <ShortCourseShell
      title="Manual course builder"
      description="Build short courses manually with a guided visual studio. Use AI only when you choose to switch to the AI helper."
    >
      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <a href={buildApiUrl('/admin/short-courses/manual-guide')} target="_blank" rel="noreferrer">
            Download builder guide PDF
          </a>
        </Button>
      </div>
      <DedicatedManualCourseBuilderClient />
    </ShortCourseShell>
  );
}
