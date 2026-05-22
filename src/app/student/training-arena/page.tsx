'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ClipboardCheck, Lock, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getMyShortCourses, type ShortCourseEnrollmentSummary } from '@/lib/api/short-courses';

export default function StudentTrainingArenaPage() {
  const [items, setItems] = useState<ShortCourseEnrollmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getMyShortCourses()
      .then((data) => { if (mounted) setItems(data.filter((item) => item.course)); })
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load Training Arena.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const activeItems = useMemo(() => items.filter((item) => item.entryFeePaid), [items]);

  if (loading) return <PageLoading message="Loading Training Arena..." />;
  if (error) return <PageError message={error} actionHref="/student/dashboard" actionLabel="Back to dashboard" />;

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Training Arena</p>
        <h1 className="text-3xl font-bold tracking-tight">Practice, revise, and prepare for Final Boss Exams</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Choose an enrolled Journey, train with practice questions, then enter the final exam when the course is ready.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Enrolled Journeys" value={items.length} icon={ClipboardCheck} />
        <Metric title="Arena Ready" value={activeItems.length} icon={Trophy} />
        <Metric title="Locked" value={Math.max(0, items.length - activeItems.length)} icon={Lock} />
      </div>

      {items.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((item) => {
            const course = item.course!;
            const locked = !item.entryFeePaid;
            return (
              <Card key={item.id} className="rounded-3xl">
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>Journey progress</span>
                      <strong>{item.progress ?? 0}%</strong>
                    </div>
                    <Progress value={item.progress ?? 0} className="h-3" />
                  </div>

                  {locked ? (
                    <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                      Access is locked. Enroll or complete payment before entering this Arena.
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild disabled={locked} className="gap-2">
                      <Link href={locked ? `/student/courses/${course.id}` : `/student/courses/${course.id}/practice`}>
                        Enter Practice <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                      <Link href={`/student/courses/${course.id}`}>Mission Control</Link>
                    </Button>
                    <Button asChild variant="outline" disabled={locked}>
                      <Link href={locked ? `/student/courses/${course.id}` : `/student/courses/${course.id}/exam`}>Final Exam</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="space-y-4 p-8 text-center">
            <p className="font-semibold">No enrolled Journeys yet.</p>
            <p className="text-sm text-muted-foreground">Enroll in a short course first, then return here to practice.</p>
            <Button asChild><Link href="/short-courses">Browse Short Courses</Link></Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: number; icon: typeof ClipboardCheck }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-primary" />
      </CardContent>
    </Card>
  );
}
