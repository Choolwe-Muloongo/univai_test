'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getProgram } from '@/lib/api';
import type { Program } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function ExamsPage() {
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProgram() {
      try {
        const nextProgram = await getProgram();
        if (!isMounted) return;
        setProgram(nextProgram);
        setError(null);
      } catch (err) {
        console.error('Failed to load exams', err);
        if (isMounted) {
          setProgram(null);
          setError('Exam data is unavailable. Please refresh or check that your account has programme access.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProgram();

    return () => {
      isMounted = false;
    };
  }, []);

  const { courseExams, semesterExams } = useMemo(() => {
    const modules = program?.modules ?? [];
    const semesters = Array.from(new Set(modules.map((module) => module.semester))).sort((a, b) => a - b);

    const semesterExams = semesters.map((semester) => {
      const semesterModules = modules.filter((module) => module.semester === semester);
      const totalProgress = semesterModules.reduce((sum, module) => sum + (module.progress ?? 0), 0);
      const avgProgress = semesterModules.length ? totalProgress / semesterModules.length : 0;
      return {
        id: `semester-${semester}`,
        title: `Semester ${semester} Exam`,
        status: avgProgress >= 70 ? 'Eligible' : 'In Progress',
        href: `/student/program/semester/${semester}/exam`,
        note: semesterModules.length ? `${semesterModules.length} modules` : 'TBD',
      };
    });

    const courseExams = modules.map((module) => ({
      id: module.id,
      title: `${module.title} Exam`,
      status: (module.progress ?? 0) >= 70 ? 'Eligible' : 'Locked',
      href: `/student/courses/${module.id}/exam`,
      note: `Semester ${module.semester}`,
    }));

    return { courseExams, semesterExams };
  }, [program]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
        <p className="text-muted-foreground">Check eligibility and schedule your exams.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/student/exams/bookings">Exam Bookings</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/student/exams/history">Exam History</Link>
        </Button>
      </div>

      {loading ? <PageLoading message="Loading exam data..." /> : null}
      {error ? <PageError message={error} actionHref="/student/program" actionLabel="Back to Program" /> : null}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Semester Exams</CardTitle>
            <CardDescription>Complete your semester assessments before graduation clearance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!loading && !error && semesterExams.length === 0 ? (
              <p className="text-sm text-muted-foreground">Semester exams will appear once your program is published.</p>
            ) : (
              semesterExams.map((exam) => (
                <Link key={exam.id} href={exam.href}>
                  <Card className="transition-all hover:border-primary/60">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>{exam.title}</CardTitle>
                        <CardDescription>{exam.note}</CardDescription>
                      </div>
                      <Badge variant={exam.status === 'Eligible' ? 'default' : 'secondary'}>{exam.status}</Badge>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">Review requirements and start when ready.</CardContent>
                  </Card>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Exams</CardTitle>
            <CardDescription>Module-based exams unlock as you progress through lessons.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!loading && !error && courseExams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No course exams available yet.</p>
            ) : (
              courseExams.map((exam) => (
                <Link key={exam.id} href={exam.href}>
                  <Card className="transition-all hover:border-primary/60">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>{exam.title}</CardTitle>
                        <CardDescription>{exam.note}</CardDescription>
                      </div>
                      <Badge variant={exam.status === 'Eligible' ? 'default' : 'secondary'}>{exam.status}</Badge>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">Open for details.</CardContent>
                  </Card>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
