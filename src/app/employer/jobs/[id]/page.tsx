'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { getJobById } from '@/lib/api';
import type { Job } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { readRouteParam } from '@/lib/route-params';

export default function EmployerJobDetailPage() {
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
        console.error('Failed to load employer job detail', err);
        if (isMounted) {
          setJob(null);
          setError('Job listing details are unavailable. Please refresh and try again.');
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
    return <PageLoading message="Loading job listing..." />;
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
          <p className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" /> {job.location}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit Listing</Button>
          <Button>Pause Listing</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Listing Overview</CardTitle>
            <CardDescription>Manage the details students see on the job board.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={job.type === 'Internship' ? 'secondary' : 'default'}>{job.type}</Badge>
              <Badge variant="outline">Open</Badge>
            </div>
            <p>
              This listing is visible to all eligible students. Update the role description and requirements as needed.
            </p>
            <Button variant="outline" asChild>
              <Link href={`/employer/jobs/${job.id}/applicants`}>View Applicants</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Applicant Funnel</CardTitle>
            <CardDescription>Track progress for this role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Applicant funnel data will appear once applications are submitted.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
