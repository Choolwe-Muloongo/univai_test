'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Download, RefreshCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminDashboard } from '@/lib/api';
import { PageLoading } from '@/components/ui/page-feedback';

type MetricStatus = 'healthy' | 'stale' | 'missing' | 'anomaly';

type ReportMetric = {
  title: string;
  value: string;
  note: string;
  freshness: string;
  status: MetricStatus;
  ctaLabel: string;
  href: string;
};

const statusTone: Record<MetricStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  healthy: 'default',
  stale: 'secondary',
  missing: 'outline',
  anomaly: 'destructive',
};

const fallbackMetrics: ReportMetric[] = [
  {
    title: 'Total Revenue',
    value: 'Data unavailable',
    note: 'Finance feed is waiting for backend data.',
    freshness: 'Not synced yet',
    status: 'missing',
    ctaLabel: 'Open Finance Summary',
    href: '/admin/reports/finance',
  },
  {
    title: 'Active Students',
    value: 'Data unavailable',
    note: 'Enrollment feed is waiting for backend data.',
    freshness: 'Not synced yet',
    status: 'missing',
    ctaLabel: 'Open Enrollment Pipeline',
    href: '/admin/reports/enrollment',
  },
  {
    title: 'Completion Rate',
    value: 'Needs review',
    note: 'Academic performance should be reviewed after data sync.',
    freshness: 'Pending',
    status: 'anomaly',
    ctaLabel: 'Review Academic Performance',
    href: '/admin/reports/academics',
  },
  {
    title: 'Student NPS',
    value: 'Data sync required',
    note: 'Survey integration can be enabled later.',
    freshness: 'Pending',
    status: 'stale',
    ctaLabel: 'Open System Health',
    href: '/admin/system-health',
  },
];

export default function AdminReportsPage() {
  const [metrics, setMetrics] = useState<ReportMetric[]>(fallbackMetrics);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadMetrics() {
      try {
        const dashboard = await getAdminDashboard();
        if (!isMounted) return;

        const revenueMetric = dashboard.metrics?.find((metric) => metric.key === 'revenue');
        const studentMetric = dashboard.metrics?.find((metric) => metric.key === 'students');
        const courseMetric = dashboard.metrics?.find((metric) => metric.key === 'courses');
        const activityMetric = dashboard.metrics?.find((metric) => metric.key === 'activity');

        setMetrics([
          {
            title: 'Total Revenue',
            value: String(revenueMetric?.value ?? 'Data unavailable'),
            note: revenueMetric?.note ?? 'Finance metric from backend dashboard feed.',
            freshness: 'Live dashboard feed',
            status: revenueMetric ? 'healthy' : 'missing',
            ctaLabel: 'Open Finance Summary',
            href: '/admin/reports/finance',
          },
          {
            title: 'Active Students',
            value: String(studentMetric?.value ?? 'Data unavailable'),
            note: studentMetric?.note ?? 'Enrollment metric from backend dashboard feed.',
            freshness: 'Live dashboard feed',
            status: studentMetric ? 'healthy' : 'missing',
            ctaLabel: 'Open Enrollment Pipeline',
            href: '/admin/reports/enrollment',
          },
          {
            title: 'Courses',
            value: String(courseMetric?.value ?? 'Data unavailable'),
            note: courseMetric?.note ?? 'Academic catalog metric from backend dashboard feed.',
            freshness: 'Live dashboard feed',
            status: courseMetric ? 'healthy' : 'missing',
            ctaLabel: 'Review Academic Performance',
            href: '/admin/reports/academics',
          },
          {
            title: 'Activity',
            value: String(activityMetric?.value ?? 'Data unavailable'),
            note: activityMetric?.note ?? 'Operational activity metric from backend dashboard feed.',
            freshness: 'Live dashboard feed',
            status: activityMetric ? 'healthy' : 'stale',
            ctaLabel: 'Open System Health',
            href: '/admin/system-health',
          },
        ]);
        setUsingFallback(false);
      } catch (error) {
        console.error('Failed to load reports metrics', error);
        if (isMounted) {
          setMetrics(fallbackMetrics);
          setUsingFallback(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Monitor platform performance and jump into focused reports.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/admin/reports/finance">
              <Download className="h-4 w-4" />
              Finance weekly
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/admin/reports/enrollment">
              <Download className="h-4 w-4" />
              Admissions daily
            </Link>
          </Button>
        </div>
      </div>

      {loading ? <PageLoading message="Loading report metrics..." /> : null}

      {usingFallback && !loading ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="p-4 text-sm text-amber-900">
            Live report metrics are unavailable. The report navigation remains available while backend data is restored.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="space-y-3 pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Badge variant={statusTone[metric.status]}>{metric.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{metric.freshness}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.note}</p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href={metric.href}>{metric.ctaLabel}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Shortcuts</CardTitle>
          <CardDescription>Open focused dashboards and take direct action.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/reports/academics">Academic Performance</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/reports/enrollment">Enrollment Pipeline</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/reports/finance">Finance Summary</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/system-health">System Health</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Action Queue from Analytics
          </CardTitle>
          <CardDescription>Handle issues surfaced by reporting before they affect operations.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="font-semibold">Completion gap</p>
            <p className="mt-1 text-sm text-muted-foreground">Check academic performance trends and cohort progress.</p>
            <Button className="mt-3 w-full" size="sm" asChild>
              <Link href="/admin/reports/academics">Review cohorts <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">Data freshness</p>
            <p className="mt-1 text-sm text-muted-foreground">Run diagnostics if report data appears stale.</p>
            <Button className="mt-3 w-full" size="sm" variant="outline" asChild>
              <Link href="/admin/system-health">Run diagnostics <RefreshCcw className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">Revenue follow-up</p>
            <p className="mt-1 text-sm text-muted-foreground">Track tuition balances and finance exceptions.</p>
            <Button className="mt-3 w-full" size="sm" variant="outline" asChild>
              <Link href="/admin/reports/finance">Open finance actions</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
