"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Lock,
  MapPin,
  MonitorPlay,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/student/page-header";
import { StatCard } from "@/components/student/stat-card";
import { EmptyState } from "@/components/student/empty-state";
import { MissionHome } from "@/components/student/mission-home";
import { getProgram, getStudentDashboard, getStudentEntitlements } from "@/lib/api";
import { STUDENT_ENTITLEMENT, hasStudentEntitlement, roleToStudentAccessTier } from "@/lib/auth/roles";
import type { Program, StudentDashboardAction, StudentDashboardDeadline, StudentDashboardWallet } from "@/lib/api/types";
import { useSession } from "@/components/providers/session-provider";
import { deliveryModeLabel } from "@/lib/delivery-modes";
import { getMyShortCourses, type ShortCourseEnrollmentSummary } from "@/lib/api/short-courses";
import { fallbackGamification, getStudentGamification, type GamificationState } from "@/lib/api/student-gamification";
import { getStudentAcademicGate, type StudentAcademicGate } from "@/lib/api/academic-gate";

const stageLabels: Record<string, string> = {
  admissions_pending: "Admissions Pending",
  enrollment_pending: "Enrollment Pending",
  finance_registration_hold: "Registration Hold",
  module_registration_required: "Module Registration Required",
  registration_open: "Registration Open",
  registered_waiting_for_classes: "Registered · Waiting for Classes",
  active_semester: "Active Semester",
  exam_period: "Exam Period",
  results_period: "Results Period",
  progression_period: "Progression Period",
  academic_hold_or_break: "Academic Break / Hold",
};

