'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Clock3, GraduationCap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { formatMoney, getPublicShortCourse, type PublicShortCourse } from '@/lib/api/short-courses';

export default function PublicShortCourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const [course, setCourse] = useState<PublicShortCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getPublicShortCourse(courseId)
      .then((data) => { if (mounted) setCourse(data); })
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load this short course.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [courseId]);

  if (loading) return <PageLoading message="Loading short course..." />;
  if (error) return <PageError message={error} actionHref="/short-courses" actionLabel="Back to catalogue" />;
  if (!course) return <PageError title="Course not found" message="This short course is unavailable." actionHref="/short-courses" actionLabel="Back to catalogue" />;

  const moduleCount = course.modules?.length ?? 0;
  const lessonCount = course.lessons?.length ?? 0;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Button asChild variant="ghost" className="gap-2"><Link href="/short-courses"><ArrowLeft className="size-4" /> Back to catalogue</Link></Button>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="rounded-3xl">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-3 py-1 capitalize">{course.level ?? 'beginner'}</span>
                <span className="rounded-full bg-muted px-3 py-1">{course.durationHours ?? 0} hours</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">{formatMoney(course.price, course.currency || 'ZMW')}</span>
              </div>
              <div>
                <CardTitle className="text-3xl sm:text-4xl">{course.title}</CardTitle>
                <CardDescription className="mt-3 text-base leading-7">{course.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {course.outcomes?.length ? (
                <section className="space-y-3">
                  <h2 className="text-xl font-semibold">What you will gain</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {course.outcomes.map((outcome) => <div key={outcome} className="rounded-2xl border bg-muted/20 p-4 text-sm">{outcome}</div>)}
                  </div>
                </section>
              ) : null}

              {course.modules?.length ? (
                <section className="space-y-3">
                  <h2 className="text-xl font-semibold">Modules</h2>
                  <div className="space-y-3">
                    {course.modules.map((module, index) => <div key={`${module.title}-${index}`} className="rounded-2xl border p-4"><p className="font-semibold">{index + 1}. {module.title}</p>{module.description ? <p className="mt-1 text-sm text-muted-foreground">{module.description}</p> : null}</div>)}
                  </div>
                </section>
              ) : null}
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card className="rounded-3xl border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>Start learning</CardTitle>
                <CardDescription>Create or open your learner dashboard to enrol.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Info icon={BookOpen} label="Lessons" value={String(lessonCount)} />
                <Info icon={GraduationCap} label="Modules" value={String(moduleCount)} />
                <Info icon={Clock3} label="Duration" value={`${course.durationHours ?? 0} hours`} />
                <Info icon={BadgeCheck} label="Certificate" value="Available when eligible" />
                <Button asChild className="w-full rounded-2xl"><Link href={`/student/courses/${course.id}`}>Start in dashboard <ArrowRight className="ml-2 size-4" /></Link></Button>
                <Button asChild variant="outline" className="w-full rounded-2xl"><Link href="/register/short-courses">Create learner account</Link></Button>
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border bg-background p-3 text-sm"><Icon className="size-4 text-primary" /><div><p className="font-medium">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></div>;
}
