'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarCheck, AlertTriangle } from 'lucide-react';
import { getStudentTimetable } from '@/lib/api';
import type { CourseSession } from '@/lib/api/types';

export default function ProgramAttendancePage() {
  const [sessions, setSessions] = useState<CourseSession[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getStudentTimetable();
      setSessions(data);
    };
    load();
  }, []);

  const summary = useMemo(() => {
    const relevant = sessions.filter((session) => session.status);
    const present = relevant.filter((session) => session.status === 'present').length;
    const absent = relevant.filter((session) => session.status === 'absent').length;
    const total = relevant.length || 1;
    const rate = Math.round((present / total) * 100);
    return { present, absent, rate };
  }, [sessions]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          Keep your attendance above the minimum threshold.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Rate</CardTitle>
            <CardDescription>This semester</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">{summary.rate}%</span>
              <span className="text-muted-foreground">Target 80%</span>
            </div>
            <Progress value={summary.rate} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Missed Sessions</CardTitle>
            <CardDescription>Needs review</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{summary.absent}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
            <CardDescription>Compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={summary.rate >= 80 ? 'secondary' : 'destructive'}>
              {summary.rate >= 80 ? 'Compliant' : 'At Risk'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Attendance history for the current term.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-semibold">{session.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.dayOfWeek ? `${session.dayOfWeek} ` : ''}
                    {session.startTime ? `${session.startTime} - ` : ''}
                    {session.endTime ?? ''}
                  </p>
                </div>
              </div>
              <Badge variant={session.status === 'absent' ? 'destructive' : 'secondary'}>
                {session.status ? session.status.toUpperCase() : 'PENDING'}
              </Badge>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground">No sessions scheduled yet.</p>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Missing sessions may affect eligibility.
          </div>
          <Button variant="outline" asChild>
            <Link href="/student/support">Report an Issue</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
