import Link from 'next/link';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, DatabaseZap, Download } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ArrowUpRight, RefreshCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAdminDashboard } from '@/lib/api';

type KpiCard = {
  name: string;
  value: string;
  trend: string;
  status: 'healthy' | 'warning';
  owner: string;
  team: string;
  source: string;
  detail: string;
};

type KpiDrillDown = {
  kpiName: string;
  tableHeaders: string[];
  rows: string[][];
};

type AnomalyState = {
  title: string;
  description: string;
  severity: 'warning' | 'critical';
  actionLabel: string;
  workflowHref: string;
};

const buildKpis = (revenueValue: string | null, revenueNote?: string | null): KpiCard[] => [
  {
    name: 'Total Revenue',
    value: revenueValue ?? 'Data unavailable',
    trend: revenueValue ? '+8.4% vs prior period' : 'Finance service unavailable',
    status: revenueValue ? 'healthy' : 'warning',
    owner: 'Priya Nair (Finance Ops Manager)',
    team: 'Finance Operations',
    source: 'Admin Dashboard API · /admin/dashboard',
    detail: revenueValue
      ? `Live figure from finance dashboard feed${revenueNote ? ` · ${revenueNote}` : ''}.`
      : 'Unable to load finance feed from dashboard API. Retry or escalate to Finance Operations.',
  },
  {
    name: 'Active Students',
    value: '12,486',
    trend: '+1.9% vs prior period',
    status: 'healthy',
    owner: 'Marcus Lee (Registrar Analytics Lead)',
    team: 'Registrar + Admissions',
    source: 'SIS Active Enrollment Snapshot · every 4 hours',
    detail: 'Headcount includes full-time and part-time learners.',
  },
  {
    name: 'Completion Rate',
    value: '68.1%',
    trend: '-3.7 pts vs prior period',
    status: 'warning',
    owner: 'Dr. Olivia Mensah (Academic Success Director)',
    team: 'Academic Success',
    source: 'LMS completion feed + SIS graduations · daily',
    detail: 'Below 70% target; concentrated in certificate cohorts.',
  },
  {
    name: 'Student NPS',
    value: 'Data unavailable',
    trend: 'Survey sync paused',
    status: 'warning',
    owner: 'Aarav Patel (Student Experience Manager)',
    team: 'Student Experience',
    source: 'Qualtrics survey export · pipeline degraded',
    detail: 'Most recent valid snapshot: 2026-02-14 05:20 UTC.',
  },
];

const drillDowns: KpiDrillDown[] = [
  {
    kpiName: 'Total Revenue',
    tableHeaders: ['School', 'Program', 'Intake', 'Recognized Revenue', 'Variance'],
    rows: [
      ['School of Business', 'MBA Weekend', 'Jan 2026', '$1,120,000', '+6.2%'],
      ['School of Computing', 'BSc Data Science', 'Sep 2025', '$986,400', '+9.1%'],
      ['School of Health', 'BSN Accelerated', 'Jan 2026', '$841,250', '-1.8%'],
    ],
  },
  {
    kpiName: 'Active Students',
    tableHeaders: ['School', 'Program', 'Intake', 'Active Students', 'Change'],
    rows: [
      ['School of Business', 'BBA', 'Sep 2025', '2,410', '+2.1%'],
      ['School of Computing', 'MSc AI', 'Jan 2026', '1,095', '+5.4%'],
      ['School of Health', 'MPH', 'Sep 2025', '1,384', '-0.7%'],
    ],
  },
  {
    kpiName: 'Completion Rate',
    tableHeaders: ['School', 'Program', 'Intake', 'Completion Rate', 'Target Gap'],
    rows: [
      ['School of Business', 'PGDM', 'Jan 2025', '73.4%', '+3.4 pts'],
      ['School of Computing', 'Certificate in Cloud', 'Sep 2025', '59.6%', '-10.4 pts'],
      ['School of Health', 'BSN Accelerated', 'Jan 2025', '71.1%', '+1.1 pts'],
    ],
  },
  {
    kpiName: 'Student NPS',
    tableHeaders: ['School', 'Program', 'Intake', 'NPS Score', 'Collection Status'],
    rows: [
      ['School of Business', 'MBA Weekend', 'Jan 2026', 'Data unavailable', 'Survey connector failed'],
      ['School of Computing', 'MSc AI', 'Jan 2026', 'Data unavailable', 'Retry scheduled 02:00 UTC'],
      ['School of Health', 'MPH', 'Sep 2025', '52', 'Last successful run'],
    ],
  },
];

