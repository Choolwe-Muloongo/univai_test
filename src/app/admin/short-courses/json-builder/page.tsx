import Link from 'next/link';

import { JsonCourseBuilderClient } from '@/components/admin/short-courses/json-course-builder-client';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';
import { Button } from '@/components/ui/button';

export default function JsonBuilderPage() {
  return (
    <ShortCourseShell
      title="JSON course builder"
      description="Build courses faster by selecting modules and lessons with buttons, then editing the selected content as JSON."
    >
      <div className="mb-4 flex flex-col gap-3 rounded-3xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Start fresh any time</p>
          <p className="text-sm text-muted-foreground">
            Use this after editing an existing course when you want a clean new JSON course.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/short-courses/json-builder">New JSON Course</Link>
        </Button>
      </div>
      <JsonCourseBuilderClient />
    </ShortCourseShell>
  );
}