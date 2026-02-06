import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CalendarClock, ShieldAlert } from 'lucide-react';

const alerts = [
  {
    title: 'Programming Lab 1 due in 4 days',
    detail: 'Submit before Feb 10, 2026 to avoid penalties.',
    type: 'Deadline',
    action: '/student/assignments',
  },
  {
    title: 'Semester exam booking opens',
    detail: 'Book your slot for Semester 1 assessment.',
    type: 'Exam',
    action: '/student/exams',
  },
  {
    title: 'Attendance warning',
    detail: 'You missed one lab session. Keep attendance above 80%.',
    type: 'Attendance',
    action: '/student/program/attendance',
  },
];

export default function DashboardAlertsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground">Critical notices that need your attention.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open Alerts</CardTitle>
            <CardDescription>Need action</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">3</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
            <CardDescription>This week</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">2</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Policy Holds</CardTitle>
            <CardDescription>Registrar review</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">0</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Resolve these to stay on track.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.title} className="flex items-start justify-between rounded-lg border p-4">
              <div className="flex items-start gap-3">
                {alert.type === 'Attendance' ? (
                  <AlertTriangle className="mt-1 h-5 w-5 text-destructive" />
                ) : alert.type === 'Exam' ? (
                  <CalendarClock className="mt-1 h-5 w-5 text-primary" />
                ) : (
                  <ShieldAlert className="mt-1 h-5 w-5 text-primary" />
                )}
                <div>
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.detail}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={alert.type === 'Attendance' ? 'destructive' : 'secondary'}>
                  {alert.type}
                </Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href={alert.action}>View</Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
