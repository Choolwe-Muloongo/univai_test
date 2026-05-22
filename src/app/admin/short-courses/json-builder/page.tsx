import Link from 'next/link';

import { JsonCourseBuilderClient } from '@/components/admin/short-courses/json-course-builder-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';
import { Button } from '@/components/ui/button';

export default function JsonBuilderPage() {
  return (
    <ShortCourseShell
      title="JSON course builder"
      description="Paste, upload, edit, preview, save, and publish short courses from JSON. The full manual now lives on its own page."
    >
      <div className="mb-4 flex flex-col gap-3 rounded-3xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">JSON Builder is back</p>
          <p className="text-sm text-muted-foreground">
            Use this page for the actual JSON workflow. Open the manual only when you need reference examples.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/admin/short-courses/json-builder/manual">Open JSON Manual</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/short-courses/json-builder">New JSON Course</Link>
          </Button>
        </div>
      </div>
      <JsonCourseBuilderClient />
    </ShortCourseShell>
  );
}
