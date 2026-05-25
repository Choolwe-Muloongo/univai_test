'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, BookOpen, Clock3, GraduationCap, Layers3, Search, Sparkles, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { formatMoney, getPublicShortCourses, type PublicShortCourse } from '@/lib/api/short-courses';

export default function PublicShortCoursesPage() {
  const [courses, setCourses] = useState<PublicShortCourse[]>([]);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');
  const [pricing, setPricing] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getPublicShortCourses()
      .then((data) => { if (mounted) setCourses(data); })
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load short courses.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const levels = useMemo(() => ['all', ...Array.from(new Set(courses.map((course) => course.level ?? 'beginner')))], [courses]);
  const filtered = useMemo(() => courses.filter((course) => {
    const price = Number(course.price ?? 0);
    const haystack = `${course.title} ${course.description ?? ''} ${course.level ?? ''} ${(course.outcomes ?? []).join(' ')} ${(course.modules ?? []).map((module) => module.title).join(' ')}`.toLowerCase();
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
    const matchesLevel = level === 'all' || (course.level ?? 'beginner').toLowerCase() === level.toLowerCase();
    const matchesPricing = pricing === 'all' || (pricing === 'free' ? !price || price <= 0 : price > 0);
    return matchesQuery && matchesLevel && matchesPricing;
  }), [courses, level, pricing, query]);

  const featured = filtered[0] ?? courses[0] ?? null;
  const totalHours = useMemo(() => courses.reduce((sum, course) => sum + Number(course.durationHours ?? 0), 0), [courses]);
  const freeCount = useMemo(() => courses.filter((course) => Number(course.price ?? 0) <= 0).length, [courses]);

  if (loading) return <PageLoading message="Loading short courses..." />;
  if (error) return <PageError message={error} />;

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_36rem)]">
      <section className="mx-auto grid w-full max-w-7xl gap-6 px-3 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8 lg:py-10">
        <div className="overflow-hidden rounded-[2rem] border bg-background/90 p-5 shadow-sm backdrop-blur sm:p-8 md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            UnivAI public catalogue
          </div>
          <h1 className="mt-5 max-w-4xl break-words text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl">
            Learn practical skills before you commit to a full programme.
          </h1>
          <p className="mt-5 max-w-2xl break-words text-sm leading-6 text-muted-foreground sm:text-base md:text-lg">
            Browse short courses, compare levels, check prices, then jump into the student dashboard when you are ready to start learning.
          </p>
          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
            <Button asChild className="min-h-11 rounded-2xl px-5"><a href="#courses">Browse catalogue</a></Button>
            <Button variant="outline" asChild className="min-h-11 rounded-2xl px-5"><Link href="/register/short-courses">Create learner account</Link></Button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatCard icon={BookOpen} label="Published courses" value={String(courses.length)} />
            <StatCard icon={Clock3} label="Learning hours" value={`${totalHours}+`} />
            <StatCard icon={BadgeCheck} label="Free options" value={String(freeCount)} />
          </div>
        </div>

        <aside className="rounded-[2rem] border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Featured path</p>
              <h2 className="mt-1 text-xl font-bold">{featured?.title ?? 'Courses coming soon'}</h2>
            </div>
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Trophy className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 line-clamp-4 text-sm leading-6 text-muted-foreground">
            {featured?.description ?? 'When a short course is published, the best starting point will appear here.'}
          </p>
          {featured ? (
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-muted px-3 py-1 capitalize">{featured.level ?? 'beginner'}</span>
                <span className="rounded-full bg-muted px-3 py-1">{featured.durationHours ?? 0} hours</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">{formatMoney(featured.price, featured.currency || 'ZMW')}</span>
              </div>
              <Button asChild className="min-h-11 w-full rounded-2xl"><Link href={`/short-courses/${featured.id}`}>View featured course <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          ) : null}
        </aside>
      </section>

      <section id="courses" className="mx-auto w-full max-w-7xl space-y-5 px-3 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border bg-card/95 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="break-words text-xl font-bold sm:text-2xl">Find your next skill</h2>
              <p className="break-words text-sm text-muted-foreground">Search by title, outcome, module, skill, or level. Keep the decision simple; choose the course that solves today’s problem.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px_150px] lg:w-[700px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input className="min-h-11 w-full rounded-2xl border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary" placeholder="Search courses, skills, outcomes..." value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <select className="min-h-11 w-full rounded-2xl border bg-background px-3 text-sm capitalize outline-none transition focus:border-primary" value={level} onChange={(event) => setLevel(event.target.value)}>
                {levels.map((item) => <option key={item} value={item}>{item === 'all' ? 'All levels' : item}</option>)}
              </select>
              <select className="min-h-11 w-full rounded-2xl border bg-background px-3 text-sm outline-none transition focus:border-primary" value={pricing} onChange={(event) => setPricing(event.target.value)}>
                <option value="all">All prices</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => <PublicCourseCard key={course.id} course={course} />)}
          </div>
        ) : (
          <Card className="rounded-[2rem] border-dashed bg-background/80">
            <CardContent className="space-y-3 p-6 text-center sm:p-10">
              <BookOpen className="mx-auto h-10 w-10 text-primary" />
              <p className="font-medium">{courses.length ? 'No courses match those filters.' : 'No published short courses are available yet.'}</p>
              <p className="text-sm text-muted-foreground">{courses.length ? 'Clear the search or choose another level or price filter.' : 'When an admin publishes a course, it will appear here automatically.'}</p>
              {courses.length ? <Button variant="outline" onClick={() => { setQuery(''); setLevel('all'); setPricing('all'); }}>Clear filters</Button> : null}
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card/70 p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function PublicCourseCard({ course }: { course: PublicShortCourse }) {
  const outcomes = course.outcomes?.slice(0, 2) ?? [];
  const moduleCount = course.modules?.length ?? 0;
  const lessonCount = course.lessons?.length ?? 0;

  return (
    <Card className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[2rem] border-primary/10 bg-background/95 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
      <div className="h-2 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />
      <CardHeader className="min-w-0 space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1 capitalize">{course.level ?? 'beginner'}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">{course.durationHours ?? 0}h</span>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">{formatMoney(course.price, course.currency || 'ZMW')}</span>
        </div>
        <div>
          <CardTitle className="break-words text-lg leading-tight sm:text-xl">{course.title}</CardTitle>
          <CardDescription className="mt-2 line-clamp-3 break-words leading-6">{course.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 flex flex-1 flex-col gap-4 px-4 pb-4 sm:px-5">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="rounded-2xl border bg-muted/30 p-3">
            <Layers3 className="mb-2 h-4 w-4 text-primary" />
            {moduleCount} modules
          </div>
          <div className="rounded-2xl border bg-muted/30 p-3">
            <GraduationCap className="mb-2 h-4 w-4 text-primary" />
            {lessonCount} lessons
          </div>
        </div>

        {outcomes.length ? (
          <div className="space-y-2">
            {outcomes.map((outcome) => (
              <p key={outcome} className="line-clamp-2 rounded-2xl bg-primary/5 px-3 py-2 text-xs leading-5 text-muted-foreground">
                {outcome}
              </p>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-primary/5 px-3 py-2 text-xs leading-5 text-muted-foreground">Interactive lessons, missions, practice, and certificate path.</p>
        )}

        <div className="mt-auto grid gap-2">
          <Button asChild className="min-h-11 w-full rounded-2xl"><Link href={`/short-courses/${course.id}`}>View course details <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          <Button asChild variant="outline" className="min-h-11 w-full rounded-2xl"><Link href={`/student/courses/${course.id}`}>Start in dashboard</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}
