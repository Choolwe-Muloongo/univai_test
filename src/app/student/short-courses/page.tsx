'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getMyShortCourses, type ShortCourseEnrollmentSummary } from '@/lib/api/short-courses';

export default function StudentShortCoursesPage() {
  const [items, setItems] = useState<ShortCourseEnrollmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getMyShortCourses()
      .then((data) => { if (mounted) setItems(data); })
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load your short courses.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <PageLoading message="Loading your short courses..." />;
  if (error) return <PageError message={error} actionHref="/short-courses" actionLabel="Browse short courses" />;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-3 rounded-3xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">My Short Courses</p>
          <h1 className="text-3xl font-bold">Continue learning</h1>
          <p className="text-sm text-muted-foreground">Track progress, continue lessons, and finish your certificates.</p>
        </div>
        <Button asChild><Link href="/short-courses">Browse more courses</Link></Button>
      </section>

      {items.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => item.course ? (
            <Card key={item.id} className="rounded-2xl">
              <CardHeader><CardTitle className="text-xl">{item.course.title}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm text-muted-foreground">{item.course.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Progress</span><strong>{item.progress}%</strong></div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${item.progress}%` }} /></div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-1">{item.status}</span>
                  <span className="rounded-full bg-muted px-2 py-1">{item.entryFeePaid ? 'Access active' : 'Access pending'}</span>
                  <span className="rounded-full bg-muted px-2 py-1">Score: {item.examScore ?? '—'}</span>
                </div>
                <Button asChild className="w-full"><Link href={`/student/short-courses/${item.course.id}`}>Open course</Link></Button>
              </CardContent>
            </Card>
          ) : null)}
        </div>
      ) : (
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <p className="text-muted-foreground">You have not enrolled in any short courses yet.</p>
            <Button asChild><Link href="/short-courses">Browse short courses</Link></Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
