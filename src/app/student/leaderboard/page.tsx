'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Award, BadgeCheck, Flame, Medal, Sparkles, Target, Trophy, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Progress } from '@/components/ui/progress';
import { getMyShortCourses, type ShortCourseEnrollmentSummary } from '@/lib/api/short-courses';
import {
  getShortCourseLeaderboard,
  getStudentActivityLeaderboard,
  getStudentGamification,
  type GamificationState,
  type LeaderboardRow,
  type ShortCourseLeaderboard,
  type ShortCourseLeaderboardPeriod,
} from '@/lib/api/student-gamification';

type LeaguePeriod = ShortCourseLeaderboardPeriod;

const periods: Array<{ key: LeaguePeriod; label: string }> = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'all_time', label: 'All Time' },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaguePeriod>('weekly');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [journeyRows, setJourneyRows] = useState<LeaderboardRow[]>([]);
  const [myJourneyRank, setMyJourneyRank] = useState<LeaderboardRow | null>(null);
  const [gamification, setGamification] = useState<GamificationState | null>(null);
  const [journeys, setJourneys] = useState<ShortCourseEnrollmentSummary[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadBase() {
      setLoading(true);
      setError(null);
      try {
        const [state, myJourneys] = await Promise.all([
          getStudentGamification(),
          getMyShortCourses().catch(() => []),
        ]);
        if (!mounted) return;
        setGamification(state);
        setJourneys(myJourneys);
        const active = myJourneys.find((item) => item.course?.id && Number(item.progress ?? 0) < 100) ?? myJourneys.find((item) => item.course?.id);
        setSelectedCourseId((current) => current || active?.course?.id || '');
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Activity League is unavailable.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadBase();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadLeaderboards() {
      try {
        const [globalRows, journeyBoard] = await Promise.all([
          getStudentActivityLeaderboard(period),
          selectedCourseId ? getShortCourseLeaderboard(selectedCourseId, period).catch(() => null) : Promise.resolve(null),
        ]);
        if (!mounted) return;
        setRows(globalRows);
        setJourneyRows((journeyBoard as ShortCourseLeaderboard | null)?.rows ?? []);
        setMyJourneyRank((journeyBoard as ShortCourseLeaderboard | null)?.myRank ?? null);
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load leaderboard rows.');
      }
    }
    if (!loading && !error) void loadLeaderboards();
    return () => { mounted = false; };
  }, [period, selectedCourseId, loading, error]);

  const activeJourneyTitle = useMemo(() => journeys.find((item) => item.course?.id === selectedCourseId)?.course?.title ?? 'Current Journey', [journeys, selectedCourseId]);
  const badges = gamification?.badges ?? [];
  const nextLevelProgress = gamification ? Math.min(100, Math.round((gamification.xp / Math.max(1, gamification.nextLevelXp)) * 100)) : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Activity League</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Rank by effort, consistency, and real learning</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Cards, missions, Training Arena wins, Final Trials, streaks, badges, and helpful learning activity all count. The scoreboard rewards rhythm, not empty clicks.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild><Link href="/student/courses">Continue a Journey</Link></Button>
          <Button asChild variant="outline"><Link href="/student/rewards">View Rewards</Link></Button>
        </div>
      </section>

      {loading ? <PageLoading message="Loading Activity League..." /> : null}
      {error ? <PageError message={error} actionHref="/student/courses" actionLabel="Back to Journeys" /> : null}

      {!loading && !error && gamification ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Zap} label="XP" value={gamification.xp.toLocaleString()} helper={`Level ${gamification.level} · ${gamification.levelTitle}`} />
            <StatCard icon={Flame} label="Streak" value={`${gamification.streakDays} day${gamification.streakDays === 1 ? '' : 's'}`} helper={gamification.streakProtected ? 'Shield protected' : 'No shield active'} />
            <StatCard icon={Trophy} label="Weekly activity" value={`${gamification.weeklyActivityPoints.toLocaleString()} pts`} helper={gamification.weeklyRank ? `Global rank #${gamification.weeklyRank}` : 'Complete activity to rank'} />
            <StatCard icon={Award} label="Reward points" value={gamification.rewardPoints.toLocaleString()} helper="Spend them on perks" />
          </div>

          <Card className="rounded-3xl border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Growth progress</CardTitle>
              <CardDescription>{gamification.novaMessage}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">Level {gamification.level} · {gamification.levelTitle}</span>
                <span className="text-muted-foreground">Next: {gamification.nextLevelXp.toLocaleString()} XP</span>
              </div>
              <Progress value={nextLevelProgress} className="h-3" />
              <div className="grid gap-3 md:grid-cols-3">
                <RankBox label="Global weekly" rank={gamification.rankings?.globalWeekly?.rank} points={gamification.rankings?.globalWeekly?.points} />
                <RankBox label="Global all-time" rank={gamification.rankings?.globalAllTime?.rank} points={gamification.rankings?.globalAllTime?.points} />
                <RankBox label="Journey weekly" rank={gamification.rankings?.activeCourseWeekly?.rank} points={gamification.rankings?.activeCourseWeekly?.points} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <Card className="rounded-3xl">
                <CardHeader>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Global League</CardTitle>
                      <CardDescription>Platform-wide activity ranking for the selected period.</CardDescription>
                    </div>
                    <PeriodPicker period={period} setPeriod={setPeriod} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <LeaderboardRows rows={rows} empty="No global activity yet for this period." />
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Journey League</CardTitle>
                      <CardDescription>{selectedCourseId ? `${activeJourneyTitle} ranking for the selected period.` : 'Join a Journey to unlock course-specific rankings.'}</CardDescription>
                    </div>
                    {journeys.length ? (
                      <select className="h-11 rounded-2xl border bg-background px-3 text-sm" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
                        {journeys.filter((item) => item.course?.id).map((item) => <option key={item.course!.id} value={item.course!.id}>{item.course!.title}</option>)}
                      </select>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {myJourneyRank ? <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm"><strong>Your Journey rank:</strong> #{myJourneyRank.rank} · {myJourneyRank.activityPoints.toLocaleString()} pts · {myJourneyRank.streakDays}-day streak</div> : null}
                  <LeaderboardRows rows={journeyRows} empty={selectedCourseId ? 'No Journey activity yet for this period.' : 'No active Journey selected.'} />
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-6">
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-primary" /> Badges</CardTitle>
                  <CardDescription>Badges are earned from XP, Arena wins, missions, and Final Trial milestones.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {badges.length ? badges.map((badge) => (
                    <div key={badge} className="flex items-center gap-3 rounded-2xl border bg-primary/5 p-3">
                      <BadgeCheck className="h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="font-semibold">{badge}</p>
                        <p className="text-xs text-muted-foreground">Unlocked</p>
                      </div>
                    </div>
                  )) : <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">No badges yet. Complete your first mission or win an Arena battle.</p>}
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Flame className="h-5 w-5 text-primary" /> Streak health</CardTitle>
                  <CardDescription>Streak grows when valid learning activity is recorded each day.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <InfoLine label="Current streak" value={`${gamification.streakDays} day${gamification.streakDays === 1 ? '' : 's'}`} />
                  <InfoLine label="Shield" value={gamification.streakProtected ? 'Available' : 'Not active'} />
                  <InfoLine label="Best move" value="Complete one mission or Arena win today" />
                </CardContent>
              </Card>
            </aside>
          </div>
        </>
      ) : null}
    </div>
  );
}

function PeriodPicker({ period, setPeriod }: { period: LeaguePeriod; setPeriod: (period: LeaguePeriod) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((item) => (
        <button key={item.key} type="button" onClick={() => setPeriod(item.key)} className={`rounded-full border px-3 py-2 text-sm font-medium transition ${period === item.key ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/60'}`}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

function LeaderboardRows({ rows, empty }: { rows: LeaderboardRow[]; empty: string }) {
  if (!rows.length) return <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{empty}</p>;

  return rows.map((student) => (
    <div key={`${student.rank}-${student.studentId}`} className={`grid gap-3 rounded-2xl border p-4 sm:grid-cols-[80px_1fr_180px] sm:items-center ${student.rank <= 3 ? 'border-primary/20 bg-primary/5' : ''}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">#{student.rank}</span>
        {student.rank <= 3 ? <Medal className="h-5 w-5 text-primary" /> : null}
      </div>
      <div>
        <p className="text-lg font-semibold">{student.name}</p>
        <p className="text-sm text-muted-foreground">{student.levelTitle || 'New Learner'} · {student.missionsCompleted ?? 0} missions · {student.practicesPassed ?? 0} Arena wins</p>
      </div>
      <div className="text-left sm:text-right">
        <p className="text-xl font-bold">{student.activityPoints.toLocaleString()} pts</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground sm:justify-end"><Flame className="h-4 w-4" /> {student.streakDays}-day streak</p>
      </div>
    </div>
  ));
}

function StatCard({ icon: Icon, label, value, helper }: { icon: React.ElementType; label: string; value: string; helper: string }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="space-y-2 p-4">
        <Icon className="h-5 w-5 text-primary" />
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function RankBox({ label, rank, points }: { label: string; rank?: number | null; points?: number | null }) {
  return <div className="rounded-2xl border bg-muted/20 p-3"><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{rank ? `#${rank}` : 'Calculating'}</p><p className="text-xs text-muted-foreground">{Number(points ?? 0).toLocaleString()} pts</p></div>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-2xl border p-3"><span className="text-muted-foreground">{label}</span><strong className="text-right">{value}</strong></div>;
}
