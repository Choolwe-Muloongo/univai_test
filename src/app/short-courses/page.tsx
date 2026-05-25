'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { formatMoney, getPublicShortCourses, type PublicShortCourse } from '@/lib/api/short-courses';

export default function PublicShortCoursesPage() {
  const [courses, setCourses] = useState<PublicShortCourse[]>([]);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');
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
    const haystack = `${course.title} ${course.description ?? ''} ${course.level ?? ''} ${(course.outcomes ?? []).join(' ')}`.toLowerCase();
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
    const matchesLevel = level === 'all' || (course.level ?? 'beginner').toLowerCase() === level.toLowerCase();
    return matchesQuery && matchesLevel;
  }), [courses, level, query]);

  if (loading) return <PageLoading message="Loading short courses..." />;
  if (error) return <PageError message={error} />;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 overflow-hidden px-3 py-5 sm:px-6 lg:px-8 lg:py-10">
      <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background p-5 shadow-sm sm:p-8 md:p-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary sm:text-sm">UnivAI Short Courses</p>
        <h1 className="mt-3 max-w-3xl break-words text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Browse practical short courses before joining UnivAI.</h1>
        <p className="mt-4 max-w-2xl break-words text-sm leading-6 text-muted-foreground sm:text-base">Find a course, view the details, then sign in or continue inside the student dashboard to pay and start your Journey.</p>
        <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
          <Button asChild className="min-h-11"><a href="#courses">Browse courses</a></Button>
          <Button variant="outline" asChild className="min-h-11"><Link href="/student/courses">Student dashboard</Link></Button>
        </div>
      </section>

      <section id="courses" className="space-y-5">
        <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="break-words text-xl font-bold sm:text-2xl">Browse catalogue</h2>
              <p className="break-words text-sm text-muted-foreground">Search by title, skill, topic, or level. Payment and learning happen in the student dashboard.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px] lg:w-[560px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input className="min-h-11 w-full rounded-2xl border bg-background pl-9 pr-3 text-sm" placeholder="Search courses..." value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <select className="min-h-11 w-full rounded-2xl border bg-background px-3 text-sm capitalize" value={level} onChange={(event) => setLevel(event.target.value)}>
                {levels.map((item) => <option key={item} value={item}>{item === 'all' ? 'All levels' : item}</option>)}
              </select>
            </div>
          </div>
        </div>

        {filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => <PublicCourseCard key={course.id} course={course} />)}
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="space-y-3 p-6 text-center sm:p-8">
              <BookOpen className="mx-auto h-9 w-9 text-primary" />
              <p className="font-medium">{courses.length ? 'No courses match those filters.' : 'No published short courses are available yet.'}</p>
              <p className="text-sm text-muted-foreground">{courses.length ? 'Clear the search or choose another level.' : 'When an admin publishes a course, it will appear here automatically.'}</p>
              {courses.length ? <Button variant="outline" onClick={() => { setQuery(''); setLevel('all'); }}>Clear filters</Button> : null}
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}

function PublicCourseCard({ course }: { course: PublicShortCourse }) {
  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border-primary/10 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="min-w-0 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-1 capitalize">{course.level ?? 'beginner'}</span>
          <span className="rounded-full bg-muted px-2 py-1">{course.durationHours ?? 0}h</span>
          <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{formatMoney(course.price, course.currency || 'ZMW')}</span>
        </div>
        <CardTitle className="break-words text-lg sm:text-xl">{course.title}</CardTitle>
        <CardDescription className="line-clamp-3 break-words">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 flex flex-1 flex-col gap-4 px-4 pb-4 sm:px-5">
        <p className="text-sm text-muted-foreground">Interactive lessons, missions, practice, and certificate path.</p>
        <div className="mt-auto grid gap-2">
          <Button asChild className="min-h-11 w-full"><Link href={`/short-courses/${course.id}`}>View course details <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          <Button asChild variant="outline" className="min-h-11 w-full"><Link href={`/student/courses/${course.id}`}>Start this course in dashboard</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}
