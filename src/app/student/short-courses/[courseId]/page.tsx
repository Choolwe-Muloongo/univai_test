'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getShortCourseAccessPlans, purchaseShortCourseAccessPlan, type ShortCourseAccessPlan } from '@/lib/api/short-course-access';
import { enrollShortCourse, formatMoney, getLessonsByShortCourse, getPublicShortCourse, getShortCourseCertificateUrl, getShortCourseProgress, payShortCourseCertificate, paymentUrl, type PublicShortCourse, type PublicShortCourseLesson, type ShortCourseProgress } from '@/lib/api/short-courses';

export default function StudentShortCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<PublicShortCourse | null>(null);
  const [lessons, setLessons] = useState<PublicShortCourseLesson[]>([]);
  const [progress, setProgress] = useState<ShortCourseProgress | null>(null);
  const [plans, setPlans] = useState<ShortCourseAccessPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [workingPlan, setWorkingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    const [courseData, lessonData, progressData, planData] = await Promise.all([
      getPublicShortCourse(courseId),
      getLessonsByShortCourse(courseId).catch(() => []),
      getShortCourseProgress(courseId).catch(() => null),
      getShortCourseAccessPlans(courseId).catch(() => []),
    ]);
    setCourse(courseData);
    setLessons(lessonData);
    setProgress(progressData);
    setPlans(planData);
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
    setNotice(null);
    try {
      const response = await enrollShortCourse(courseId);
      const url = paymentUrl(response);
      if (url) {
        window.location.href = url;
        return;
      }
      setNotice(response.testMode ? 'Testing mode: course access has been activated without checkout.' : 'Course access refreshed.');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to open course.');
    } finally {
      setBusy(false);
    }
  }

  async function activatePlan(planCode: string) {
    setWorkingPlan(planCode);
    setError(null);
    setNotice(null);
    try {
      const response = await purchaseShortCourseAccessPlan(courseId, planCode);
      const url = paymentUrl(response);
      if (url) {
        window.location.href = url;
        return;
      }
      setNotice(response.testMode ? 'Testing mode: monthly plan activated without checkout.' : 'Plan activated.');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to activate this plan.');
    } finally {
      setWorkingPlan(null);
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
          {notice ? <div className="rounded-xl border bg-primary/5 p-4 text-sm">{notice}</div> : null}
          <div className="grid gap-3 md:grid-cols-4">
            <Info label="Entry" value={entryFee} />
            <Info label="Certificate" value={progress?.certificateIncluded ? 'Included' : certificateFee} />
            <Info label="Duration" value={`${course.durationHours ?? 0} hours`} />
            <Info label="Progress" value={`${progress?.progress ?? 0}%`} />
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Info label="Access plan" value={progress?.accessPlan ?? 'Not active'} />
            <Info label="Access expires" value={formatDate(progress?.accessExpiresAt)} />
            <Info label="AI plan" value={progress?.aiPlan ?? 'None'} />
            <Info label="AI quota" value={`${progress?.hourlyAiQuota ?? 0}/hr - ${progress?.dailyAiQuota ?? 0}/day`} />
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress?.progress ?? 0}%` }} /></div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={start} disabled={busy}>{busy ? 'Working...' : isPaid ? 'Refresh entry access' : entryFee === 'Free' ? 'Start course' : `Activate entry access (${entryFee})`}</Button>
            {firstLesson ? isPaid ? <Button asChild variant="outline"><Link href={`/student/short-courses/${courseId}/lesson/${firstLesson.id}`}>Continue lesson</Link></Button> : <Button variant="outline" disabled>Continue lesson</Button> : null}
            {isPaid ? <Button asChild variant="outline"><Link href={`/student/short-courses/${courseId}/practice`}>Practice arena</Link></Button> : <Button variant="outline" disabled>Practice arena</Button>}
            {isPaid ? <Button asChild variant="outline"><Link href={`/student/short-courses/${courseId}/exam`}>Final assessment</Link></Button> : <Button variant="outline" disabled>Final assessment</Button>}
            <Button variant="outline" onClick={handleCertificate} disabled={busy || !progress?.completedAt}>Certificate</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly access plans</CardTitle>
          <CardDescription>Payments are currently disabled for testing. Choose a plan to test access, AI quotas, and certificate inclusion.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.length ? plans.map((plan) => (
            <div key={plan.code} className="flex flex-col rounded-2xl border p-4">
              <p className="font-semibold">{plan.name}</p>
              <p className="mt-2 text-2xl font-bold">{formatMoney(plan.amount, plan.currency)}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>Course access: {Math.round(plan.accessHours / 24)} days</p>
                <p>AI quota: {plan.hourlyAiQuota}/hr - {plan.dailyAiQuota}/day</p>
                <p>{plan.certificateIncluded ? 'Certificate included' : 'Certificate not included'}</p>
              </div>
              <Button className="mt-auto w-full" variant={progress?.accessPlan === plan.code ? 'secondary' : 'outline'} onClick={() => activatePlan(plan.code)} disabled={workingPlan === plan.code}>
                {workingPlan === plan.code ? 'Activating...' : progress?.accessPlan === plan.code ? 'Active plan' : 'Activate for testing'}
              </Button>
            </div>
          )) : <p className="text-sm text-muted-foreground">No plans are available yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lessons</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {lessons.length ? lessons.map((lesson, index) => {
            const done = progress?.completedLessons?.includes(String(lesson.id));
            return (
              <CourseLessonRow key={lesson.id ?? index} href={`/student/short-courses/${courseId}/lesson/${lesson.id}`} locked={!isPaid}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{index + 1}. {lesson.title}</p>
                    {lesson.summary ? <p className="mt-1 text-sm text-muted-foreground">{lesson.summary}</p> : null}
                  </div>
                  <span className="text-sm text-muted-foreground">{!isPaid ? 'Locked' : done ? 'Done' : 'Open'}</span>
                </div>
              </CourseLessonRow>
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

function CourseLessonRow({ href, locked, children }: { href: string; locked: boolean; children: ReactNode }) {
  const className = "block rounded-xl border p-4 transition hover:border-primary";
  if (locked) {
    return <div className={`${className} opacity-75`}>{children}</div>;
  }
  return <Link className={className} href={href}>{children}</Link>;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
