'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLecturerApplications } from '@/lib/api';
import type { LecturerApplication } from '@/lib/api/types';

const statusBadge: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  submitted: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  under_review: 'outline',
};

export default function LecturerApplicationsPage() {
  const [applications, setApplications] = useState<LecturerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getLecturerApplications();
      setApplications(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lecturer Applications</h1>
        <p className="text-muted-foreground">Review and onboard new lecturers.</p>
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
            <p className="text-sm text-muted-foreground">No lecturer applications yet.</p>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{app.fullName}</p>
                  <p className="text-sm text-muted-foreground">{app.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {app.department ?? 'Department'} · {app.specialization ?? 'Specialization'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusBadge[app.status] ?? 'outline'}>{app.status}</Badge>
                  <Button asChild>
                    <Link href={`/admin/lecturer-applications/${app.id}`}>Review</Link>
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
