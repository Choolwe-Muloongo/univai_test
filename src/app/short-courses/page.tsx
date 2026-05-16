import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney, getPublicShortCourses } from '@/lib/api/short-courses';

export default async function PublicShortCoursesPage() {
  const courses = await getPublicShortCourses().catch(() => []);

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background p-8 shadow-sm md:p-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">UnivAI Short Courses</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">Learn practical skills without applying for a formal programme.</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Browse self-paced courses, enrol quickly, learn through interactive cards, and earn a certificate after completion.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild><Link href="#courses">Browse courses</Link></Button>
          <Button variant="outline" asChild><Link href="/student/short-courses">My short courses</Link></Button>
        </div>
      </section>

      <section id="courses" className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Available short courses</h2>
            <p className="text-sm text-muted-foreground">Choose a course, view the details, then enrol or continue learning.</p>
          </div>
        </div>

        {courses.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
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
                    <Button asChild variant="outline"><Link href={`/student/short-courses/${course.id}`}>Continue</Link></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-sm text-muted-foreground">No published short courses are available yet. Please check again soon.</CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
