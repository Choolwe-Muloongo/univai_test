'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PageHeader } from '@/components/student/page-header';
import { EmptyState } from '@/components/student/empty-state';
import { getStudentAssignmentSubmissions } from '@/lib/api';
import type { StudentAssignmentSubmission } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function AssignmentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<StudentAssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSubmissions() {
      try {
        const nextSubmissions = await getStudentAssignmentSubmissions();
        if (!isMounted) return;
        setSubmissions(nextSubmissions);
        setError(null);
      } catch (err) {
        console.error('Failed to load assignment submissions', err);
        if (isMounted) {
          setSubmissions([]);
          setError('Your assignment submissions are unavailable. Please refresh and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSubmissions();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Submissions"
        description="Review what you have submitted and track feedback."
        actions={
          <Button variant="outline" asChild>
            <Link href="/student/assignments">Browse assignments</Link>
          </Button>
        }
      />

      {loading ? <PageLoading message="Loading your submissions..." /> : null}
      {error ? (
        <PageError message={error} actionHref="/student/assignments" actionLabel="Browse Assignments" />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Submission Log</CardTitle>
          <CardDescription>All recent uploads and feedback.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loading && !error && submissions.length === 0 ? (
            <EmptyState
              title="No submissions yet"
              description="Upload your first assignment to see it here."
              action={
                <Button variant="outline" asChild>
                  <Link href="/student/assignments">Browse Assignments</Link>
                </Button>
              }
            />
          ) : (
            submissions.map((submission) => (
              <div key={submission.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{submission.assignmentTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.moduleTitle ?? 'Module'} - {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Draft'}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Status: <span className="font-semibold text-foreground">{submission.status}</span>
                  </div>
                </div>
                {submission.feedback && (
                  <div className="mt-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">Feedback</p>
                    <p>{submission.feedback}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
