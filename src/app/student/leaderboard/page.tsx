'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Flame, Medal, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getStudentActivityLeaderboard, type LeaderboardRow } from '@/lib/api/student-gamification';

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getStudentActivityLeaderboard()
      .then((data) => {
        if (!mounted) return;
        setRows(data);
        setError(null);
      })
      .catch((cause) => {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : 'Activity leaderboard is unavailable.');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Activity Leaderboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Rank by effort, consistency, and real learning</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">This ranking is platform-wide. Cards, missions, Training Arena wins, Boss Battles, Final Trials, streaks, and helpful learning activity all count.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild><Link href="/student/courses">Continue a Journey</Link></Button>
          <Button asChild variant="outline"><Link href="/student/rewards">View Rewards</Link></Button>
        </div>
      </section>

      {loading ? <PageLoading message="Loading activity leaderboard..." /> : null}
      {error ? <PageError message={error} actionHref="/student/courses" actionLabel="Back to Journeys" /> : null}

      {!loading && !error ? (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Weekly Activity</CardTitle>
            <CardDescription>Repeated farming is reduced by backend activity rules. The aim is learning rhythm, not empty clicks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.length ? rows.map((student) => (
              <div key={`${student.rank}-${student.studentId}`} className={`grid gap-3 rounded-2xl border p-4 sm:grid-cols-[80px_1fr_180px] sm:items-center ${student.rank <= 3 ? 'bg-primary/5 border-primary/20' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">#{student.rank}</span>
                  {student.rank <= 3 ? <Medal className="h-5 w-5 text-primary" /> : null}
                </div>
                <div>
                  <p className="text-lg font-semibold">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.levelTitle}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xl font-bold">{student.activityPoints.toLocaleString()} pts</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground sm:justify-end"><Flame className="h-4 w-4" /> {student.streakDays}-day streak</p>
                </div>
              </div>
            )) : <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No activity yet this week. Complete a mission or Training Arena battle to appear here.</p>}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
