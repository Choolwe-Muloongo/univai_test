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
import { ArrowRight, BookOpen, Briefcase, ClipboardCheck, DollarSign, Activity, LayoutGrid, ShieldCheck, Settings, Users, Workflow } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminDashboard } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type RiskLevel = 'High' | 'Medium' | 'Low';

type LandingCard = {
  title: string;
  count?: number;
  risk: RiskLevel;
  owner: string;
  href: string;
  nextAction: string;
};

type LandingBlock = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  cards: LandingCard[];
  actions?: { label: string; href: string }[];
};

const EMPTY_DASHBOARD = { metrics: [] } as const;

const riskStyles: Record<RiskLevel, string> = {
  High: 'bg-red-500/10 text-red-700 dark:text-red-300',
  Medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
};

const adminActionGroups = [
  {
    title: 'Curriculum Lifecycle',
    description: 'Build, map, and quality-check curriculum before each intake goes live.',
    actions: [
      { label: 'Curriculum Builder', href: '/admin/curriculum' },
      { label: 'Intake Mapping', href: '/admin/intakes' },
      { label: 'Curriculum Ops', href: '/admin/curriculum-ops' },
      { label: 'DCE1 Blueprint', href: '/admin/curriculum-blueprint' },
      { label: 'Academic Policies', href: '/admin/policies' },
    ],
  },
  {
    title: 'People & Delivery',
    description: 'Assign lecturers and monitor admissions and route requests.',
    actions: [
      { label: 'Lecturer Assignments', href: '/admin/assignments' },
      { label: 'Lecturer Applications', href: '/admin/lecturer-applications' },
      { label: 'Admissions', href: '/admin/admissions' },
      { label: 'Route Requests', href: '/admin/route-requests' },
    ],
  },
  {
    title: 'Governance & Operations',
    description: 'Track compliance, diagnostics, reports, and platform changes.',
    actions: [
      { label: 'Audit Logs', href: '/admin/audit' },
      { label: 'Reports', href: '/admin/reports' },
      { label: 'System Health', href: '/admin/system-health' },
      { label: 'Content Management', href: '/admin/management' },
    ],
  },
];

