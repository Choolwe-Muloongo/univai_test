'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getJobById } from '@/lib/api';
import type { Job } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JobApplyForm } from '@/components/jobs/job-apply-form';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { readRouteParam } from '@/lib/route-params';

export default function JobApplyPage() {
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
        console.error('Failed to load admin job application', err);
        if (isMounted) {
          setJob(null);
          setError('Job application details are unavailable. Please refresh and try again.');
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
    return <PageLoading message="Loading job application..." />;
  }

  if (error) {
    return <PageError message={error} actionHref="/admin/jobs" actionLabel="Back to Jobs" />;
  }

  if (!job) {
    return (
      <PageError
        title="Job not found"
        message="This job listing is unavailable or has been removed."
        actionHref="/admin/jobs"
        actionLabel="Back to Jobs"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply for {job.title}</h1>
          <p className="text-muted-foreground">
            {job.company} - {job.location}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/jobs/${job.id}`}>Back to Job</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>Share your background and portfolio.</CardDescription>
          </CardHeader>
          <CardContent>
            <JobApplyForm jobId={job.id} />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Role Snapshot</CardTitle>
            <CardDescription>Confirm the opportunity details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Type</span>
              <Badge variant={job.type === 'Internship' ? 'secondary' : 'default'}>{job.type}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Location</span>
              <span>{job.location}</span>
            </div>
            <p>Applications reviewed within 5 business days.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
