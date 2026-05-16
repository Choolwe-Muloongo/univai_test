'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { enrollShortCourse, formatMoney, getLessonsByShortCourse, getPublicShortCourse, getShortCourseCertificateUrl, getShortCourseProgress, payShortCourseCertificate, paymentUrl, type PublicShortCourse, type PublicShortCourseLesson, type ShortCourseProgress } from '@/lib/api/short-courses';

export default function StudentShortCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<PublicShortCourse | null>(null);
  const [lessons, setLessons] = useState<PublicShortCourseLesson[]>([]);
  const [progress, setProgress] = useState<ShortCourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [courseData, lessonData, progressData] = await Promise.all([
      getPublicShortCourse(courseId),
      getLessonsByShortCourse(courseId).catch(() => []),
      getShortCourseProgress(courseId).catch(() => null),
    ]);
    setCourse(courseData);
    setLessons(lessonData);
    setProgress(progressData);
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load short course.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [courseId]);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const response = await enrollShortCourse(courseId);
      const url = paymentUrl(response);
      if (url) {
        window.location.href = url;
        return;
      }
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to open course.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCertificate() {
    setBusy(true);
    setError(null);
    try {
      const response = await payShortCourseCertificate(courseId);
      const url = paymentUrl(response);
      if (url) {
        window.location.href = url;
        return;
      }
      window.location.href = getShortCourseCertificateUrl(courseId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to open certificate.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoading message="Loading course..." />;
  if (error) return <PageError message={error} actionHref="/student/short-courses" actionLabel="Back to my courses" />;
  if (!course) return <PageError title="Course not found" message="This short course is unavailable." actionHref="/student/short-courses" actionLabel="Back to my courses" />;

  const entryFee = formatMoney(course.price, course.currency || 'ZMW');
  const certificateFee = formatMoney(course.certificateFee, course.certificateCurrency || course.currency || 'ZMW');
  const isPaid = progress?.entryFeePaid;
  const firstLesson = lessons[0];

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Card className="rounded-3xl border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl">{course.title}</CardTitle>
          <CardDescription>{course.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <Info label="Entry" value={entryFee} />
            <Info label="Certificate" value={certificateFee} />
            <Info label="Duration" value={`${course.durationHours ?? 0} hours`} />
            <Info label="Progress" value={`${progress?.progress ?? 0}%`} />
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress?.progress ?? 0}%` }} /></div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={start} disabled={busy}>{busy ? 'Working...' : isPaid ? 'Refresh access' : entryFee === 'Free' ? 'Start course' : `Pay entry fee (${entryFee})`}</Button>
            {firstLesson ? <Button asChild variant="outline" disabled={!isPaid}><Link href={`/student/short-courses/${courseId}/lesson/${firstLesson.id}`}>Continue lesson</Link></Button> : null}
            <Button asChild variant="outline"><Link href={`/student/short-courses/${courseId}/exam`}>Final assessment</Link></Button>
            <Button variant="outline" onClick={handleCertificate} disabled={busy || !progress?.completedAt}>Certificate</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lessons</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {lessons.length ? lessons.map((lesson, index) => {
            const done = progress?.completedLessons?.includes(String(lesson.id));
            return (
              <Link key={lesson.id ?? index} className="block rounded-xl border p-4 transition hover:border-primary" href={`/student/short-courses/${courseId}/lesson/${lesson.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{index + 1}. {lesson.title}</p>
                    {lesson.summary ? <p className="mt-1 text-sm text-muted-foreground">{lesson.summary}</p> : null}
                  </div>
                  <span className="text-sm text-muted-foreground">{done ? 'Done' : 'Open'}</span>
                </div>
              </Link>
            );
          }) : <p className="text-sm text-muted-foreground">No lessons are available yet.</p>}
        </CardContent>
      </Card>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="font-bold">{value}</p></div>;
}
