'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getResearcherApplications } from '@/lib/api';
import type { ResearcherApplication } from '@/lib/api/types';

const statusBadge: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  submitted: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  under_review: 'outline',
};

export default function ResearcherApplicationsPage() {
  const [applications, setApplications] = useState<ResearcherApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getResearcherApplications();
      setApplications(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Researcher Applications</h1>
        <p className="text-muted-foreground">Review and onboard new researchers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>Newest submissions appear first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading applications...</p>
          ) : applications.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">No researcher applications yet</p>
              <p className="mt-1">Next action: share the researcher application link with prospective research partners.</p>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{app.fullName}</p>
                  <p className="text-sm text-muted-foreground">{app.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {app.institutionAffiliation ?? 'Institution'} · {app.researchArea ?? 'Research area'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusBadge[app.status] ?? 'outline'}>{app.status}</Badge>
                  <Button asChild>
                    <Link href={`/admin/researcher-applications/${app.id}`}>Review</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
