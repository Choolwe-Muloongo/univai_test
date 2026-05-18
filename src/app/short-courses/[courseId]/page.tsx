'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { formatMoney, getLessonsByShortCourse, getPublicShortCourse, type PublicShortCourse, type PublicShortCourseLesson } from '@/lib/api/short-courses';

export default function ShortCourseInfoPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<PublicShortCourse | null>(null);
  const [lessons, setLessons] = useState<PublicShortCourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getPublicShortCourse(courseId), getLessonsByShortCourse(courseId).catch(() => [])])
      .then(([courseData, lessonData]) => {
        if (!mounted) return;
        setCourse(courseData);
        setLessons(lessonData);
      })
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load course.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [courseId]);

  if (loading) return <PageLoading message="Loading short course..." />;
  if (error) return <PageError message={error} actionHref="/short-courses" actionLabel="Back to short courses" />;
  if (!course) return <PageError title="Course not found" message="This short course is not available." actionHref="/short-courses" actionLabel="Back to short courses" />;
  if (!['published', 'active'].includes(String(course.status ?? '').toLowerCase())) {
    return <PageError title="Course unavailable" message="This short course is not open for enrollment yet." actionHref="/short-courses" actionLabel="Back to short courses" />;
  }

  const registerHref = `/register/short-courses?next=${encodeURIComponent(`/short-courses/${course.id}`)}`;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card p-8 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-1 capitalize">{course.level ?? 'beginner'}</span>
          <span className="rounded-full bg-muted px-2 py-1">{course.durationHours ?? 0} hours</span>
          <span className="rounded-full bg-muted px-2 py-1">{formatMoney(course.price, course.currency || 'ZMW')}</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{course.title}</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">{course.description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild><Link href={registerHref}>Register to enroll</Link></Button>
          <Button variant="outline" asChild><Link href={`/login?next=${encodeURIComponent(`/short-courses/${course.id}`)}`}>Already have an account?</Link></Button>
          <Button variant="outline" asChild><Link href="/short-courses">Browse more</Link></Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">New learners must create a short-course account first. No formal admission documents are required.</p>
      </section>

      <Card>
        <CardHeader><CardTitle>Lessons preview</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {lessons.length ? lessons.map((lesson, index) => (
            <div key={lesson.id ?? index} className="rounded-xl border p-4">
              <p className="font-medium">{index + 1}. {lesson.title}</p>
              {lesson.summary ? <p className="mt-1 text-sm text-muted-foreground">{lesson.summary}</p> : null}
            </div>
          )) : <p className="text-sm text-muted-foreground">Lesson preview will appear here.</p>}
        </CardContent>
      </Card>
    </main>
  );
}
