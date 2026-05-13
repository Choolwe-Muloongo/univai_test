'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getLeaderboard } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { LeaderboardStudent } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function LeaderboardPage() {
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
        console.error('Failed to load leaderboard', err);
        if (isMounted) {
          setLeaderboardData([]);
          setError('Leaderboard data is unavailable. Please refresh and try again.');
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">
          See how you stack up against your peers. Keep learning to climb the ranks!
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/student/leaderboard/class">Class Rankings</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/student/leaderboard/badges">Badge Progress</Link>
        </Button>
      </div>

      {loading ? <PageLoading message="Loading leaderboard..." /> : null}
      {error ? <PageError message={error} actionHref="/student/dashboard" actionLabel="Back to Dashboard" /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Top Students</CardTitle>
          <CardDescription>Based on points earned from completing modules, high scores, and community participation.</CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && !error && leaderboardData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Leaderboard data will appear once students earn points.</p>
          ) : (
            <div className="space-y-4">
              {leaderboardData.map((student, index) => (
                <div key={student.id} className={`flex items-center gap-4 rounded-lg border p-4 ${index < 3 ? 'bg-muted/50' : ''}`}>
                  <div className="flex w-12 items-center gap-4">
                    <span className="text-xl font-bold text-muted-foreground">#{student.rank}</span>
                    {student.rank <= 3 && <Trophy className={`h-6 w-6 ${
                        student.rank === 1 ? 'text-yellow-500' :
                        student.rank === 2 ? 'text-slate-400' :
                        'text-yellow-700'
                    }`} />}
                  </div>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={student.avatar} alt={student.name} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.school}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{student.points} pts</p>
                    <Badge variant={student.rank <= 10 ? 'default' : 'secondary'}>
                      {student.rank <= 10 ? `Top ${student.rank}` : `Top ${Math.ceil(student.rank / 10) * 10}%`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
