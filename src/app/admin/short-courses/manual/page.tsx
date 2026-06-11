import { DedicatedManualCourseBuilderClient } from '@/components/admin/short-courses/dedicated-manual-course-builder-client';
import { ManualCourseEditLauncher } from '@/components/admin/short-courses/manual-course-edit-launcher';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';
import { Button } from '@/components/ui/button';
import { buildApiUrl } from '@/lib/api/client';

export default function ManualPage() {
  return (
    <ShortCourseShell
      title="Manual course builder"
      description="Build new short courses manually, or load an existing saved course and edit it in the same visual studio."
    >
      <div className="univai-mobile-manual-builder space-y-5">
        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href={buildApiUrl('/admin/short-courses/manual-guide')} target="_blank" rel="noreferrer">
              Download builder guide PDF
            </a>
          </Button>
        </div>
        <ManualCourseEditLauncher />
        <DedicatedManualCourseBuilderClient />
      </div>
    </ShortCourseShell>
  );
}
