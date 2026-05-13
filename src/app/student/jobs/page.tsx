'use client';

import { ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getJobs } from '@/lib/api';
import type { Job } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      try {
        const nextJobs = await getJobs();
        if (!isMounted) return;
        setJobs(nextJobs);
        setError(null);
      } catch (err) {
        console.error('Failed to load jobs', err);
        if (isMounted) {
          setJobs([]);
          setError('Job listings are unavailable. Please refresh and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job & Career Hub</h1>
        <p className="text-muted-foreground">
          Find your next opportunity. Internships and jobs from our network of employers.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/student/jobs/applications">My Applications</Link>
        </Button>
      </div>

      {loading ? <PageLoading message="Loading job listings..." /> : null}
      {error ? <PageError message={error} actionHref="/student/dashboard" actionLabel="Back to Dashboard" /> : null}

      {!loading && !error && jobs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No job listings are available yet.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle>{job.title}</CardTitle>
                <Badge variant={job.type === 'Internship' ? 'secondary' : 'default'}>
                  {job.type}
                </Badge>
              </div>
              <CardDescription>{job.company}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-1.5 h-4 w-4" />
                {job.location}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/student/jobs/${job.id}`}>
                  View Details <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
