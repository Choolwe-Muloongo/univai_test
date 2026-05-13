'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Briefcase, Users, PlusCircle, ArrowRight, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { getEmployerDashboard } from '@/lib/api';

type EmployerDashboard = {
  stats: {
    activeJobs: { value: string | number; note?: string | null };
    activeResearch: { value: string | number; note?: string | null };
    totalApplicants: { value: string | number; note?: string | null };
  };
  postedJobs: Array<{ id: string | number; title: string; status: string; applicants: number }>;
  research: Array<{ id: string | number; title: string; field?: string | null; description?: string | null }>;
};

const fallbackDashboard: EmployerDashboard = {
  stats: {
    activeJobs: { value: 'Unavailable', note: 'Waiting for backend data' },
    activeResearch: { value: 'Unavailable', note: 'Waiting for backend data' },
    totalApplicants: { value: 'Unavailable', note: 'Waiting for backend data' },
  },
  postedJobs: [],
  research: [],
};

export default function EmployerDashboardPage() {
  const [dashboard, setDashboard] = useState<EmployerDashboard>(fallbackDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const data = await getEmployerDashboard();
        if (!isMounted) return;
        setDashboard({
          stats: data.stats ?? fallbackDashboard.stats,
          postedJobs: Array.isArray(data.postedJobs) ? data.postedJobs : [],
          research: Array.isArray(data.research) ? data.research : [],
        });
        setError(null);
      } catch (err) {
        console.error('Failed to load employer dashboard', err);
        if (isMounted) {
          setDashboard(fallbackDashboard);
          setError('Live employer dashboard data is unavailable. Please refresh or check the backend logs.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employer Dashboard</h1>
          <p className="text-muted-foreground">Manage your job postings and applicants.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/employer/research/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Post New Research
            </Link>
          </Button>
          <Button asChild>
            <Link href="/employer/jobs/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Post New Job
            </Link>
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30">
          <CardContent className="p-4 text-sm text-amber-900 dark:text-amber-200">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Job Listings</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.stats.activeJobs.value}</div>
            <p className="text-xs text-muted-foreground">{dashboard.stats.activeJobs.note ?? 'Live platform metric'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Research</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.stats.activeResearch.value}</div>
            <p className="text-xs text-muted-foreground">{dashboard.stats.activeResearch.note ?? 'Live platform metric'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.stats.totalApplicants.value}</div>
            <p className="text-xs text-muted-foreground">{dashboard.stats.totalApplicants.note ?? 'Live platform metric'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Job Postings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading job postings...</p>
            ) : dashboard.postedJobs.length > 0 ? (
              dashboard.postedJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription>Status: {job.status}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">{job.applicants} Applicants</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" asChild>
                      <Link href={`/employer/jobs/${job.id}/applicants`}>
                        View Applicants <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No job postings are available yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Research Postings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading research postings...</p>
            ) : dashboard.research.length > 0 ? (
              dashboard.research.map((opp) => (
                <Card key={opp.id}>
                  <CardHeader>
                    <CardTitle className="text-xl">{opp.title}</CardTitle>
                    <CardDescription>Field: {opp.field ?? 'General'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{opp.description ?? 'No description provided.'}</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" asChild>
                      <Link href={`/employer/research/${opp.id}`}>
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No research postings are available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
