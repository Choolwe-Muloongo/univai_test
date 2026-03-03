import Link from 'next/link';
import { ArrowRight, BookOpen, Briefcase, ClipboardCheck, DollarSign, Activity, LayoutGrid, ShieldCheck, Settings, Users, Workflow } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminDashboard } from '@/lib/api';

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
