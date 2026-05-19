'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, BookOpen, CreditCard, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { formatMoney, getMyShortCourses, getPublicShortCourses, type PublicShortCourse, type ShortCourseEnrollmentSummary } from '@/lib/api/short-courses';

export default function StudentShortCoursesPage() {
  const [enrollments, setEnrollments] = useState<ShortCourseEnrollmentSummary[]>([]);
  const [courses, setCourses] = useState<PublicShortCourse[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getMyShortCourses().catch(() => []),
      getPublicShortCourses(),
    ])
      .then(([myCourses, publicCourses]) => {
        if (!mounted) return;
        setEnrollments(myCourses);
        setCourses(publicCourses);
      })
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load short courses.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const enrolledIds = useMemo(() => new Set(enrollments.map((item) => item.course?.id).filter(Boolean)), [enrollments]);
  const availableCourses = useMemo(() => courses.filter((course) => !enrolledIds.has(course.id)), [courses, enrolledIds]);
  const activeEnrollments = useMemo(() => enrollments.filter((item) => item.course && !isCompletedEnrollment(item)), [enrollments]);
  const completedEnrollments = useMemo(() => enrollments.filter((item) => item.course && isCompletedEnrollment(item)), [enrollments]);
  const filteredAvailable = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return availableCourses;
    return availableCourses.filter((course) => `${course.title} ${course.description} ${course.level ?? ''}`.toLowerCase().includes(search));
  }, [availableCourses, query]);

  if (loading) return <PageLoading message="Loading short courses..." />;
  if (error) return <PageError message={error} actionHref="/short-courses" actionLabel="Open public catalogue" />;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Short courses</p>
            <h1 className="text-3xl font-bold tracking-tight">Learn, practice, and earn certificates</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Continue active courses, review completed ones, or choose a published course below to start.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto"><Link href="/student/courses">Open full course hub</Link></Button>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Continue learning</h2>
          <p className="text-sm text-muted-foreground">Your joined courses appear here.</p>
        </div>

        {activeEnrollments.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {activeEnrollments.map((item) => <EnrolledCourseCard key={item.id} item={item} />)}
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="space-y-4 p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-primary" />
              <div>
                <CardTitle>No short course joined yet</CardTitle>
                <CardDescription className="mt-2">Pick one from the available courses below. Free courses open immediately.</CardDescription>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {completedEnrollments.length ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Completed courses</h2>
            <p className="text-sm text-muted-foreground">Finished courses stay in your archive so you can review them later.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {completedEnrollments.map((item) => <CompletedCourseCard key={item.id} item={item} />)}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Available courses</h2>
            <p className="text-sm text-muted-foreground">Published courses ready for learners.</p>
          </div>
          <label className="relative block w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
              placeholder="Search available courses..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        {filteredAvailable.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredAvailable.map((course) => <AvailableCourseCard key={course.id} course={course} />)}
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="space-y-3 p-8 text-center">
              <p className="font-medium">{availableCourses.length ? 'No course matches your search.' : 'No extra short courses are available right now.'}</p>
              <p className="text-sm text-muted-foreground">
                {availableCourses.length ? 'Try another word or clear the search.' : 'If a course was just published, refresh this page in a moment.'}
              </p>
              {query ? <Button variant="outline" onClick={() => setQuery('')}>Clear search</Button> : <Button asChild variant="outline"><Link href="/short-courses">Open public catalogue</Link></Button>}
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}

function EnrolledCourseCard({ item }: { item: ShortCourseEnrollmentSummary }) {
  const course = item.course!;
  const progress = Math.max(0, Math.min(100, Number(item.progress ?? 0)));

  return (
    <Card className="flex h-full flex-col rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl">{course.title}</CardTitle>
        <CardDescription className="line-clamp-3">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span>Progress</span><strong>{progress}%</strong></div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-1">Access: {item.entryFeePaid ? 'Active' : 'Pending'}</span>
          <span className="rounded-full bg-muted px-2 py-1">Status: {item.status}</span>
          <span className="rounded-full bg-muted px-2 py-1">Score: {item.examScore ?? '-'}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/student/courses/${course.id}`}>Open course <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function CompletedCourseCard({ item }: { item: ShortCourseEnrollmentSummary }) {
  const course = item.course!;

  return (
    <Card className="flex h-full flex-col rounded-2xl border-emerald-200 bg-emerald-50/40">
      <CardHeader>
        <CardTitle className="text-xl">{course.title}</CardTitle>
        <CardDescription className="line-clamp-3">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-background px-2 py-1">Completed</span>
          <span className="rounded-full bg-background px-2 py-1">Score: {item.examScore ?? '-'}</span>
          <span className="rounded-full bg-background px-2 py-1">Certificate: {item.certificateIssuedAt ? 'Issued' : item.certificateFeePaid ? 'Ready' : 'Locked'}</span>
        </div>
        <p className="text-sm text-muted-foreground">You can open the course hub to review lessons, or start a fresh course from the catalogue.</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="w-full"><Link href={`/student/courses/${course.id}`}>Review course</Link></Button>
        <Button asChild variant="outline" className="w-full"><Link href="/short-courses">Start new course</Link></Button>
      </CardFooter>
    </Card>
  );
}

function isCompletedEnrollment(item: ShortCourseEnrollmentSummary) {
  return Boolean(item.completedAt) || item.status === 'completed' || Number(item.progress ?? 0) >= 100;
}

function AvailableCourseCard({ course }: { course: PublicShortCourse }) {
  return (
    <Card className="flex h-full flex-col rounded-2xl">
      <CardHeader>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-1 capitalize">{course.level ?? 'beginner'}</span>
          <span className="rounded-full bg-muted px-2 py-1">{course.durationHours ?? 0} hours</span>
        </div>
        <CardTitle className="text-xl">{course.title}</CardTitle>
        <CardDescription className="line-clamp-3">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 text-sm text-muted-foreground">
        <p className="flex items-start gap-2"><CreditCard className="mt-0.5 h-4 w-4 text-primary" />{formatMoney(course.price, course.currency || 'ZMW')}</p>
        <p className="flex items-start gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />Certificate path included when eligible.</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="outline" className="w-full"><Link href={`/short-courses/${course.id}`}>View details</Link></Button>
        <Button asChild className="w-full"><Link href={`/student/courses/${course.id}`}>Start</Link></Button>
      </CardFooter>
    </Card>
  );
}
