'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical } from 'lucide-react';
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
        </>
      )}
    </div>
  );
}
