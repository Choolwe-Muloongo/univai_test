'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Briefcase } from 'lucide-react';
import { getJobById } from '@/lib/api';
import type { Job } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { readRouteParam } from '@/lib/route-params';

export default function JobDetailPage() {
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
        console.error('Failed to load job detail', err);
        if (isMounted) {
          setJob(null);
          setError('Job details are unavailable. Please refresh and try again.');
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
    return <PageLoading message="Loading job details..." />;
  }

  if (error) {
    return <PageError message={error} actionHref="/student/jobs" actionLabel="Back to Jobs" />;
  }

  if (!job) {
    return (
      <PageError
        title="Job not found"
        message="This job listing is unavailable or has been removed."
        actionHref="/student/jobs"
        actionLabel="Back to Jobs"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="outline" asChild>
          <Link href="/student/jobs">Back to Jobs</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl">{job.title}</CardTitle>
              <Badge variant={job.type === 'Internship' ? 'secondary' : 'default'}>
                {job.type}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm">
                <Briefcase className="h-4 w-4" /> {job.company}
              </span>
              <span className="flex items-center gap-1 text-sm">
                <MapPin className="h-4 w-4" /> {job.location}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Role Overview</h3>
              <p>{job.description || 'Role details will appear once the employer publishes the full brief.'}</p>
            </section>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Ready to Apply?</CardTitle>
            <CardDescription>Submit your profile and portfolio for review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" asChild>
              <Link href={`/student/jobs/${job.id}/apply`}>Apply Now</Link>
            </Button>
            <Button variant="outline" className="w-full">Save for Later</Button>
            <p className="text-xs text-muted-foreground">
              Hiring teams respond within 5-7 business days.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
