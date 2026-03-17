import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  FileWarning,
  Gauge,
  Layers,
  RefreshCcw,
  ShieldAlert,
  TrendingUp,
  UserRoundCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type QueueItem = {
  key: string;
  label: string;
  priority: 'High' | 'Medium' | 'Low';
  sla: string;
  owner: string;
};

type DeadlineItem = {
  key: string;
  label: string;
  detail: string;
  state: 'upcoming' | 'warning' | 'overdue';
};

const queueItems: QueueItem[] = [
  { key: 'admissions', label: 'Admissions pending', priority: 'High', sla: '01h 12m', owner: 'Ops Team' },
  { key: 'routes', label: 'Route requests pending', priority: 'Medium', sla: '03h 48m', owner: 'Routing Desk' },
  {
    key: 'lecturers',
    label: 'Lecturer applications pending',
    priority: 'High',
    sla: '00h 37m',
    owner: 'Faculty Council',
  },
  {
    key: 'appeals',
    label: 'Appeals/disputes pending',
    priority: 'Medium',
    sla: '05h 05m',
    owner: 'Student Affairs',
  },
];

const deadlines: DeadlineItem[] = [
  { key: 'intake', label: 'Intake close dates', detail: 'Spring intake closes in 4 days', state: 'upcoming' },
  {
    key: 'policy',
    label: 'Policy publish windows',
    detail: 'Academic policy draft review due in 36 hours',
    state: 'warning',
  },
  {
    key: 'invoices',
    label: 'Unpaid invoice thresholds',
    detail: 'Collections crossed 75% warning threshold',
    state: 'warning',
  },
  {
    key: 'compliance',
    label: 'Compliance deadlines',
    detail: 'Accreditation evidence submission overdue by 1 day',
    state: 'overdue',
  },
];

const borderByState: Record<DeadlineItem['state'], string> = {
  upcoming: 'border-l-sky-500',
  warning: 'border-l-amber-500',
  overdue: 'border-l-red-500',
};

export default function AdminDashboardPage() {
  const activeIncidents = 3;
  const criticalDomains = ['Admissions API', 'Lecturer Verification', 'Payment Sync'];
  const dataFreshness = 'Updated 6 minutes ago';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Command Center</h1>

      <Card className="border-red-200 bg-red-50/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="h-5 w-5" />
                Critical Alerts
              </CardTitle>
              <CardDescription className="text-red-700/90">
                {activeIncidents} active incidents · Highest severity: P1 · Affected domains: {criticalDomains.join(', ')}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">Acknowledge</Button>
              <Button variant="outline">Assign owner</Button>
              <Button>Open incident</Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Decision Queues
            </CardTitle>
            <CardDescription>Priority work items requiring immediate administrative decisions.</CardDescription>
          </CardHeader>
          <CardContent>
            {queueItems.length > 0 ? (
              <div className="space-y-3">
                {queueItems.map((item) => (
                  <div key={item.key} className="rounded-lg border p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">
                          Priority: {item.priority} · SLA: {item.sla} · Owner: {item.owner}
                        </p>
                      </div>
                      <Button size="sm">Resolve</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-5">
                <p className="text-sm text-muted-foreground">No queue items are currently loaded.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm">Create queue item</Button>
                  <Button variant="outline" size="sm">
                    Import requests
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5" />
              Deadlines & Risk
            </CardTitle>
            <CardDescription>Operational deadlines and risk thresholds to watch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {deadlines.length > 0 ? (
              deadlines.map((item) => (
                <div key={item.key} className={`rounded-lg border border-l-4 p-3 ${borderByState[item.state]}`}>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-5">
                <p className="text-sm text-muted-foreground">No risk records found.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm">Create deadline</Button>
                  <Button variant="outline" size="sm">
                    Import policy calendar
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-dashed p-4">
              <p className="text-sm font-medium">Sync monitor</p>
              <p className="text-sm text-muted-foreground">Deadline feed failed in the last run.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Retry sync
                </Button>
                <Button size="sm">Escalate risk</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Health Snapshot
          </CardTitle>
          <CardDescription>Live performance indicators across admissions, faculty, and finance.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Admissions conversion</p>
            <p className="mt-1 text-2xl font-semibold">42.8%</p>
            <p className="mt-1 text-xs text-muted-foreground">+3.1% vs last cycle</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Lecturer coverage</p>
            <p className="mt-1 text-2xl font-semibold">87%</p>
            <p className="mt-1 text-xs text-muted-foreground">18 programs below target staffing</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Data freshness</p>
            <p className="mt-1 text-2xl font-semibold">{dataFreshness}</p>
            <p className="mt-1 text-xs text-muted-foreground">ETL monitor reports one delayed source.</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Finance collection trend</p>
            <p className="mt-1 text-2xl font-semibold">↗ +6.4%</p>
            <p className="mt-1 text-xs text-muted-foreground">Recovery track ahead of monthly baseline</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">No archived incidents imported</p>
              <p className="text-sm text-muted-foreground">Bring historical incidents in to improve escalation quality.</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin/reports">
                Import archive
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">Decision support assistant unavailable</p>
              <p className="text-sm text-muted-foreground">Escalate to platform engineering for recovery.</p>
            </div>
            <Button asChild>
              <Link href="/admin/management">
                Escalate now
                <AlertTriangle className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Button variant="outline" className="justify-start">
          <Clock3 className="mr-2 h-4 w-4" />
          Review SLA breaches
        </Button>
        <Button variant="outline" className="justify-start">
          <UserRoundCheck className="mr-2 h-4 w-4" />
          Rebalance queue ownership
        </Button>
        <Button variant="outline" className="justify-start">
          <TrendingUp className="mr-2 h-4 w-4" />
          Publish risk briefing
        </Button>
      </div>
    </div>
  );
}
