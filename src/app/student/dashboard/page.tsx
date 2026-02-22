'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Wallet, ArrowRight, BookOpen, CalendarCheck, ClipboardList, Timer } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { QuickLinks } from '@/components/dashboard/quick-links';
import { PageHeader } from '@/components/student/page-header';
import { StatCard } from '@/components/student/stat-card';
import { EmptyState } from '@/components/student/empty-state';
import { type Program } from '@/lib/api/types';
import { getProgram, getStudentDashboard } from '@/lib/api';
import type { StudentDashboardAction, StudentDashboardDeadline, StudentDashboardWallet } from '@/lib/api/types';
import { useSession } from '@/components/providers/session-provider';

export default function DashboardPage() {
  const { session } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextActions, setNextActions] = useState<StudentDashboardAction[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<StudentDashboardDeadline[]>([]);
  const [wallet, setWallet] = useState<StudentDashboardWallet | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const resolvedRole = session?.user?.role ?? null;
      setUserRole(resolvedRole);
      if (!session?.user || resolvedRole === 'freemium-student') {
        setLoading(false);
        return;
      }
      if (!session?.user?.programId) {
        setProgram(null);
        setLoading(false);
        return;
      }
      try {
        const [programData, dashboardData] = await Promise.all([
          getProgram(),
          getStudentDashboard(),
        ]);
        setProgram(programData);
        setNextActions(dashboardData.actions);
        setUpcomingDeadlines(dashboardData.deadlines);
        setWallet(dashboardData.wallet ?? null);
      } catch (error) {
        console.error('Failed to load program', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [session]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading your dashboard...</div>;
  }

  if (!program) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <PageHeader
            title="Complete your admissions"
            description="Your application is still in progress. Finish admissions to unlock your program dashboard."
          />
          <EmptyState
            title="Admissions tasks pending"
            description="Track your application status, upload documents, and pay the admission fee."
            action={
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/admissions/status">View Admissions Status</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admissions/portal">Applicant Portal</Link>
                </Button>
              </div>
            }
          />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <QuickLinks />
        </div>
      </div>
    );
  }

  const isFreemium = userRole === 'freemium-student';
  const studentName = session?.user?.name ?? 'Student';
  const schoolLabel = program.schoolName ?? `School of ${program.schoolId?.toUpperCase() ?? 'School'}`;
  const walletValue = wallet?.value ?? '0 AFTA';
  const walletLabel = wallet?.note ?? wallet?.label ?? 'Wallet Balance';
  const nextDeadline = upcomingDeadlines[0];

  if (isFreemium) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <PageHeader
            title="Welcome to UnivAI"
            description="Your journey to higher education starts here. Upgrade to Premium to enroll in a program."
          />
          <Card>
            <CardHeader>
              <CardTitle>Explore Our Programs</CardTitle>
              <CardDescription>Browse available schools and courses to find your fit.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Review offerings, preview lessons, and get ready for full enrollment.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/student/courses">
                  View All Courses <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <QuickLinks />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${studentName}`}
        description="Here is your academic snapshot and the next actions to stay on track."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Program Progress"
          value={`${program.progress}%`}
          helper={program.title}
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <StatCard
          title="Next Deadline"
          value={nextDeadline ? nextDeadline.date : 'None'}
          helper={nextDeadline ? nextDeadline.title : 'No upcoming deadlines'}
          icon={<Timer className="h-4 w-4" />}
        />
        <StatCard
          title="Wallet Balance"
          value={walletValue}
          helper={walletLabel}
          icon={<Wallet className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Program</CardTitle>
              <CardDescription>Your central hub for course materials, progress, and modules.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{program.title}</p>
                  <p className="text-sm text-muted-foreground">{schoolLabel}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Overall Progress</span>
                  <span>{program.progress}%</span>
                </div>
                <Progress value={program.progress} className="h-4" />
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/student/program">
                  Go to My Program <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Actions</CardTitle>
              <CardDescription>Complete these to keep your pace on track.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextActions.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No urgent actions right now. Check your study plan to stay ahead.
                </div>
              ) : (
                nextActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-semibold">{action.title}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={action.href}>Open</Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress Overview</CardTitle>
              <CardDescription>Here is a breakdown of your progress by module.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressChart modules={program.modules} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <QuickLinks />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
              <CardDescription>Stay ahead of key dates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingDeadlines.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                    {item.type === 'Exam' ? (
                      <CalendarCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <ClipboardList className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.type} - {item.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link href="/student/assignments">View All Deadlines</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Wallet</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{walletValue}</div>
              <p className="text-xs text-muted-foreground">{walletLabel}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href="/student/wallet">
                  View Wallet <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}


