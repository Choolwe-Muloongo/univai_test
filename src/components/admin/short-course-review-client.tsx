'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getCourses } from '@/lib/api';
import { approveShortCourse, publishApprovedShortCourse, submitShortCourseForReview } from '@/lib/api/academic';
import type { Course } from '@/lib/api/types';

export function ShortCourseReviewClient() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingCourseId, setWorkingCourseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const data = await getCourses();
    setCourses(data);
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load short courses for review.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function runAction(courseId: string, action: 'submit' | 'approve' | 'publish') {
    setWorkingCourseId(courseId);
    setError(null);
    setMessage(null);
    try {
      if (action === 'submit') {
        await submitShortCourseForReview(courseId);
        setMessage('Course submitted for review.');
      }
      if (action === 'approve') {
        await approveShortCourse(courseId, 'Approved from short course review page.');
        setMessage('Course approved. It can now be published.');
      }
      if (action === 'publish') {
        await publishApprovedShortCourse(courseId, 'Published after human review.');
        setMessage('Course published successfully.');
      }
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Review action failed.');
    } finally {
      setWorkingCourseId(null);
    }
  }

  if (loading) return <PageLoading message="Loading short course review queue..." />;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-normal text-primary">Academic Review</p>
        <h1 className="text-3xl font-bold">Review and publish short courses</h1>
        <p className="max-w-3xl text-muted-foreground">
          Build or edit courses in the Course Builder first. This page is the final human-review gate: submit drafts, approve reviewed content, then publish approved courses to students.
        </p>
      </section>

      {error ? <PageError message={error} /> : null}
      {message ? <div className="rounded-md border bg-muted/40 p-3 text-sm text-foreground">{message}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Short course review queue</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {courses.length ? courses.map((course) => {
            const status = course.status ?? 'draft';
            const reviewStatus = (course as { reviewStatus?: string; review_status?: string }).reviewStatus ?? (course as { review_status?: string }).review_status ?? 'needs_review';
            const lessonCount = (course as { lessonCount?: number; lesson_count?: number }).lessonCount ?? (course as { lesson_count?: number }).lesson_count ?? course.lessons?.length ?? 0;
            const busy = workingCourseId === course.id;
            return (
              <div key={course.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{course.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs uppercase tracking-wide">{status}</span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>Review: {reviewStatus}</p>
                  <p>Lessons: {lessonCount}</p>
                  <p>{course.pricingType === 'free' ? 'Free' : `${course.currency || 'ZMW'} ${course.price ?? 0}`}</p>
                </div>
                <div className="mt-4 grid gap-2">
                  <Button type="button" variant="outline" disabled={busy || status === 'published'} onClick={() => runAction(course.id, 'submit')}>
                    Submit for review
                  </Button>
                  <Button type="button" variant="secondary" disabled={busy || status === 'published'} onClick={() => runAction(course.id, 'approve')}>
                    Approve
                  </Button>
                  <Button type="button" disabled={busy || status === 'published'} onClick={() => runAction(course.id, 'publish')}>
                    Publish reviewed
                  </Button>
                </div>
              </div>
            );
          }) : <p className="text-sm text-muted-foreground">No short courses found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}