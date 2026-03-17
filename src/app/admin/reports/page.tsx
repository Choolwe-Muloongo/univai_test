import Link from 'next/link';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, DatabaseZap, Download } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Monitor performance, diagnose failures, and take immediate action.</p>
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
        {topKpis.map((kpi) => {
          const isWarning = kpi.status === 'warning';

          return (
            <Card key={kpi.name}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
                  <Badge variant={isWarning ? 'destructive' : 'secondary'}>{isWarning ? 'Needs attention' : 'Healthy'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div
                  className={`flex items-center gap-1 text-xs ${
                    isWarning ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {isWarning ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                  <span>{kpi.trend}</span>
                </div>
                <p className="text-xs text-muted-foreground">{kpi.detail}</p>
                <div className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Owner:</span> {kpi.owner}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Team:</span> {kpi.team}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Source:</span> {kpi.source}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anomaly states</CardTitle>
          <CardDescription>System-detected anomalies with next-step workflows for administrators.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {anomalyStates.map((anomaly) => (
            <Alert key={anomaly.title} variant={anomaly.severity === 'critical' ? 'destructive' : 'default'}>
              {anomaly.severity === 'critical' ? (
                <DatabaseZap className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>{anomaly.title}</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{anomaly.description}</p>
                <Button size="sm" variant={anomaly.severity === 'critical' ? 'destructive' : 'outline'} asChild>
                  <Link href={anomaly.workflowHref}>{anomaly.actionLabel}</Link>
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KPI drill-down tables</CardTitle>
          <CardDescription>Each KPI includes scoped filters by date range, intake, school, and program.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {drillDowns.map((drillDown) => (
            <div key={drillDown.kpiName} className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-semibold">{drillDown.kpiName}</h3>
                <Badge variant="outline">Drill-down</Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Select defaultValue="30d">
                  <SelectTrigger>
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.dateRange.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Intake" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.intake.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="School" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.school.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.program.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    {drillDown.tableHeaders.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drillDown.rows.map((row, index) => (
                    <TableRow key={`${drillDown.kpiName}-${index}`}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={`${drillDown.kpiName}-${index}-${cellIndex}`}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report shortcuts</CardTitle>
          <CardDescription>Open focused dashboards for each reporting domain.</CardDescription>
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
    </div>
  );
}
