'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const filtered = useMemo(() => courses.filter((course) => {
    const matchesQuery = !query.trim() || `${course.title} ${course.description}`.toLowerCase().includes(query.toLowerCase());
    const matchesLevel = level === 'all' || (course.level ?? 'beginner').toLowerCase() === level;
    return matchesQuery && matchesLevel;
  }), [courses, level, query]);

  if (loading) return <PageLoading message="Loading short courses..." />;
  if (error) return <PageError message={error} />;

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background p-8 shadow-sm md:p-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">UnivAI Short Courses</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">Learn practical skills without applying for a formal programme.</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Browse self-paced courses, enrol quickly, learn through interactive cards, and earn a certificate after completion.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild><a href="#courses">Browse courses</a></Button>
          <Button variant="outline" asChild><Link href="/student/courses">My short courses</Link></Button>
        </div>
      </section>

      <section id="courses" className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Available short courses</h2>
            <p className="text-sm text-muted-foreground">Choose a course, view details, then enrol or continue learning.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="h-10 rounded-md border bg-background px-3 text-sm" placeholder="Search courses..." value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={level} onChange={(event) => setLevel(event.target.value)}>
              <option value="all">All levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {filtered.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => (
              <Card key={course.id} className="flex flex-col rounded-2xl">
                <CardHeader>
                  <div className="mb-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-1 capitalize">{course.level ?? 'beginner'}</span>
                    <span className="rounded-full bg-muted px-2 py-1">{course.durationHours ?? 0}h</span>
                    <span className="rounded-full bg-muted px-2 py-1">{formatMoney(course.price, course.currency || 'ZMW')}</span>
                  </div>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="line-clamp-4 text-sm text-muted-foreground">{course.description}</p>
                  <div className="mt-auto flex gap-2">
                    <Button asChild className="flex-1"><Link href={`/short-courses/${course.id}`}>View course</Link></Button>
                    <Button asChild variant="outline"><Link href={`/student/courses/${course.id}`}>Continue</Link></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="space-y-3 p-8 text-center">
              <p className="font-medium">{courses.length ? 'No courses match those filters.' : 'No published short courses are available yet.'}</p>
              <p className="text-sm text-muted-foreground">
                {courses.length ? 'Clear the search or choose another level.' : 'When an admin publishes a course, it will appear here automatically.'}
              </p>
              {courses.length ? <Button variant="outline" onClick={() => { setQuery(''); setLevel('all'); }}>Clear filters</Button> : null}
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
