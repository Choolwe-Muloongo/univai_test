import Link from 'next/link';
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

const sessions = [
  { id: 's1', title: 'Programming Lab', date: 'Feb 4, 2026', status: 'Present' },
  { id: 's2', title: 'Database Systems', date: 'Feb 6, 2026', status: 'Present' },
  { id: 's3', title: 'AI Foundations', date: 'Feb 10, 2026', status: 'Absent' },
];

export default function ProgramAttendancePage() {
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
              <span className="font-semibold">86%</span>
              <span className="text-muted-foreground">Target 80%</span>
            </div>
            <Progress value={86} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Missed Sessions</CardTitle>
            <CardDescription>Needs review</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">1</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
            <CardDescription>Compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Compliant</Badge>
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
                  <p className="text-sm text-muted-foreground">{session.date}</p>
                </div>
              </div>
              <Badge variant={session.status === 'Absent' ? 'destructive' : 'secondary'}>
                {session.status}
              </Badge>
            </div>
          ))}
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
