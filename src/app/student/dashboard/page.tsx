"use client";

import { useEffect, useState, type ElementType } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Wallet,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Timer,
  BadgeCheck,
  CreditCard,
  Sparkles,
  Lightbulb,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { QuickLinks } from "@/components/dashboard/quick-links";
import { PageHeader } from "@/components/student/page-header";
import { StatCard } from "@/components/student/stat-card";
import { EmptyState } from "@/components/student/empty-state";
import { type EnrollmentData, type Program } from "@/lib/api/types";
import {
  getEnrollment,
  getProgram,
  getStudentDashboard,
  getStudentEntitlements,
} from "@/lib/api";
import {
  STUDENT_ACCESS_TIER_LABELS,
  STUDENT_ENTITLEMENT,
  hasStudentEntitlement,
  roleToStudentAccessTier,
} from "@/lib/auth/roles";
import type {
  StudentDashboardAction,
  StudentDashboardDeadline,
  StudentDashboardWallet,
} from "@/lib/api/types";
import { useSession } from "@/components/providers/session-provider";
import { deliveryModeLabel } from "@/lib/delivery-modes";
import { getMyShortCourses, type ShortCourseEnrollmentSummary } from "@/lib/api/short-courses";

export default function DashboardPage() {
  const { session } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextActions, setNextActions] = useState<StudentDashboardAction[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<
    StudentDashboardDeadline[]
  >([]);
  const [wallet, setWallet] = useState<StudentDashboardWallet | null>(null);
  const [entitlements, setEntitlements] = useState<string[] | null>(null);
  const [shortCourses, setShortCourses] = useState<ShortCourseEnrollmentSummary[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const resolvedRole = session?.user?.role ?? null;
      setUserRole(resolvedRole);
      if (!session?.user) {
        setLoading(false);
        return;
      }

      let activeEntitlements: string[] = [];
      try {
        const entitlementData = await getStudentEntitlements();
        activeEntitlements = entitlementData.entitlements;
        setEntitlements(activeEntitlements);
      } catch (error) {
        console.error("Failed to load student entitlements", error);
        setEntitlements(activeEntitlements);
      }

      const hasProgrammeAccess = hasStudentEntitlement(
        STUDENT_ENTITLEMENT.PROGRAMME,
        activeEntitlements,
        roleToStudentAccessTier(resolvedRole),
      );

      try {
        setShortCourses(await getMyShortCourses());
      } catch (error) {
        console.error("Failed to load short courses", error);
        setShortCourses([]);
      }

      if (!hasProgrammeAccess) {
        setLoading(false);
        return;
      }

      let enrollmentData: EnrollmentData | null = null;
      try {
        enrollmentData = await getEnrollment();
        setEnrollment(enrollmentData);
      } catch (error) {
        console.error("Failed to load enrollment", error);
        setEnrollment(null);
      }

      const enrollmentConfirmed = enrollmentData?.status === "active" && Boolean(enrollmentData.confirmedAt);
      if (!enrollmentConfirmed) {
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
        console.error("Failed to load program", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [session]);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading your dashboard...
      </div>
    );
  }

  const accessTier = roleToStudentAccessTier(userRole);
  const hasProgrammeAccess = hasStudentEntitlement(
    STUDENT_ENTITLEMENT.PROGRAMME,
    entitlements ?? session?.user?.entitlements,
    accessTier,
  );
  const tierLabel = STUDENT_ACCESS_TIER_LABELS[accessTier];
  const enrollmentConfirmed = enrollment?.status === "active" && Boolean(enrollment.confirmedAt);

  if (!hasProgrammeAccess) {
    const activeCourse = shortCourses.find((item) => item.course) ?? null;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
          <PageHeader
            title={`Welcome to UnivAI ${tierLabel}`}
            description="Continue building your skills with UnivAI short courses. Learn today, earn certificates, and move into a formal programme when you are ready."
          />
          {activeCourse?.course ? (
            <Card className="rounded-3xl border-primary/20 shadow-sm">
              <CardHeader>
                <CardTitle>Continue Learning</CardTitle>
                <CardDescription>Pick up from your active short course.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xl font-semibold">{activeCourse.course.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{activeCourse.course.description}</p>
                  </div>
                  <Button asChild className="w-full sm:w-auto">
                    <Link href={`/student/courses/${activeCourse.course.id}`}>Continue Course</Link>
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{activeCourse.progress}%</span>
                  </div>
                  <Progress value={activeCourse.progress} className="h-3" />
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-1">Access: {activeCourse.entryFeePaid ? 'Active' : 'Pending payment'}</span>
                  <span className="rounded-full bg-muted px-2 py-1">Certificate: {certificateStatus(activeCourse)}</span>
                  <span className="rounded-full bg-muted px-2 py-1">Lessons: {activeCourse.completedAt ? 'Completed' : 'In progress'}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl border-dashed">
              <CardContent className="space-y-4 p-8 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-primary" />
                <div>
                  <CardTitle>You have not joined any short course yet.</CardTitle>
                  <CardDescription className="mt-2">Start with a focused course, then continue into practice, exams, and certificates.</CardDescription>
                </div>
                <Button asChild><Link href="/student/courses">Browse Short Courses</Link></Button>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <DashboardActionCard icon={BookOpen} title="My Short Courses" description="Open enrolled courses and track progress." href="/student/courses" />
            <DashboardActionCard icon={Sparkles} title="Practice Zone" description="Train with short-course questions by difficulty." href={activeCourse?.course ? `/student/courses/${activeCourse.course.id}/practice` : '/student/courses'} />
            <DashboardActionCard icon={BadgeCheck} title="Certificates" description="Check locked, ready, and issued certificates." href="/student/certificates" />
          </div>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Ready to become a formal UnivAI student?</CardTitle>
              <CardDescription>
                Your short-course account can become a formal programme account. Apply for a diploma, degree, or full academic pathway when you are ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Keep your short-course skills and move into a formal programme when you want a full academic pathway.
              </p>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/admissions/portal">Apply for Formal Programme</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/programs">Explore Programmes</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Learning access</CardTitle>
                <CardDescription>Short-course tools available now.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow icon={BookOpen} label="Browse Short Courses" href="/short-courses" />
                <InfoRow icon={CreditCard} label="Billing / Access" href="/student/payments" />
                <InfoRow icon={Lightbulb} label="AI Tutor" href="/student/ai" />
              </CardContent>
            </Card>
            <QuickLinks />
          </div>
        </div>
      </div>
    );
  }

  if (!enrollmentConfirmed) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <PageHeader
            title="Complete your enrollment"
            description="Your offer has been accepted, but your full student dashboard opens only after enrollment is confirmed."
          />
          <EmptyState
            title="Enrollment is still pending"
            description="Complete module selection, payment, and enrollment confirmation to activate your full student dashboard."
            action={
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/student/enroll">Complete Enrollment</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admissions/portal">View Admissions Letters</Link>
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

  const studentName = session?.user?.name ?? "Student";
  const schoolLabel =
    program.schoolName ??
    `School of ${program.schoolId?.toUpperCase() ?? "School"}`;
  const walletValue = wallet?.value ?? "0 AFTA";
  const walletLabel = wallet?.note ?? wallet?.label ?? "Wallet Balance";
  const nextDeadline = upcomingDeadlines[0];

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
          helper={`${program.title} · ${deliveryModeLabel(program.deliveryMode)}`}
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <StatCard
          title="Next Deadline"
          value={nextDeadline ? nextDeadline.date : "None"}
          helper={nextDeadline ? nextDeadline.title : "No upcoming deadlines"}
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
              <CardDescription>
                Your central hub for course materials, progress, and modules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{program.title}</p>
                  <p className="text-sm text-muted-foreground">{schoolLabel} · {deliveryModeLabel(program.deliveryMode)}</p>
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
              <CardTitle>Boost your programme with short courses</CardTitle>
              <CardDescription>
                Take extra skill-based courses alongside your formal programme.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {shortCourses.find((item) => item.course)?.course ? (
                <p className="text-sm text-muted-foreground">
                  Continue {shortCourses.find((item) => item.course)?.course?.title} or browse more skill courses.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add focused certificates, coding labs, business skills, finance practice, or professional topics to your formal study path.
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/student/courses">Browse Short Courses</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Actions</CardTitle>
              <CardDescription>
                Complete these to keep your pace on track.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextActions.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No urgent actions right now. Check your study plan to stay
                  ahead.
                </div>
              ) : (
                nextActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-semibold">{action.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
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
              <CardDescription>
                Here is a breakdown of your progress by module.
              </CardDescription>
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
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                    {item.type === "Exam" ? (
                      <CalendarCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <ClipboardList className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.type} - {item.date}
                    </p>
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

function DashboardActionCard({ icon: Icon, title, description, href }: { icon: ElementType; title: string; description: string; href: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-3 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="outline" className="w-full"><Link href={href}>Open</Link></Button>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, href }: { icon: ElementType; label: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border p-3 transition hover:border-primary">
      <Icon className="h-4 w-4 text-primary" />
      <span>{label}</span>
    </Link>
  );
}

function certificateStatus(item: ShortCourseEnrollmentSummary) {
  if (item.certificateIssuedAt) return 'Issued';
  if (Number(item.examScore ?? 0) >= 50 && (item.certificateFeePaid || item.course?.certificateFee === 0)) return 'Ready';
  if (Number(item.examScore ?? 0) >= 50) return 'Payment required';
  return 'Locked';
}