const priorityShortcuts = [
  {
    title: 'Curriculum Operations',
    description: 'Review version publication status, intake mappings, and delivery readiness checks.',
    href: '/admin/curriculum-ops',
    icon: Workflow,
  },
  {
    title: 'Admissions Queue',
    description: 'Review current admissions and push pending decisions quickly.',
    href: '/admin/admissions',
    icon: ClipboardCheck,
  },
  {
    title: 'System Governance',
    description: 'Jump to audit and diagnostics for quality control and compliance checks.',
    href: '/admin/system-health',
    icon: ShieldCheck,
  },
  {
    title: 'DCE1 Blueprint',
    description: 'Open the full Year 1 Diploma Civil Engineering semester-split implementation example.',
    href: '/admin/curriculum-blueprint',
    icon: BookOpen,
  }
];

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboard().catch(() => EMPTY_DASHBOARD);
  const metricsByKey = new Map(dashboard.metrics.map((metric) => [metric.key, metric.value]));
  const isUsingFallbackData = dashboard.metrics.length === 0;

  const blocks: LandingBlock[] = [
    {
      title: 'Critical Alerts',
      description: 'Immediate operational risks requiring assignment and acknowledgement.',
      icon: AlertTriangle,
      actions: [
        { label: 'Acknowledge', href: '/admin/system-health' },
        { label: 'Assign owner', href: '/admin/management' },
      ],
      cards: [
        {
          title: 'System incidents',
          count: Number(metricsByKey.get('activity')) || undefined,
          risk: 'High',
          owner: 'Platform Ops',
          href: '/admin/system-health',
          nextAction: 'Review unresolved incidents and mark impacted services.',
        },
        {
          title: 'Compliance risks',
          count: undefined,
          risk: 'High',
          owner: 'Compliance Lead',
          href: '/admin/policies',
          nextAction: 'Run policy exception audit and assign remediation owners.',
        },
        {
          title: 'Payment failures',
          count: Number(metricsByKey.get('revenue')) || undefined,
          risk: 'Medium',
          owner: 'Finance Ops',
          href: '/admin/reports/finance',
          nextAction: 'Reconcile failed settlements and trigger payer follow-up.',
        },
      ],
    },
    {
      title: 'Decision Queues',
      description: 'Items blocked on admin decisions across admissions and delivery.',
      icon: ClipboardList,
      cards: [
        {
          title: 'Admissions pending review',
          count: Number(metricsByKey.get('students')) || undefined,
          risk: 'High',
          owner: 'Admissions Team',
          href: '/admin/admissions',
          nextAction: 'Prioritize candidates awaiting final verification.',
        },
        {
          title: 'Route changes pending decision',
          count: undefined,
          risk: 'Medium',
          owner: 'Program Director',
          href: '/admin/route-requests',
          nextAction: 'Approve or decline route change requests before cutoff.',
        },
        {
          title: 'Lecturer approvals pending',
          count: Number(metricsByKey.get('courses')) || undefined,
          risk: 'Medium',
          owner: 'Academic Affairs',
          href: '/admin/lecturer-applications',
          nextAction: 'Complete credential checks and publish onboarding decisions.',
        },
        {
          title: 'Appeals/disputes pending',
          count: undefined,
          risk: 'High',
          owner: 'Student Success',
          href: '/admin/reports/academics',
          nextAction: 'Triaged unresolved disputes and route to adjudication panel.',
        },
      ],
    },
    {
      title: 'Deadlines & SLA',
      description: 'Time-sensitive milestones tied to intake, policy, and finance obligations.',
      icon: ShieldAlert,
      cards: [
        {
          title: 'Intake cutoffs',
          count: undefined,
          risk: 'High',
          owner: 'Admissions Ops',
          href: '/admin/intakes',
          nextAction: 'Confirm open intakes and lock enrollment windows.',
        },
        {
          title: 'Policy publication windows',
          count: undefined,
          risk: 'Medium',
          owner: 'Policy Office',
          href: '/admin/policies',
          nextAction: 'Publish pending policy updates before compliance deadline.',
        },
        {
          title: 'Finance settlement deadlines',
          count: undefined,
          risk: 'High',
          owner: 'Finance Team',
          href: '/admin/reports/finance',
          nextAction: 'Finalize settlement batches and verify payout release status.',
        },
      ],
    },
    {
      title: 'Health Snapshot',
      description: 'Operational quality indicators and freshness checks.',
      icon: HeartPulse,
      cards: [
        {
          title: 'Admissions conversion funnel',
          count: Number(metricsByKey.get('students')) || undefined,
          risk: 'Low',
          owner: 'Growth Analytics',
          href: '/admin/reports/enrollment',
          nextAction: 'Review stage drop-offs and activate conversion interventions.',
        },
        {
          title: 'Lecturer coverage',
          count: Number(metricsByKey.get('courses')) || undefined,
          risk: 'Medium',
          owner: 'Scheduling Office',
          href: '/admin/assignments',
          nextAction: 'Fill unassigned teaching slots for upcoming cohorts.',
        },
        {
          title: 'Data freshness badges',
          count: Number(metricsByKey.get('activity')) || undefined,
          risk: 'Low',
          owner: 'Data Platform',
          href: '/admin/system-health',
          nextAction: 'Refresh stale pipelines and confirm reporting timestamps.',
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Command Center</h1>
          <p className="text-muted-foreground">
            Focus on urgent actions first. Every card includes ownership, risk, and a clear resolution path.
          </p>
        </div>
        {isUsingFallbackData ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
            Live dashboard data is temporarily unavailable. Use each card&apos;s next action to continue triage while services recover.
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {blocks.map((block) => {
          const Icon = block.icon;

          return (
            <Card key={block.title}>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {block.title}
                    </CardTitle>
                    <CardDescription>{block.description}</CardDescription>
                  </div>
                  {block.actions ? (
                    <div className="flex flex-col items-end gap-2">
                      {block.actions.map((action) => (
                        <Button key={action.label} variant="outline" size="sm" asChild>
                          <Link href={action.href}>{action.label}</Link>
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {block.cards.map((item) => {
                  const hasData = typeof item.count === 'number' && item.count > 0;

                  return (
                    <Card key={item.title} className="border-dashed">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="grid gap-2 sm:grid-cols-3">
                          <p>
                            <span className="text-muted-foreground">Count:</span>{' '}
                            <span className="font-semibold">{hasData ? item.count : 'No active records'}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Risk:</span>{' '}
                            <Badge className={riskStyles[item.risk]}>{item.risk}</Badge>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Owner:</span>{' '}
                            <span className="font-medium">{item.owner}</span>
                          </p>
                        </div>
                        {!hasData ? (
                          <p className="text-muted-foreground">Next action: {item.nextAction}</p>
                        ) : null}
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full" asChild>
                          <Link href={item.href}>Resolve now</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
  const dashboard = await getAdminDashboard();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Complete control center for curriculum, admissions, lecturer operations, and governance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboard.metrics.map((metric) => (
          <Card key={metric.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              {metric.key === 'revenue' && <DollarSign className="h-4 w-4 text-muted-foreground" />}
              {metric.key === 'students' && <Users className="h-4 w-4 text-muted-foreground" />}
              {metric.key === 'courses' && <BookOpen className="h-4 w-4 text-muted-foreground" />}
              {metric.key === 'activity' && <Activity className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {priorityShortcuts.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <item.icon className="size-5 text-primary" />
                {item.title}
              </CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={item.href}>
                  Open <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="size-5 text-primary" />
            Complete Admin Workspace
          </CardTitle>
          <CardDescription>
            Everything grouped by workflow so admin can operate the full academic cycle from one dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {adminActionGroups.map((group) => (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle className="text-base">{group.title}</CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.actions.map((action) => (
                  <Button key={action.href} variant="outline" className="w-full justify-between" asChild>
                    <Link href={action.href}>
                      {action.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          ))}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
          <Button variant="outline" asChild>
            <Link href="/admin/community">
              <Briefcase className="mr-2 h-4 w-4" />
              Community & Jobs
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/ai">
              <Settings className="mr-2 h-4 w-4" />
              AI Console
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
