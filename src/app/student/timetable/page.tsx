"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Lock, MapPin, MonitorPlay } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/student/page-header";
import { apiFetch } from "@/lib/api/client";
import { deliveryModeLabel } from "@/lib/delivery-modes";
import { getStudentAcademicGate, type StudentAcademicGate } from "@/lib/api/academic-gate";

type TimetableSession = Record<string, any> & {
  id: number;
  title: string;
  courseTitle?: string | null;
  deliveryMode?: string | null;
  dayOfWeek?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  meetingUrl?: string | null;
};

function dateLabel(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function StudentTimetablePage() {
  const [gate, setGate] = useState<StudentAcademicGate | null>(null);
  const [sessions, setSessions] = useState<TimetableSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const academicGate = await getStudentAcademicGate();
      setGate(academicGate);
      try {
        const timetable = await apiFetch('/students/me/timetable');
        setSessions(Array.isArray(timetable) ? timetable : []);
      } catch (err: any) {
        setSessions([]);
        setError(err?.details?.message || err?.message || 'Timetable is not available yet.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading timetable...</p>;

  const calendar = gate?.calendar ?? {};
  const rules = gate?.deliveryRules ?? {};
  const canView = Boolean(gate?.permissions?.canViewTimetable) && !error;

  return (
    <div className="space-y-6">
      <PageHeader title="My Timetable" description="Your timetable follows your intake calendar and delivery mode. Online, hybrid, and physical sessions are separated by rules." />

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />Academic Calendar Match</CardTitle>
          <CardDescription>{rules.description ?? 'Your session access is controlled by the academic calendar.'}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4 text-sm">
          <div className="rounded-lg border p-3"><p className="text-muted-foreground">Delivery mode</p><p className="font-semibold">{rules.label ?? deliveryModeLabel(gate?.intake?.deliveryMode)}</p></div>
          <div className="rounded-lg border p-3"><p className="text-muted-foreground">Classes start</p><p className="font-semibold">{dateLabel(calendar.classesStartDate)}</p></div>
          <div className="rounded-lg border p-3"><p className="text-muted-foreground">CA window</p><p className="font-semibold">{dateLabel(calendar.caStartsAt)} → {dateLabel(calendar.caEndsAt)}</p></div>
          <div className="rounded-lg border p-3"><p className="text-muted-foreground">Exam period</p><p className="font-semibold">{dateLabel(calendar.examStartsAt)} → {dateLabel(calendar.examEndsAt)}</p></div>
        </CardContent>
      </Card>

      {!canView ? (
        <Card className="border-amber-300 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Timetable locked</CardTitle>
            <CardDescription>{error || gate?.reasons?.modules || 'Complete enrollment and module registration first.'}</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-wrap gap-2">
            <Button asChild><Link href="/student/dashboard">Back to Dashboard</Link></Button>
            <Button variant="outline" asChild><Link href="/student/enroll">Complete Enrollment</Link></Button>
          </CardFooter>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No sessions scheduled yet</CardTitle>
            <CardDescription>Your timetable will appear when lecturers/admin publish class sessions for your intake.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{session.title}</CardTitle>
                    <CardDescription>{session.courseTitle ?? session.courseId}</CardDescription>
                  </div>
                  <Badge variant="outline">{deliveryModeLabel(session.deliveryMode)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" />{session.dayOfWeek ?? 'Scheduled'} · {session.startTime ?? 'TBA'} - {session.endTime ?? 'TBA'}</div>
                {session.location ? <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{session.location}</div> : null}
                {session.meetingUrl ? <div className="flex items-center gap-2"><MonitorPlay className="h-4 w-4 text-muted-foreground" />Online link available</div> : null}
              </CardContent>
              {session.meetingUrl ? (
                <CardFooter>
                  <Button variant="outline" asChild><Link href={session.meetingUrl}>Open live link</Link></Button>
                </CardFooter>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
