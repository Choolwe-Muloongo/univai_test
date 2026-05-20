'use client';

import { useEffect, useState } from 'react';
import { Gift, History, ShieldCheck, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getStudentRewards, redeemStudentReward, type RewardHistoryItem, type RewardShopItem } from '@/lib/api/student-gamification';

type RewardsState = { balance: number; shop: RewardShopItem[]; history: RewardHistoryItem[] };

export default function StudentRewardsPage() {
  const [data, setData] = useState<RewardsState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setData(await getStudentRewards());
  }

  useEffect(() => {
    refresh().catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load rewards.'));
  }, []);

  async function claim(code: string) {
    setBusy(code);
    setNotice(null);
    setError(null);
    try {
      const response = await redeemStudentReward(code);
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

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Rewards</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Turn learning activity into platform perks</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Reward points are separate from XP. XP shows status; points unlock helpful platform tools like AI boosts, streak shields, and access-day support.</p>
        {notice ? <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm">{notice}</div> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card className="rounded-3xl border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Reward points balance</CardTitle>
              <CardDescription>Complete quests, missions, Training Arena battles, Boss Battles, and Final Trials to grow this balance.</CardDescription>
            </CardHeader>
            <CardContent><p className="text-5xl font-bold">{data.balance.toLocaleString()} pts</p></CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {data.shop.map((item) => (
              <Card key={item.code} className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">{iconFor(item.code)} {item.name}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-2xl font-bold">{item.cost.toLocaleString()} pts</p>
                  <Button className="w-full" disabled={!item.enabled || data.balance < item.cost || busy === item.code} onClick={() => claim(item.code)}>
                    {!item.enabled ? 'Coming soon' : busy === item.code ? 'Working...' : data.balance >= item.cost ? 'Use points' : 'Need more points'}
                  </Button>
                </CardContent>
              </Card>
            ))}
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
