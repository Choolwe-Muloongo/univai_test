'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getJobById } from '@/lib/api';
import type { Job } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { readRouteParam } from '@/lib/route-params';

export default function EmployerJobApplicantsPage() {
  const params = useParams();
  const id = readRouteParam(params, 'id');
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadJob() {
      if (!id) {
        setLoading(false);
        setError('Job route is missing an id.');
        return;
      }

      try {
        const nextJob = await getJobById(id);
        if (!isMounted) return;
        setJob(nextJob);
        setError(null);
      } catch (err) {
        console.error('Failed to load employer job applicants', err);
        if (isMounted) {
          setJob(null);
          setError('Applicant data is unavailable. Please refresh and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadJob();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <PageLoading message="Loading applicant pipeline..." />;
  }

  if (error) {
    return <PageError message={error} actionHref="/employer/jobs" actionLabel="Back to Jobs" />;
  }

  if (!job) {
    return (
      <PageError
        title="Job not found"
        message="This job listing is unavailable or has been removed."
        actionHref="/employer/jobs"
        actionLabel="Back to Jobs"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applicants</h1>
          <p className="text-muted-foreground">{job.title}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/employer/jobs/${job.id}`}>Back to Listing</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Pipeline</CardTitle>
          <CardDescription>Review and move applicants through each stage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No applicants yet. Candidate profiles will appear here once applications arrive.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
