'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/student/page-header';
import { StatCard } from '@/components/student/stat-card';
import { EmptyState } from '@/components/student/empty-state';
import { getStudentAssignments } from '@/lib/api';
import type { StudentAssignment } from '@/lib/api/types';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAssignments() {
      try {
        const data = await getStudentAssignments();
        if (!isMounted) return;
        setAssignments(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Failed to load student assignments', err);
        if (isMounted) {
          setAssignments([]);
          setError('Live assignment data is unavailable. Please refresh or check the backend session.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAssignments();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const submittedCount = assignments.filter((item) => item.submissionStatus && item.submissionStatus !== 'not_submitted').length;
    const gradedCount = assignments.filter((item) => item.submissionStatus === 'graded').length;
    const overdueCount = assignments.filter((item) => item.dueDate && new Date(item.dueDate) < now && item.submissionStatus === 'not_submitted').length;

    return { submittedCount, gradedCount, overdueCount };
  }, [assignments]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Assignments"
        description="Track submissions, deadlines, and lecturer feedback."
        actions={
          <Button variant="outline" asChild>
            <Link href="/student/assignments/calendar">View Calendar</Link>
          </Button>
        }
      />

      {error ? (
        <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30">
          <CardContent className="p-4 text-sm text-amber-900 dark:text-amber-200">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total" value={loading ? 'Loading...' : `${assignments.length}`} helper="Published assignments" />
        <StatCard title="Submitted" value={loading ? 'Loading...' : `${stats.submittedCount}`} helper="Awaiting review" />
        <StatCard title="Graded" value={loading ? 'Loading...' : `${stats.gradedCount}`} helper="Feedback available" />
        <StatCard title="Overdue" value={loading ? 'Loading...' : `${stats.overdueCount}`} helper="Needs attention" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/student/assignments/submissions">My Submissions</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/student/assignments/calendar">Assignment Calendar</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <EmptyState title="Loading assignments" description="Please wait while your assignment list loads." />
        ) : assignments.length === 0 ? (
          <EmptyState
            title="No assignments yet"
            description="Assignments will appear once lecturers publish them."
          />
        ) : (
          assignments.map((assignment) => {
            const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
            const dueLabel = dueDate ? dueDate.toLocaleDateString() : 'No due date';
            const status = assignment.submissionStatus ?? 'not_submitted';
            const badgeLabel = status === 'graded' ? 'Graded' : status === 'submitted' ? 'Submitted' : 'Pending';
            return (
              <Link key={assignment.id} href={`/student/assignments/${assignment.id}`}>
                <Card className="transition-all hover:border-primary/60">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{assignment.title}</CardTitle>
                      <CardDescription>
                        {assignment.moduleTitle ? `${assignment.moduleTitle} · ` : ''}
                        Due {dueLabel}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{assignment.assignmentType}</Badge>
                      <Badge variant={status === 'graded' ? 'default' : status === 'submitted' ? 'outline' : 'secondary'}>
                        {badgeLabel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {assignment.description}
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
