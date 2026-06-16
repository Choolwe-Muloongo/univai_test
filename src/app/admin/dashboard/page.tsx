'use client';

import { useEffect, useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Briefcase,
  ClipboardCheck,
  DollarSign,
  LayoutGrid,
  Settings,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAdminDashboard } from '@/lib/api';

type Metric = {
  key: string;
  label: string;
  value: string | number;
  note?: string;
};

type DashboardResponse = {
  metrics?: unknown;
};

type Shortcut = {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
};

type ActionGroup = {
  title: string;
  description: string;
  actions: { label: string; href: string }[];
};

const fallbackMetrics: Metric[] = [
  { key: 'revenue', label: 'Revenue', value: 'Unavailable', note: 'Waiting for backend data' },
  { key: 'students', label: 'Students', value: 'Unavailable', note: 'Waiting for backend data' },
  { key: 'courses', label: 'Courses', value: 'Unavailable', note: 'Waiting for backend data' },
  { key: 'activity', label: 'Activity', value: 'Unavailable', note: 'Waiting for backend data' },
];

const metricIcons: Record<string, React.ElementType> = {
  revenue: DollarSign,
  students: Users,
  courses: BookOpen,
  activity: Activity,
};

const priorityShortcuts: Shortcut[] = [
  {
    title: 'Admissions Queue',
    description: 'Review applications, verify documents, send offers, and mark students admitted.',
    href: '/admin/admissions',
    icon: ClipboardCheck,
    badge: 'High priority',
  },
  {
    title: 'Curriculum Operations',
    description: 'Manage curriculum versions, intake mappings, modules, and delivery readiness.',
    href: '/admin/curriculum-ops',
    icon: Workflow,
  },
  {
    title: 'Lecturer Applications',
    description: 'Approve lecturers and keep teaching coverage healthy across programs.',
    href: '/admin/lecturer-applications',
    icon: Users,
  },
  {
    title: 'System Health',
    description: 'Check diagnostics, incidents, and operational risk before users are affected.',
    href: '/admin/system-health',
    icon: ShieldCheck,
  },
];

const adminActionGroups: ActionGroup[] = [
  {
    title: 'Admissions & Enrollment',
    description: 'Everything needed to move an applicant from submission to admitted student.',
    actions: [
      { label: 'Admissions', href: '/admin/admissions' },
      { label: 'Intakes', href: '/admin/intakes' },
      { label: 'Route Requests', href: '/admin/route-requests' },
      { label: 'Enrollment Reports', href: '/admin/reports/enrollment' },
    ],
  },
  {
    title: 'Academic Delivery',
    description: 'Curriculum, lecturer assignments, policies, and program operations.',
    actions: [
      { label: 'Curriculum Builder', href: '/admin/curriculum' },
      { label: 'Curriculum Ops', href: '/admin/curriculum-ops' },
      { label: 'Assignments', href: '/admin/assignments' },
      { label: 'Policies', href: '/admin/policies' },
    ],
  },
  {
    title: 'Platform Operations',
    description: 'Users, reports, jobs, content, AI console, audits, and system health.',
    actions: [
      { label: 'User Management', href: '/admin/users' },
      { label: 'Reports', href: '/admin/reports' },
      { label: 'System Health', href: '/admin/system-health' },
      { label: 'AI Console', href: '/admin/ai' },
    ],
  },
];

function formatMetricValue(value: string | number) {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  return value;
}

function normalizeMetrics(value: unknown): Metric[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((metric): metric is Record<string, unknown> => Boolean(metric && typeof metric === 'object'))
    .map((metric, index) => ({
      key: String(metric.key ?? `metric-${index}`),
      label: String(metric.label ?? metric.key ?? `Metric ${index + 1}`),
      value: typeof metric.value === 'number' || typeof metric.value === 'string' ? metric.value : 'Unavailable',
      note: typeof metric.note === 'string' ? metric.note : undefined,
    }));
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metric[]>(fallbackMetrics);
  const [usingFallback, setUsingFallback] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const dashboard = (await getAdminDashboard()) as DashboardResponse;
        if (!isMounted) return;

        const safeMetrics = normalizeMetrics(dashboard.metrics);
        if (safeMetrics.length > 0) {
          setMetrics(safeMetrics);
          setUsingFallback(false);
        } else {
          setMetrics(fallbackMetrics);
          setUsingFallback(true);
        }
      } catch (error) {
        console.error('Failed to load admin dashboard metrics', error);
        if (isMounted) {
          setMetrics(fallbackMetrics);
          setUsingFallback(true);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="max-w-3xl text-muted-foreground">
            A practical control center for admissions, academic delivery, people management, and platform operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/admissions">
              Review Admissions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/reports">Open Reports</Link>
          </Button>
        </div>
      </div>

      {usingFallback ? (
        <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30">
          <CardContent className="p-4 text-sm text-amber-900 dark:text-amber-200">
            Live dashboard metrics are unavailable. Navigation still works, and admins can continue using the action cards below.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metricIcons[metric.key] ?? Activity;

          return (
            <Card key={metric.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMetricValue(metric.value)}</div>
                <p className="text-xs text-muted-foreground">{metric.note ?? 'Live platform metric'}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {priorityShortcuts.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.href} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-primary" />
                    {item.title}
                  </CardTitle>
                  {item.badge ? <Badge variant="secondary">{item.badge}</Badge> : null}
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button asChild className="w-full">
                  <Link href={item.href}>
                    Open
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Complete Admin Workspace
          </CardTitle>
          <CardDescription>
            Clear navigation groups so admins do not get lost across the many admin pages.
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
            <Link href="/admin/jobs">
              <Briefcase className="mr-2 h-4 w-4" />
              Manage Jobs
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/management">
              <Settings className="mr-2 h-4 w-4" />
              Content Management
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
