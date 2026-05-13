'use client';

import { useEffect, useMemo, useState } from 'react';
import { getLeaderboard } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import type { LeaderboardStudent } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function LeaderboardClassPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboard() {
      try {
        const nextLeaderboard = await getLeaderboard();
        if (!isMounted) return;
        setLeaderboardData(nextLeaderboard);
        setError(null);
      } catch (err) {
        console.error('Failed to load cohort leaderboard', err);
        if (isMounted) {
          setLeaderboardData([]);
          setError('Cohort leaderboard data is unavailable. Please refresh and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLeaderboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const cohort = useMemo(
    () => leaderboardData.filter((student) => student.school === 'School of ICT'),
    [leaderboardData]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cohort Leaderboard</h1>
        <p className="text-muted-foreground">Rankings inside your school cohort.</p>
      </div>

      {loading ? <PageLoading message="Loading cohort leaderboard..." /> : null}
      {error ? <PageError message={error} actionHref="/student/leaderboard" actionLabel="Back to Leaderboard" /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Top Students</CardTitle>
          <CardDescription>Updated weekly based on performance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loading && !error && cohort.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cohort rankings will appear once students earn points.</p>
          ) : (
            cohort.map((student) => (
              <div key={student.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {student.rank}
                  </div>
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.school}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <Badge variant="secondary">{student.points} pts</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
