'use client';

import { useEffect, useState } from 'react';
import { Gift, History, ShieldCheck, Sparkles } from 'lucide-react';

import { NovaInlineActions } from '@/components/ai/nova-inline-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getMyShortCourses, type ShortCourseEnrollmentSummary } from '@/lib/api/short-courses';
import { getStudentRewards, redeemStudentReward, type RewardHistoryItem, type RewardShopItem } from '@/lib/api/student-gamification';

type RewardsState = { balance: number; shop: RewardShopItem[]; history: RewardHistoryItem[] };

export default function StudentRewardsPage() {
  const [data, setData] = useState<RewardsState | null>(null);
  const [journeys, setJourneys] = useState<ShortCourseEnrollmentSummary[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [rewards, myJourneys] = await Promise.all([
      getStudentRewards(),
      getMyShortCourses().catch(() => []),
    ]);
    setData(rewards);
    setJourneys(myJourneys);
    const firstCourseId = myJourneys.find((item) => item.course?.id)?.course?.id ?? '';
    setSelectedCourseId((current) => current || firstCourseId);
  }

  useEffect(() => {
    refresh().catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load rewards.'));
  }, []);

  async function claim(code: string) {
    const requiresCourse = code === 'access_day' || code === 'ai_boost';
    if (requiresCourse && !selectedCourseId) {
      setError('Choose a Journey before using this reward.');
      return;
    }

    setBusy(code);
    setNotice(null);
    setError(null);
    try {
      const response = await redeemStudentReward(code, requiresCourse ? selectedCourseId : null);
      setNotice(response.message);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to claim this reward.');
    } finally {
      setBusy(null);
    }
  }

  if (error) return <PageError message={error} actionHref="/student/courses" actionLabel="Back to Journeys" />;
  if (!data) return <PageLoading message="Loading rewards..." />;

  const targetableJourneys = journeys.filter((item) => item.course?.id);
  const selectedJourneyTitle = targetableJourneys.find((item) => item.course?.id === selectedCourseId)?.course?.title;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Rewards</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Turn learning activity into platform perks</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Reward points are separate from XP. XP shows status; points unlock helpful platform tools like AI boosts, streak shields, and access-day support.</p>
        {notice ? <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm">{notice}</div> : null}
      </section>

      <NovaInlineActions
        title="Nova Reward Advisor"
        description="Ask Nova whether to redeem now, save points, or choose a Journey reward."
        courseId={selectedCourseId || null}
        actions={[
          { label: 'Which reward should I redeem?', mode: 'explain', intent: 'reward_advice' },
          { label: 'Should I save points?', mode: 'explain', intent: 'save_or_redeem' },
          { label: 'Explain my rewards', mode: 'explain', intent: 'explain_rewards' },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card className="rounded-3xl border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Reward points balance</CardTitle>
              <CardDescription>Complete quests, missions, Training Arena battles, Boss Battles, and Final Trials to grow this balance.</CardDescription>
            </CardHeader>
            <CardContent><p className="text-5xl font-bold">{data.balance.toLocaleString()} pts</p></CardContent>
          </Card>

          {targetableJourneys.length ? (
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Choose reward Journey</CardTitle>
                <CardDescription>AI and access rewards will be applied to this Journey.</CardDescription>
              </CardHeader>
              <CardContent>
                <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
                  {targetableJourneys.map((item) => <option key={item.course!.id} value={item.course!.id}>{item.course!.title}</option>)}
                </select>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {data.shop.map((item) => {
              const requiresCourse = item.code === 'access_day' || item.code === 'ai_boost';
              const disabled = !item.enabled || data.balance < item.cost || busy === item.code || (requiresCourse && !selectedCourseId);
              return (
                <Card key={item.code} className="rounded-3xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">{iconFor(item.code)} {item.name}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-2xl font-bold">{item.cost.toLocaleString()} pts</p>
                    {requiresCourse ? <p className="text-xs text-muted-foreground">Journey: {selectedJourneyTitle || 'Choose one first'}</p> : null}
                    <Button className="w-full" disabled={disabled} onClick={() => claim(item.code)}>
                      {!item.enabled ? 'Coming soon' : busy === item.code ? 'Working...' : data.balance >= item.cost ? 'Use points' : 'Need more points'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Points history</CardTitle>
            <CardDescription>Recent point activity appears here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.history.length ? data.history.map((item) => (
              <div key={item.id} className="rounded-2xl border p-3 text-sm">
                <div className="flex justify-between gap-3"><p className="font-medium">{item.title}</p><strong>{item.points}</strong></div>
                <p className="mt-1 text-xs text-muted-foreground">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}</p>
              </div>
            )) : <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">No point activity yet. Finish today’s quests to begin.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function iconFor(code: string) {
  if (code.includes('streak')) return <ShieldCheck className="h-5 w-5 text-primary" />;
  if (code.includes('ai')) return <Sparkles className="h-5 w-5 text-primary" />;
  return <Gift className="h-5 w-5 text-primary" />;
}
