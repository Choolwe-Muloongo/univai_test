'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getCourses } from '@/lib/api';
import { deleteAdminShortCourse } from '@/lib/api/admin-short-courses';
import type { Course } from '@/lib/api/types';

export function ShortCourseCatalogueClient() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const data = await getCourses();
    setCourses(data);
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load short courses.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function deleteCourse(course: Course) {
    const confirmed = window.confirm(`Delete "${course.title}"? This removes the short course from the catalogue. This cannot be undone.`);
    if (!confirmed) return;
    setDeletingId(course.id);
    setError(null);
    setMessage(null);
    try {
      await deleteAdminShortCourse(course.id);
      setCourses((current) => current.filter((item) => item.id !== course.id));
      setMessage(`${course.title} deleted.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete this short course.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <PageLoading message="Loading short-course catalogue..." />;
  if (error) return <PageError message={error} />;

  return (
    <div className="space-y-4">
      {message ? <div className="rounded-xl border bg-muted/40 p-3 text-sm">{message}</div> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.length ? courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle className="text-lg">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="line-clamp-3">{course.description}</p>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3">
                <p>Status: <span className="font-medium text-foreground">{course.status ?? 'draft'}</span></p>
                <p>Level: <span className="font-medium text-foreground">{course.level ?? 'beginner'}</span></p>
                <p>Hours: <span className="font-medium text-foreground">{course.durationHours ?? 0}</span></p>
                <p>Price: <span className="font-medium text-foreground">{course.pricingType === 'free' ? 'Free' : `${course.currency || 'ZMW'} ${course.price ?? 0}`}</span></p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button asChild size="sm" variant="outline"><Link href={`/admin/short-courses/builder?courseId=${course.id}`}>Edit</Link></Button>
                <Button asChild size="sm"><Link href="/admin/short-courses/review">Review</Link></Button>
                <Button type="button" size="sm" variant="destructive" disabled={deletingId === course.id} onClick={() => void deleteCourse(course)}>
                  {deletingId === course.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-6 text-sm text-muted-foreground">No short courses yet. Start from the AI Course Builder.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
