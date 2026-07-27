'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookMarked, FlaskConical, Landmark } from 'lucide-react';
import { getResearcherDashboard } from '@/lib/api';

type ResearcherMetric = {
  key: string;
  label: string;
  value: string | number;
  note?: string | null;
};

type ResearcherProfile = {
  name?: string | null;
  email?: string | null;
  institutionAffiliation?: string | null;
  researchArea?: string | null;
  orcidId?: string | null;
};

export default function ResearcherDashboardPage() {
  const [metrics, setMetrics] = useState<ResearcherMetric[]>([]);
  const [profile, setProfile] = useState<ResearcherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const dashboard = await getResearcherDashboard();
        if (!isMounted) return;
        setMetrics(Array.isArray(dashboard.metrics) ? dashboard.metrics : []);
        setProfile(dashboard.profile ?? null);
        setError(null);
      } catch (err) {
        console.error('Failed to load researcher dashboard', err);
        if (isMounted) {
          setError('Live researcher dashboard data is unavailable. Please refresh or check the backend logs.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Research Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the UnivAI research portal.</p>
      </div>

      {error ? (
        <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30">
          <CardContent className="p-4 text-sm text-amber-900 dark:text-amber-200">{error}</CardContent>
        </Card>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading researcher dashboard data...</p>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => (
              <Card key={metric.key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                  <FlaskConical className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground">{metric.note ?? 'Live platform metric'}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Researcher Profile</CardTitle>
              <CardDescription>Details captured from your approved application.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-semibold">{profile?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-semibold">{profile?.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Institution / Affiliation</p>
                <p className="font-semibold">{profile?.institutionAffiliation ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Research Area</p>
                <p className="font-semibold">{profile?.researchArea ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ORCID iD</p>
                <p className="font-semibold">{profile?.orcidId ?? '—'}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><FlaskConical className="h-4 w-4 text-primary" /> Research Labs</CardTitle>
                <CardDescription>Manage the labs you lead or collaborate on.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/researcher/labs">Open Labs <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-4 w-4 text-primary" /> Grants</CardTitle>
                <CardDescription>Track funding applications and awards.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/researcher/grants">Open Grants <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><BookMarked className="h-4 w-4 text-primary" /> Publications</CardTitle>
                <CardDescription>Keep your research output portfolio current.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/researcher/publications">Open Publications <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
