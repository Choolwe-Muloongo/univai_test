'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, ClipboardList, FileText } from 'lucide-react';
import { getStudentDashboard } from '@/lib/api';
import type { StudentDashboardData } from '@/lib/api/types';

const fallbackDashboard: StudentDashboardData = {
  actions: [],
  deadlines: [],
};

export default function ProgramAssessmentsPage() {
  const [dashboard, setDashboard] = useState<StudentDashboardData>(fallbackDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAssessments() {
      try {
        const data = await getStudentDashboard();
        if (!isMounted) return;
        setDashboard({
          actions: Array.isArray(data.actions) ? data.actions : [],
          deadlines: Array.isArray(data.deadlines) ? data.deadlines : [],
          wallet: data.wallet,
        });
        setError(null);
      } catch (err) {
        console.error('Failed to load assessment data', err);
        if (isMounted) {
          setDashboard(fallbackDashboard);
          setError('Live assessment data is unavailable. Please refresh or check the backend session.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAssessments();

    return () => {
      isMounted = false;
    };
  }, []);

  const deadlines = dashboard.deadlines ?? [];
  const examDeadlines = useMemo(() => deadlines.filter((item) => item.type === 'Exam'), [deadlines]);
  const nextExam = examDeadlines[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
        <p className="text-muted-foreground">
          Track assignments, quizzes, and exams across your program.
        </p>
      </div>

      {error ? (
        <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30">
          <CardContent className="p-4 text-sm text-amber-900 dark:text-amber-200">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming</CardTitle>
            <CardDescription>Due this term</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? 'Loading...' : deadlines.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submitted</CardTitle>
            <CardDescription>Awaiting grading</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">0</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next Exam</CardTitle>
            <CardDescription>Exam window</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? 'Loading...' : nextExam?.date ?? 'TBD'}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Queue</CardTitle>
          <CardDescription>Prioritized by due date and status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading assessments...</p>
          ) : deadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assessments scheduled yet. Check back after your next lecture.
            </p>
          ) : (
            deadlines.map((item) => (
              <div key={item.id} className="flex items-start justify-between rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    {item.type === 'Exam' ? (
                      <FileText className="h-4 w-4 text-primary" />
                    ) : (
                      <ClipboardList className="h-4 w-4 text-primary" />
                    )}
                    <p className="font-semibold">{item.title}</p>
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarClock className="h-3 w-3" />
                    Due {item.date}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline">Scheduled</Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={item.type === 'Exam' ? '/student/exams' : '/student/assignments'}>
                      Open
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