const anomalyStates: AnomalyState[] = [
  {
    title: 'Metric dropped/rising unexpectedly',
    description:
      'Completion Rate fell 3.7 points while Active Students rose 1.9%. Cross-check cohort attendance and grading backlog for outlier terms.',
    severity: 'warning',
    actionLabel: 'What admin should do now: Start metric variance triage workflow',
    workflowHref: '/admin/workflows/metric-variance-triage',
  },
  {
    title: 'Stale data timestamp',
    description:
      'Student NPS snapshot is older than 7 days. Last successful timestamp: 2026-02-14 05:20 UTC; freshness SLA is 24 hours.',
    severity: 'warning',
    actionLabel: 'What admin should do now: Run stale-data escalation workflow',
    workflowHref: '/admin/workflows/stale-data-escalation',
  },
  {
    title: 'Data pipeline failed',
    description:
      'Qualtrics-to-warehouse ingestion job failed in three consecutive runs with API token refresh errors.',
    severity: 'critical',
    actionLabel: 'What admin should do now: Open pipeline incident response workflow',
    workflowHref: '/admin/workflows/pipeline-incident-response',
  },
];

const filterOptions = {
  dateRange: [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Last 12 months', value: '1y' },
  ],
  intake: [
    { label: 'All intakes', value: 'all' },
    { label: 'Jan 2026', value: 'jan-2026' },
    { label: 'Sep 2025', value: 'sep-2025' },
    { label: 'Jan 2025', value: 'jan-2025' },
  ],
  school: [
    { label: 'All schools', value: 'all' },
    { label: 'School of Business', value: 'business' },
    { label: 'School of Computing', value: 'computing' },
    { label: 'School of Health', value: 'health' },
  ],
  program: [
    { label: 'All programs', value: 'all' },
    { label: 'MBA Weekend', value: 'mba-weekend' },
    { label: 'MSc AI', value: 'msc-ai' },
    { label: 'BSN Accelerated', value: 'bsn-accelerated' },
  ],
};

export default async function AdminReportsPage() {
  const dashboard = await getAdminDashboard().catch(() => null);
  const revenueMetric = dashboard?.metrics.find((metric) => metric.key === 'revenue');
  const topKpis = buildKpis(revenueMetric?.value ?? null, revenueMetric?.note);

type MetricStatus = 'healthy' | 'stale' | 'missing' | 'anomaly';

const statusTone: Record<MetricStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  healthy: 'default',
  stale: 'secondary',
  missing: 'outline',
  anomaly: 'destructive',
};

const metrics: Array<{
  title: string;
  value: string;
  note: string;
  freshness: string;
  status: MetricStatus;
  ctaLabel: string;
  href: string;
}> = [
  {
    title: 'Total Revenue',
    value: '$128,400',
    note: 'Collections this term',
    freshness: 'Updated 6m ago',
    status: 'healthy',
    ctaLabel: 'Open Finance Summary',
    href: '/admin/reports/finance',
  },
  {
    title: 'Active Students',
    value: '742',
    note: 'Enrolled and active this cycle',
    freshness: 'Updated 9m ago',
    status: 'healthy',
    ctaLabel: 'Open Enrollment Pipeline',
    href: '/admin/reports/enrollment',
  },
  {
    title: 'Completion Rate',
    value: '68%',
    note: 'Target is 70% (gap: 2%)',
    freshness: 'Updated 23m ago',
    status: 'anomaly',
    ctaLabel: 'Review Academic Performance',
    href: '/admin/reports/academics',
  },
  {
    title: 'Student NPS',
    value: 'Data sync required',
    note: 'Survey warehouse feed is stale',
    freshness: 'Last sync 27h ago',
    status: 'stale',
    ctaLabel: 'Open Data Follow-up',
    href: '/admin/system-health',
  },
];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Monitor performance across programs and cohorts with clear next actions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/admin/reports/export/finance-weekly">
              <Download className="h-4 w-4" />
              Export preset: Finance weekly
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/admin/reports/export/admissions-daily">
              <Download className="h-4 w-4" />
              Export preset: Admissions daily
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/admin/reports/export/compliance-monthly">
              <Download className="h-4 w-4" />
              Export preset: Compliance monthly
            </Link>
          </Button>
        </div>
      </div>

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

      <AdminActionPanel
        title="Reporting Action Panel"
        description="Optional templates for interpreting trend spikes before escalation."
        scenarios={['high_rejection_spike', 'unpaid_invoices_concentration']}
      />

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Action Queue from Analytics
          </CardTitle>
          <CardDescription>Handle issues surfaced by reporting before they impact operations.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="font-semibold">Completion gap</p>
            <p className="mt-1 text-sm text-muted-foreground">Completion is below target by 2%. Check curriculum pacing and assessments.</p>
            <Button className="mt-3 w-full" size="sm" asChild>
              <Link href="/admin/reports/academics">Review cohorts <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">NPS data stale</p>
            <p className="mt-1 text-sm text-muted-foreground">Survey feed is delayed. Re-run source diagnostics and confirm owner.</p>
            <Button className="mt-3 w-full" size="sm" variant="outline" asChild>
              <Link href="/admin/system-health">Run diagnostics <RefreshCcw className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">Revenue follow-up</p>
            <p className="mt-1 text-sm text-muted-foreground">Track overdue tuition balances and hand off high-risk accounts to finance.</p>
            <Button className="mt-3 w-full" size="sm" variant="outline" asChild>
              <Link href="/admin/reports/finance">Open finance actions</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
