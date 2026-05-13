'use client';

import { useEffect, useState } from 'react';
import { getBadges } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';
import type { Badge as BadgeType } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function LeaderboardBadgesPage() {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBadges() {
      try {
        const nextBadges = await getBadges();
        if (!isMounted) return;
        setBadges(nextBadges);
        setError(null);
      } catch (err) {
        console.error('Failed to load badges', err);
        if (isMounted) {
          setBadges([]);
          setError('Badge progress is unavailable. Please refresh and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBadges();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Badges</h1>
        <p className="text-muted-foreground">Achievements earned during your studies.</p>
      </div>

      {loading ? <PageLoading message="Loading badge progress..." /> : null}
      {error ? <PageError message={error} actionHref="/student/leaderboard" actionLabel="Back to Leaderboard" /> : null}

      <Card>
        <CardHeader>
          <CardTitle>My Achievements</CardTitle>
          <CardDescription>Unlock more by completing modules and exams.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {!loading && !error && badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">Badges will appear once you earn achievements.</p>
          ) : (
            badges.map((badge) => (
              <div key={badge.id} className="flex items-start gap-3 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{badge.title}</p>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                  <Badge variant="secondary" className="mt-2">
                    Earned
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
