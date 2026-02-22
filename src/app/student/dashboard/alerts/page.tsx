'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
import { getStudentDashboard } from '@/lib/api';
import type { StudentDashboardAction, StudentDashboardDeadline } from '@/lib/api/types';

type AlertItem = {
  id: string;
  title: string;
  detail: string;
  type: string;
  action: string;
};

export default function DashboardAlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [deadlinesCount, setDeadlinesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const dashboard = await getStudentDashboard();
        const actions = (dashboard.actions || []).map((action: StudentDashboardAction) => ({
          id: `action-${action.id}`,
          title: action.title,
          detail: action.description,
          type: 'Action',
          action: action.href,
        }));
        const deadlines = (dashboard.deadlines || []).map((deadline: StudentDashboardDeadline) => ({
          id: `deadline-${deadline.id}`,
          title: deadline.title,
          detail: `${deadline.type} due ${deadline.date}`,
          type: deadline.type || 'Deadline',
          action: deadline.type === 'Exam' ? '/student/exams' : '/student/assignments',
        }));
        setDeadlinesCount(deadlines.length);
        setAlerts([...actions, ...deadlines]);
      } catch (error) {
        console.error('Failed to load alerts', error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    loadAlerts();
  }, []);

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
          <CardContent className="text-2xl font-bold">{loading ? '-' : alerts.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
            <CardDescription>This week</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? '-' : deadlinesCount}</CardContent>
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
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading alerts...</p>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">You are all caught up.</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between rounded-lg border p-4">
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
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
