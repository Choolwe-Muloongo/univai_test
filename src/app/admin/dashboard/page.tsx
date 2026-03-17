import Link from 'next/link';
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
