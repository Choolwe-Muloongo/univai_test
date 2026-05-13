'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSessionRoster, markSessionAttendance } from '@/lib/api';

type RosterStudent = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export default function LecturerSessionAttendancePage() {
  const params = useParams();
  const sessionId = Number(params.sessionId);
  const courseId = params.id as string;

  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await getSessionRoster(sessionId);
      setRoster(data);
      const initial: Record<string, string> = {};
      data.forEach((student: RosterStudent) => {
        initial[student.id] = 'present';
      });
      setStatuses(initial);
    };
    if (sessionId) load();
  }, [sessionId]);

  const handleToggle = (studentId: string) => {
    setStatuses((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const records = Object.entries(statuses).map(([studentId, status]) => ({
      studentId,
      status,
    }));
    await markSessionAttendance(sessionId, records);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mark Attendance</h1>
          <p className="text-muted-foreground">Session #{sessionId}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/lecturer/courses/${courseId}/sessions`}>Back to Sessions</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
          <CardDescription>Tap to toggle present/absent before saving.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roster.map((student) => (
            <div key={student.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-semibold">{student.name ?? 'Student'}</p>
                <p className="text-sm text-muted-foreground">{student.email}</p>
              </div>
              <Button
                variant={statuses[student.id] === 'absent' ? 'destructive' : 'secondary'}
                onClick={() => handleToggle(student.id)}
              >
                {statuses[student.id] === 'absent' ? 'Absent' : 'Present'}
              </Button>
            </div>
          ))}
          {roster.length === 0 && (
            <p className="text-sm text-muted-foreground">No enrolled students found.</p>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Attendance'}
      </Button>
    </div>
  );
}
