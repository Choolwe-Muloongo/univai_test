'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Target } from 'lucide-react';
import { getProgram, getStudentDashboard } from '@/lib/api';
import type { Program, StudentDashboardData } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function DashboardInsightsPage() {
  const [program, setProgram] = useState<Program | null>(null);
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInsights() {
      try {
        const [nextProgram, nextDashboard] = await Promise.all([getProgram(), getStudentDashboard()]);
        if (!isMounted) return;
        setProgram(nextProgram);
        setDashboard(nextDashboard);
        setError(null);
      } catch (err) {
        console.error('Failed to load dashboard insights', err);
        if (isMounted) {
          setProgram(null);
          setDashboard(null);
          setError('Your insights are unavailable. Please refresh or check that your account has programme access.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInsights();

    return () => {
      isMounted = false;
    };
  }, []);

  const insightData = useMemo(() => {
    const modules = program?.modules ?? [];
    const deadlines = dashboard?.deadlines ?? [];
    const totalProgress = modules.reduce((sum, module) => sum + (module.progress ?? 0), 0);
    const averageProgress = modules.length ? Math.round(totalProgress / modules.length) : 0;
    const goalProgress = program?.progress ?? averageProgress;
    const sortedModules = [...modules].sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0));
    const focusModules = sortedModules.slice(0, 3);
    const topModule = [...modules].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))[0];
    const nextDeadline = deadlines[0];
    const insights = [
      ...focusModules.map((module) => ({
        title: `Focus: ${module.title}`,
        detail: `Progress is ${module.progress ?? 0}%. Prioritize this module next.`,
        action: `/student/modules/${module.id}`,
      })),
      ...(nextDeadline
        ? [
            {
              title: `${nextDeadline.type} deadline`,
              detail: `${nextDeadline.title} is due ${nextDeadline.date}.`,
              action: nextDeadline.type === 'Exam' ? '/student/exams' : '/student/assignments',
            },
          ]
        : []),
    ];

    return { averageProgress, focusModules, goalProgress, insights, nextDeadline, topModule };
  }, [dashboard, program]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
          <p className="text-muted-foreground">Actionable AI insights based on your activity.</p>
        </div>
        <PageLoading message="Loading your insights..." />
      </div>
    );
  }

  if (error || !program || !dashboard) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
          <p className="text-muted-foreground">Actionable AI insights based on your activity.</p>
        </div>
        <PageError
          message={error ?? 'Dashboard insights are unavailable.'}
          actionHref="/student/dashboard"
          actionLabel="Back to Dashboard"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground">Actionable AI insights based on your activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Focus Score</CardTitle>
            <CardDescription>This week</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <TrendingUp className="h-5 w-5 text-primary" />
            {insightData.averageProgress}%
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Tasks</CardTitle>
            <CardDescription>Ready to start</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{insightData.insights.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Goal Progress</CardTitle>
            <CardDescription>Semester goals</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <Target className="h-5 w-5 text-primary" />
            {insightData.goalProgress}%
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
          <CardDescription>Complete these to improve your outcome.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insightData.insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recommendations yet.</p>
          ) : (
            insightData.insights.map((insight) => (
              <div key={insight.title} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{insight.title}</p>
                    <p className="text-sm text-muted-foreground">{insight.detail}</p>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <Link href={insight.action}>Open</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>AI Snapshot</CardTitle>
          <CardDescription>High-impact summary of your week.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {insightData.topModule ? (
            <Badge variant="secondary">Strong: {insightData.topModule.title}</Badge>
          ) : (
            <Badge variant="secondary">Strong: No data yet</Badge>
          )}
          {insightData.focusModules[0] ? (
            <Badge variant="secondary">Need Focus: {insightData.focusModules[0].title}</Badge>
          ) : (
            <Badge variant="secondary">Need Focus: No data yet</Badge>
          )}
          {insightData.nextDeadline ? (
            <Badge variant="secondary">Next: {insightData.nextDeadline.title}</Badge>
          ) : (
            <Badge variant="secondary">Next: No deadlines</Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
