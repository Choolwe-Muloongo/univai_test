import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, RefreshCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export default function AdminReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Monitor performance across programs and cohorts with clear next actions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select defaultValue="30d">
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Export CSV</Button>
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
