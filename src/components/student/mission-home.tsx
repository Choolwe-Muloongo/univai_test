'use client';

import Link from 'next/link';
import type { ElementType } from 'react';
import { ArrowRight, BookOpen, Gift, Sparkles, Target, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DailyQuests } from '@/components/gamification/daily-quests';
import { StreakFlame } from '@/components/gamification/streak-flame';
import { XpBar } from '@/components/gamification/xp-bar';
import type { GamificationState } from '@/lib/api/student-gamification';
import type { ShortCourseEnrollmentSummary } from '@/lib/api/short-courses';
import { accessLabel, formatExpiryDate, timeRemainingLabel } from '@/lib/short-course-ui';

export function MissionHome({ learnerName, activeJourney, gamification }: { learnerName?: string | null; activeJourney?: ShortCourseEnrollmentSummary | null; gamification: GamificationState }) {
  const course = activeJourney?.course;
  const progress = activeJourney?.progress ?? 0;
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Mission Home</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Welcome back{learnerName ? `, ${learnerName}` : ''} 👋</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Nova has prepared your learning path for today. Protect your streak, finish one focused mission, and keep building proof of real skill.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <MiniStat icon={Trophy} label="Level" value={`${gamification.level} ${gamification.levelTitle}`} />
              <MiniStat icon={Sparkles} label="XP" value={gamification.xp.toLocaleString()} />
              <MiniStat icon={Gift} label="Reward points" value={gamification.rewardPoints.toLocaleString()} />
              <MiniStat icon={Target} label="Weekly rank" value={gamification.weeklyRank ? `#${gamification.weeklyRank}` : 'Unranked'} />
            </div>
          </div>
          <div className="rounded-3xl border bg-primary/5 p-4">
            <p className="text-sm font-semibold text-primary">Nova says</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{gamification.novaMessage}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {course ? <Button asChild><Link href={`/student/courses/${course.id}`}>Start Mission</Link></Button> : <Button asChild><Link href="/student/courses">Find a Journey</Link></Button>}
              {course ? <Button asChild variant="outline"><Link href={`/student/courses/${course.id}/practice`}>Train Weak Area</Link></Button> : null}
              <Button asChild variant="outline"><Link href="/student/ai">Ask Nova</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card className="rounded-3xl border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle>Continue Mission</CardTitle>
              <CardDescription>{course ? 'Your next focused learning run is ready.' : 'Join a Journey to unlock your first mission.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {course ? (
                <>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-2xl font-bold">{course.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Stage: {course.level ?? 'Foundation'} · Reward: +50 XP · Time: 8 minutes</p>
                    </div>
                    <Button asChild className="w-full lg:w-auto"><Link href={`/student/courses/${course.id}`}>Continue Mission <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Mission Progress</span><strong>{progress}%</strong></div>
                    <Progress value={progress} className="h-3" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <InfoBox label="Access" value={accessLabel(activeJourney)} />
                    <InfoBox label="Time left" value={timeRemainingLabel(activeJourney?.accessExpiresAt)} />
                    <InfoBox label="Expires" value={formatExpiryDate(activeJourney?.accessExpiresAt)} />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed p-8 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-primary" />
                  <p className="mt-3 font-semibold">No active Journey yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Start with one short course and UnivAI will turn it into a mission path.</p>
                  <Button asChild className="mt-4"><Link href="/student/courses">Browse Journeys</Link></Button>
                </div>
              )}
            </CardContent>
          </Card>
          <DailyQuests quests={gamification.quests} />
        </div>
        <aside className="space-y-5">
          <XpBar xp={gamification.xp} level={gamification.level} levelTitle={gamification.levelTitle} nextLevelXp={gamification.nextLevelXp} />
          <StreakFlame days={gamification.streakDays} protectedToday={gamification.streakProtected} />
          <Card className="rounded-3xl">
            <CardHeader><CardTitle>Activity preview</CardTitle><CardDescription>Activity points rank students across the whole platform, not only one course.</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoBox label="Weekly activity" value={`${gamification.weeklyActivityPoints} pts`} />
              <InfoBox label="Badges" value={gamification.badges.join(', ') || 'None yet'} />
              <Button asChild variant="outline" className="w-full"><Link href="/student/leaderboard">View Leaderboard</Link></Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return <div className="rounded-2xl border bg-muted/20 p-3"><Icon className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}

function InfoBox({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-2xl border bg-muted/20 p-3"><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value || 'Not set'}</p></div>;
}
