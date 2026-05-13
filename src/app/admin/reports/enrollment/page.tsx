'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApplications } from '@/lib/api';
import type { ApplicationSummary } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function EnrollmentReportsPage() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadApplications() {
      try {
        const nextApplications = await getApplications();
        if (!isMounted) return;
        setApplications(nextApplications);
        setError(null);
      } catch (err) {
        console.error('Failed to load enrollment report', err);
        if (isMounted) {
          setApplications([]);
          setError('Enrollment report data is unavailable. Please refresh or run diagnostics.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadApplications();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const submitted = applications.length;
    const offersIssued = applications.filter((app) => ['offer_sent', 'approved'].includes(app.status)).length;
    const accepted = applications.filter((app) => app.status === 'admitted').length;
    const enrolled = accepted;
    const followUps = applications.filter((app) => app.status === 'needs_info');

    return { accepted, enrolled, followUps, offersIssued, submitted };
  }, [applications]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enrollment Pipeline</h1>
          <p className="text-muted-foreground">Track applicant conversion from submission to enrollment.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/reports">Back to Reports</Link>
        </Button>
      </div>

      {loading ? <PageLoading message="Loading enrollment report..." /> : null}
      {error ? <PageError message={error} actionHref="/admin/system-health" actionLabel="Run Diagnostics" /> : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Applications Submitted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground">Total submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Offers Issued</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{stats.offersIssued}</div>
            <p className="text-xs text-muted-foreground">Offers sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground">Offer acceptances</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{stats.enrolled}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admissions Focus</CardTitle>
          <CardDescription>Areas that need follow-up by admissions staff.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {!loading && !error && applications.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4">
              <p className="font-semibold text-foreground">No applications submitted yet</p>
              <p className="mt-1">Next action: confirm admissions window and outreach plan.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/admissions">Open Admissions Ops</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/intakes">Review intake setup</Link>
                </Button>
              </div>
            </div>
          ) : stats.followUps.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4">
              <p className="font-semibold text-foreground">No pending document follow-ups</p>
              <p className="mt-1">Next action: move qualified applicants to offer issuance and monitor acceptance.</p>
              <div className="mt-3">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/admissions">Review all applications</Link>
                </Button>
              </div>
            </div>
          ) : (
            stats.followUps.map((app) => (
              <div key={app.id} className="rounded-lg border p-4">
                <p className="font-semibold">{app.fullName}</p>
                <p className="text-xs text-muted-foreground">{app.programId}</p>
                <p className="text-xs text-muted-foreground">Needs additional documents</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
