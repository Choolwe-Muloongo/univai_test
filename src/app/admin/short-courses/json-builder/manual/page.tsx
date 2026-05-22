import Link from 'next/link';

import { JsonBuilderFullManual } from '@/components/admin/short-courses/json-builder-full-manual';
import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';
import { Button } from '@/components/ui/button';

export default function JsonBuilderManualPage() {
  return (
    <ShortCourseShell
      title="JSON builder manual"
      description="A full reference guide for JSON course structure, card types, special blocks, and professional course-design patterns."
    >
      <div className="mb-4 flex flex-col gap-3 rounded-3xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Need to build instead?</p>
          <p className="text-sm text-muted-foreground">
            Go back to the JSON Builder when you want to paste, edit, preview, save, or publish a course.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/short-courses/json-builder">Open JSON Builder</Link>
        </Button>
      </div>
      <JsonBuilderFullManual />
    </ShortCourseShell>
  );
}