function dateLabel(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function permissionBadge(can: boolean, reason?: string) {
  return can ? <Badge>Open</Badge> : <Badge variant="secondary" title={reason}>Locked</Badge>;
}

export default function DashboardPage() {
  const { session } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextActions, setNextActions] = useState<StudentDashboardAction[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<StudentDashboardDeadline[]>([]);
  const [wallet, setWallet] = useState<StudentDashboardWallet | null>(null);
  const [entitlements, setEntitlements] = useState<string[] | null>(null);
  const [shortCourses, setShortCourses] = useState<ShortCourseEnrollmentSummary[]>([]);
  const [gamification, setGamification] = useState<GamificationState>(fallbackGamification());
  const [academicGate, setAcademicGate] = useState<StudentAcademicGate | null>(null);

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

      const loadedShortCourses = await getMyShortCourses().catch((error) => {
        console.error("Failed to load short-course Journeys", error);
        return [];
      });
      setShortCourses(loadedShortCourses);
      const avgProgress = loadedShortCourses.length
        ? Math.round(loadedShortCourses.reduce((sum, item) => sum + Number(item.progress ?? 0), 0) / loadedShortCourses.length)
        : 0;
      setGamification(await getStudentGamification().catch(() => fallbackGamification(avgProgress)));

      const hasProgrammeAccess = hasStudentEntitlement(
        STUDENT_ENTITLEMENT.PROGRAMME,
        activeEntitlements,
        roleToStudentAccessTier(resolvedRole),
      );

      if (!hasProgrammeAccess) {
        setLoading(false);
        return;
      }

      const gate = await getStudentAcademicGate();
      setAcademicGate(gate);

      if (!gate?.permissions?.canViewDashboard) {
        setLoading(false);
        return;
      }

      try {
        const [programData, dashboardData] = await Promise.all([getProgram(), getStudentDashboard()]);
        setProgram(programData);
        setNextActions(dashboardData.actions);
        setUpcomingDeadlines(dashboardData.deadlines);
        setWallet(dashboardData.wallet ?? null);
      } catch (error) {
        console.error("Failed to load formal dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [session]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading your academic dashboard...</div>;
  }

  const accessTier = roleToStudentAccessTier(userRole);
  const hasProgrammeAccess = hasStudentEntitlement(
    STUDENT_ENTITLEMENT.PROGRAMME,
    entitlements ?? session?.user?.entitlements,
    accessTier,
  );
  const activeJourney = shortCourses.find((item) => item.course && Number(item.progress ?? 0) < 100) ?? shortCourses.find((item) => item.course) ?? null;

  if (!hasProgrammeAccess) {
    return <MissionHome learnerName={session?.user?.name ?? "Student"} activeJourney={activeJourney} gamification={gamification} />;
  }

  const stage = academicGate?.academicStatus ?? "enrollment_pending";
  const stageLabel = stageLabels[stage] ?? stage.replace(/_/g, " ");
  const permissions = academicGate?.permissions ?? {};
  const reasons = academicGate?.reasons ?? {};
  const calendar = academicGate?.calendar ?? {};
  const intake = academicGate?.intake ?? {};
  const deliveryRules = academicGate?.deliveryRules ?? {};
  const finance = academicGate?.finance ?? {};
  const nextEvents = academicGate?.nextEvents ?? [];
  const walletValue = wallet?.value ?? finance?.summary?.balance ?? "0";
  const walletLabel = wallet?.note ?? wallet?.label ?? "Financial balance / wallet";

  if (!permissions.canViewDashboard) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PageHeader title="Complete university registration" description="Your student identity exists, but academic access opens only after registration rules are satisfied." />
          <Card className="border-amber-300 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />{stageLabel}</CardTitle>
              <CardDescription>{reasons.dashboard ?? academicGate?.message ?? "Complete the remaining enrollment steps to unlock your formal student dashboard."}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border bg-background p-3 text-sm">
                <p className="font-semibold">Registration clearance</p>
                <p className="text-muted-foreground">{finance?.registrationClearance?.message ?? "Pay the minimum registration deposit if it is still pending."}</p>
              </div>
              <div className="rounded-lg border bg-background p-3 text-sm">
                <p className="font-semibold">Current intake</p>
                <p className="text-muted-foreground">{intake.name ?? "No intake found"} · {deliveryRules.label ?? deliveryModeLabel(intake.deliveryMode)}</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button asChild><Link href="/student/enroll">Complete Enrollment</Link></Button>
              <Button variant="outline" asChild><Link href="/admissions/portal">Admissions Portal</Link></Button>
              <Button variant="outline" asChild><Link href="/student/billing">View Payments</Link></Button>
            </CardFooter>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Academic calendar</CardTitle><CardDescription>What happens next</CardDescription></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Registration closes</span><span>{dateLabel(calendar.registrationClosesAt)}</span></div>
              <div className="flex justify-between"><span>Orientation</span><span>{dateLabel(calendar.orientationDate)}</span></div>
              <div className="flex justify-between"><span>Classes start</span><span>{dateLabel(calendar.classesStartDate)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const studentName = session?.user?.name ?? "Student";
  const schoolLabel = program?.schoolName ?? `School of ${program?.schoolId?.toUpperCase?.() ?? "School"}`;
  const nextDeadline = upcomingDeadlines[0];

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${studentName}`} description="Your access is controlled by enrollment, finance, delivery mode, and the academic calendar." />

      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" />Current Academic Status</CardTitle>
              <CardDescription>{intake.programTitle ?? program?.title ?? "Formal programme"} · {intake.name ?? "Current intake"}</CardDescription>
            </div>
            <Badge>{stageLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-3 text-sm"><p className="text-muted-foreground">Delivery mode</p><p className="font-semibold">{deliveryRules.label ?? deliveryModeLabel(intake.deliveryMode)}</p></div>
          <div className="rounded-lg border p-3 text-sm"><p className="text-muted-foreground">Classes start</p><p className="font-semibold">{dateLabel(calendar.classesStartDate)}</p></div>
          <div className="rounded-lg border p-3 text-sm"><p className="text-muted-foreground">Exam period</p><p className="font-semibold">{dateLabel(calendar.examStartsAt)} → {dateLabel(calendar.examEndsAt)}</p></div>
          <div className="rounded-lg border p-3 text-sm"><p className="text-muted-foreground">Results release</p><p className="font-semibold">{dateLabel(calendar.resultsReleaseDate)}</p></div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Programme" value={program?.title ?? intake.programTitle ?? "Programme"} helper={`${schoolLabel} · ${deliveryRules.label ?? deliveryModeLabel(intake.deliveryMode)}`} icon={<GraduationCap className="h-4 w-4" />} />
        <StatCard title="Next Deadline" value={nextDeadline ? nextDeadline.date : (nextEvents[0]?.date ?? "None")} helper={nextDeadline ? nextDeadline.title : (nextEvents[0]?.title ?? "No upcoming deadlines")} icon={<CalendarDays className="h-4 w-4" />} />
        <StatCard title="Finance" value={String(walletValue)} helper={walletLabel} icon={<Wallet className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4" />Modules</CardTitle><CardDescription>Semester module access</CardDescription></CardHeader>
          <CardContent>{permissionBadge(Boolean(permissions.canViewModules), reasons.modules)}</CardContent>
          <CardFooter><Button disabled={!permissions.canViewModules} asChild={Boolean(permissions.canViewModules)}>{permissions.canViewModules ? <Link href="/student/program">Open modules</Link> : <span><Lock className="mr-2 h-4 w-4" />Locked</span>}</Button></CardFooter>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4" />Timetable</CardTitle><CardDescription>Calendar-matched sessions</CardDescription></CardHeader>
          <CardContent>{permissionBadge(Boolean(permissions.canViewTimetable), reasons.modules)}</CardContent>
          <CardFooter><Button disabled={!permissions.canViewTimetable} asChild={Boolean(permissions.canViewTimetable)}>{permissions.canViewTimetable ? <Link href="/student/timetable">View timetable</Link> : <span><Lock className="mr-2 h-4 w-4" />Locked</span>}</Button></CardFooter>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4" />Assignments</CardTitle><CardDescription>CA period controlled</CardDescription></CardHeader>
          <CardContent>{permissionBadge(Boolean(permissions.canSubmitAssignment), reasons.assignments)}</CardContent>
          <CardFooter><Button disabled={!permissions.canSubmitAssignment} asChild={Boolean(permissions.canSubmitAssignment)}>{permissions.canSubmitAssignment ? <Link href="/student/assignments">Open assignments</Link> : <span><Lock className="mr-2 h-4 w-4" />Locked</span>}</Button></CardFooter>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4" />Results</CardTitle><CardDescription>Release + clearance required</CardDescription></CardHeader>
          <CardContent>{permissionBadge(Boolean(permissions.canViewResults), reasons.results)}</CardContent>
          <CardFooter><Button disabled={!permissions.canViewResults} asChild={Boolean(permissions.canViewResults)}>{permissions.canViewResults ? <Link href="/student/grades">View results</Link> : <span><Lock className="mr-2 h-4 w-4" />Locked</span>}</Button></CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Delivery mode rules</CardTitle>
              <CardDescription>{deliveryRules.description ?? "Your activities follow the configured delivery mode."}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-3 text-sm"><MonitorPlay className="mb-2 h-4 w-4 text-primary" /><p className="font-semibold">Online access</p><p className="text-muted-foreground">{permissions.canJoinLiveClass ? "Live links and online sessions can open during class period." : "Online class links open only when the calendar and delivery mode allow it."}</p></div>
              <div className="rounded-lg border p-3 text-sm"><MapPin className="mb-2 h-4 w-4 text-primary" /><p className="font-semibold">Physical access</p><p className="text-muted-foreground">{permissions.canUsePhysicalVenue ? "Venue-based sessions are available for your mode." : "Physical venues show only for physical/hybrid sessions when classes are active."}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Next Actions</CardTitle><CardDescription>Only realistic actions for your current stage are shown.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {nextActions.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No urgent actions right now. Follow the academic calendar and check notices.</div>
              ) : (
                nextActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div><p className="font-semibold">{action.title}</p><p className="text-sm text-muted-foreground">{action.description}</p></div>
                    <Button variant="outline" size="sm" asChild><Link href={action.href}>Open</Link></Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Academic Calendar</CardTitle><CardDescription>Dates controlling access</CardDescription></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Registration</span><span>{dateLabel(calendar.registrationOpensAt)} → {dateLabel(calendar.registrationClosesAt)}</span></div>
              <div className="flex justify-between"><span>Orientation</span><span>{dateLabel(calendar.orientationDate)}</span></div>
              <div className="flex justify-between"><span>Classes</span><span>{dateLabel(calendar.classesStartDate)}</span></div>
              <div className="flex justify-between"><span>CA window</span><span>{dateLabel(calendar.caStartsAt)} → {dateLabel(calendar.caEndsAt)}</span></div>
              <div className="flex justify-between"><span>Exams</span><span>{dateLabel(calendar.examStartsAt)} → {dateLabel(calendar.examEndsAt)}</span></div>
              <div className="flex justify-between"><span>Results</span><span>{dateLabel(calendar.resultsReleaseDate)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Upcoming</CardTitle><CardDescription>Calendar and session events</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {nextEvents.slice(0, 5).map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-lg border p-3 text-sm">
                  <p className="font-semibold">{item.title ?? item.courseTitle}</p>
                  <p className="text-muted-foreground">{item.date ?? `${item.dayOfWeek ?? "Scheduled"} ${item.startTime ?? ""}`}</p>
                  {item.deliveryMode ? <Badge variant="outline" className="mt-2">{deliveryModeLabel(item.deliveryMode)}</Badge> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
