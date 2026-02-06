// src/app/(app)/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { QuickLinks } from '@/components/dashboard/quick-links';
import { type Program } from '@/lib/data';
import { GraduationCap, Wallet, ArrowRight, BookOpen, CalendarCheck, ClipboardList } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getProgram } from '@/lib/api';
import { useSession } from '@/components/providers/session-provider';

export default function DashboardPage() {
  const { session } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setUserRole(session?.user?.role ?? null);
      try {
        const programData = await getProgram();
        setProgram(programData);
      } catch (error) {
        console.error('Failed to load program', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [session]);

  if (loading || !program) {
    return <div className="text-sm text-muted-foreground">Loading your dashboard...</div>;
  }

  const isFreemium = userRole === 'freemium-student';
  const studentName = session?.user?.name ?? 'Student';
  const nextActions = [
    { title: 'Resume last lesson', description: 'Continue where you left off.', href: '/student/lessons/l1-cs101' },
    { title: 'Submit assignment', description: '2 items due this week.', href: '/student/assignments' },
    { title: 'Book upcoming exam', description: 'Reserve your seat early.', href: '/student/exams/bookings' },
    { title: 'Review study plan', description: 'Personalized weekly schedule.', href: '/student/study-plan' },
  ];
  const upcomingDeadlines = [
    { title: 'AI Ethics Reflection', date: 'Feb 21', type: 'Assignment' },
    { title: 'Semester 1 Exam', date: 'Feb 18', type: 'Exam' },
    { title: 'Lab Session Check-in', date: 'Feb 6', type: 'Virtual Lab' },
  ];

  if (isFreemium) {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Welcome to UnivAI!</CardTitle>
                        <CardDescription>
                            Your journey to higher education starts here. Upgrade to Premium to enroll in a program.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold text-lg">Explore Our Programs</p>
                                <p className="text-sm text-muted-foreground">
                                    Browse our available schools and programs to find your fit.
                                </p>
                            </div>
                        </div>
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {studentName}</h1>
        <p className="text-muted-foreground">
          Here is your academic snapshot and the next actions to stay on track.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>My Program</CardTitle>
                 <CardDescription>
                    Your central hub for course materials, progress, and modules.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold text-lg">{program.title}</p>
                        <p className="text-sm text-muted-foreground">
                            School of ICT
                        </p>
                    </div>
                </div>
                <div className='space-y-2'>
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
            {nextActions.map((action) => (
              <div key={action.title} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-semibold">{action.title}</p>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={action.href}>Open</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
            <CardDescription>Here's a breakdown of your progress by module.</CardDescription>
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
              <div key={item.title} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                  {item.type === 'Exam' ? (
                    <CalendarCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <ClipboardList className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.type} • {item.date}</p>
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
                <div className="text-2xl font-bold">925 AFTA</div>
                <p className="text-xs text-muted-foreground">AFTACOIN Balance</p>
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
  );
}
