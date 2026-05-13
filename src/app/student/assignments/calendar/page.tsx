'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';
import { getStudentAssignments } from '@/lib/api';
import type { StudentAssignment } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function AssignmentCalendarPage() {
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAssignments() {
      try {
        const nextAssignments = await getStudentAssignments();
        if (!isMounted) return;
        setAssignments(nextAssignments);
        setError(null);
      } catch (err) {
        console.error('Failed to load assignment calendar', err);
        if (isMounted) {
          setAssignments([]);
          setError('Assignment deadlines are unavailable. Please refresh and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAssignments();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });
  }, [assignments]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignment Calendar</h1>
        <p className="text-muted-foreground">Upcoming deadlines and key dates.</p>
      </div>

      {loading ? <PageLoading message="Loading assignment deadlines..." /> : null}
      {error ? (
        <PageError message={error} actionHref="/student/assignments" actionLabel="Back to Assignments" />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>Stay ahead of submissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loading && !error && sortedAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assignment deadlines have been scheduled yet.
            </p>
          ) : (
            sortedAssignments.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-1 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.moduleTitle ? `${item.moduleTitle} - ` : ''}
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{item.assignmentType}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
