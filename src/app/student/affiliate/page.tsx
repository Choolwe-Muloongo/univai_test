'use client';

import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, BadgeCheck, Copy, ExternalLink, Link2, Share2, ShieldCheck, Target, Trophy, Users, Wallet, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { applyForAffiliate, getMyAffiliate, requestAffiliateUpgrade, requestMyAffiliatePayout } from '@/lib/api/student-affiliate';
import type { AffiliateRecord } from '@/lib/api/types';

type ApplyForm = {
  displayName: string;
  payoutPhone: string;
  payoutOperator: 'airtel' | 'mtn' | 'zamtel';
  applicationReason: string;
  promotionChannels: string;
  acceptedTerms: boolean;
};

const defaultApplyForm: ApplyForm = {
  displayName: '',
  payoutPhone: '',
  payoutOperator: 'airtel',
  applicationReason: '',
  promotionChannels: 'WhatsApp, campus groups',
  acceptedTerms: false,
};

const tierLabels: Record<string, string> = {
  starter: 'Starter Affiliate',
  campus_promoter: 'Campus Promoter',
  ambassador: 'UnivAI Ambassador',
  elite_partner: 'Elite Affiliate',
};

export default function StudentAffiliatePage() {
  const [affiliate, setAffiliate] = useState<AffiliateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyForm, setApplyForm] = useState<ApplyForm>(defaultApplyForm);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [incomeGoal, setIncomeGoal] = useState(1000);

  async function refresh() {
    const data = await getMyAffiliate();
    setAffiliate(data);
  }

  useEffect(() => {
    let mounted = true;
    getMyAffiliate()
      .then((data) => { if (mounted) setAffiliate(data); })
      .catch(() => { if (mounted) setAffiliate(null); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const affiliateStatus = String(affiliate?.status ?? '').toLowerCase();
  const hasAffiliateAccess = Boolean(affiliate?.id && affiliateStatus === 'active');
  const applicationIsPending = Boolean(affiliate?.id && affiliateStatus === 'pending');
  const applicationWasRejected = Boolean(affiliate?.id && affiliateStatus === 'rejected');

  const referralLink = useMemo(() => {
    if (!hasAffiliateAccess || !affiliate?.code || typeof window === 'undefined') return '';
    return `${window.location.origin}/register/short-courses?ref=${encodeURIComponent(affiliate.code)}`;
  }, [affiliate?.code, hasAffiliateAccess]);

  const whatsappLink = useMemo(() => {
    if (!referralLink) return '';
    return `https://wa.me/?text=${encodeURIComponent(`Join UnivAI short courses with my code ${affiliate?.code}. You get 10% off your first access payment: ${referralLink}`)}`;
  }, [referralLink, affiliate?.code]);

  async function copyText(value: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function submitApplication() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const channels = applyForm.promotionChannels.split(',').map((item) => item.trim()).filter(Boolean);
      const next = await applyForAffiliate({
        displayName: applyForm.displayName || undefined,
        payoutPhone: applyForm.payoutPhone,
        payoutOperator: applyForm.payoutOperator,
        payoutCountry: 'zm',
        applicationReason: applyForm.applicationReason,
        promotionChannels: channels,
        acceptedTerms: applyForm.acceptedTerms,
      });
      setAffiliate(next);
      setMessage('Affiliate application submitted. Admin will review it.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit affiliate application.');
    } finally {
      setSaving(false);
    }
  }

  async function submitWithdrawal() {
    const amount = Number(withdrawAmount || 0);
    if (amount <= 0 || !affiliate) return;
    setWithdrawing(true);
    setMessage(null);
    setError(null);
    try {
      const payout = await requestMyAffiliatePayout({
        amount,
        currency: 'ZMW',
        phone: affiliate.payoutPhone || undefined,
        operator: affiliate.payoutOperator || undefined,
        country: affiliate.payoutCountry || 'zm',
      });
      setWithdrawAmount('');
      setMessage(payout.status === 'pending_review' ? 'Withdrawal sent for admin review.' : 'Withdrawal submitted to Lenco.');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to request withdrawal.');
    } finally {
      setWithdrawing(false);
    }
  }

  async function submitUpgradeRequest() {
    setUpgrading(true);
    setMessage(null);
    setError(null);
    try {
      await requestAffiliateUpgrade('I am requesting an upgrade based on my current access payments and revenue.');
      setMessage('Upgrade request submitted for admin review.');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to request upgrade.');
    } finally {
      setUpgrading(false);
    }
  }

  if (loading) return <PageLoading message="Loading affiliate dashboard..." />;

  if (!affiliate || (!hasAffiliateAccess && !applicationIsPending)) {
    return (
      <AffiliateApplicationView
        rejected={applicationWasRejected}
        message={message}
        error={error}
        applyForm={applyForm}
        setApplyForm={setApplyForm}
        saving={saving}
        onSubmit={submitApplication}
      />
    );
  }

  if (applicationIsPending) {
    return (
      <main className="space-y-6">
        <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Affiliate Application</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Your application is under review</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Admin will review your account. Once approved, your referral link and earnings dashboard will unlock.</p>
        </section>
      </main>
    );
  }

  const tier = String(affiliate.tier ?? 'starter');
  const challenge = affiliate.monthlyChallenge ?? {};
  const upgrade = affiliate.upgradeEligibility ?? {};
  const tierHealth = affiliate.tierHealth ?? { status: 'safe', message: 'Tier health will be reviewed monthly.' };
  const available = Number(affiliate.summary?.availableToWithdraw ?? 0);
  const recentEarnings = Array.isArray(affiliate.recentEarnings) ? affiliate.recentEarnings : [];
  const recentReferrals = Array.isArray(affiliate.recentReferrals) ? affiliate.recentReferrals : [];
  const recentPayouts = Array.isArray(affiliate.recentPayouts) ? affiliate.recentPayouts : [];
  const leaderboardRows = Array.isArray(affiliate.tierLeaderboard) ? affiliate.tierLeaderboard : [];
  const badges = Array.isArray(affiliate.badges) ? affiliate.badges : [];
  const entryFeesPaid = Number(challenge.entryFeesPaid ?? 0);
  const requiredEntryFees = Number(challenge.requiredEntryFees ?? 5);
  const accessPaymentsPaid = Number(challenge.accessPaymentsPaid ?? 0);
  const requiredAccessPayments = Number(challenge.requiredAccessPayments ?? 3);
  const accessRevenue = Number(challenge.accessRevenue ?? 0);
  const score = Number(challenge.score ?? 0);
  const rank = challenge.rank ? Number(challenge.rank) : null;
  const commissionEarnedThisMonth = sumRows(recentEarnings, 'commissionAmount');
  const remainingGoal = Math.max(0, incomeGoal - commissionEarnedThisMonth);
  const averageAccessCommission = accessPaymentsPaid > 0 ? commissionEarnedThisMonth / accessPaymentsPaid : Math.max(5, Number(affiliate.shortCourseRate ?? 10) / 100 * 50);
  const estimatedAccessNeeded = averageAccessCommission > 0 ? Math.ceil(remainingGoal / averageAccessCommission) : 0;
  const pendingUpgrade = affiliate.pendingUpgradeRequest;
  const canRequestUpgrade = Boolean(upgrade.eligible && !pendingUpgrade);

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Affiliate Control Center</p>
            <h1 className="text-3xl font-bold tracking-tight">Grow your UnivAI affiliate income</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Entry fees qualify you. Access payments rank you and create your main commission.</p>
          </div>
          <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
            <p className="text-muted-foreground">Current tier</p>
            <p className="text-2xl font-bold tracking-wide">{affiliate.tierLabel ?? tierLabels[tier] ?? 'Starter Affiliate'}</p>
            <p className="text-xs text-muted-foreground">Code: {affiliate.code}</p>
            <p className="mt-2 text-xs font-medium text-primary">Tier health: {tierHealth.status ?? 'safe'}</p>
          </div>
        </div>
      </section>

      {message ? <Notice>{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Available" value={money(available)} icon={Wallet} />
        <MetricCard title="This month" value={money(commissionEarnedThisMonth)} icon={Wallet} />
        <MetricCard title="Entry paid" value={`${entryFeesPaid}/${requiredEntryFees}`} icon={Users} />
        <MetricCard title="Access paid" value={`${accessPaymentsPaid}/${requiredAccessPayments}`} icon={ShieldCheck} />
        <MetricCard title="Access revenue" value={money(accessRevenue)} icon={Target} />
        <MetricCard title="Rank" value={rank ? `#${rank}` : 'Not qualified'} icon={Trophy} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-3xl border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Monthly Challenge</CardTitle>
            <CardDescription>{tierLabels[tier] ?? 'Your tier'} leaderboard qualification and score.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ProgressLine label="Entry fees paid" value={entryFeesPaid} target={requiredEntryFees} />
            <ProgressLine label="Access payments paid" value={accessPaymentsPaid} target={requiredAccessPayments} />
            <div className="rounded-2xl border bg-background p-4">
              <p className="font-semibold">Status: {challenge.qualified ? 'Qualified' : 'Not qualified yet'}</p>
              <p className="mt-1 text-muted-foreground">Score: {score} points. Points to Top 3: {challenge.pointsToTopThree ?? 0}.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Monthly income goal</CardTitle>
            <CardDescription>Estimate how many more access payments you need.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Field label="Goal amount"><Input type="number" min={100} step={50} value={incomeGoal} onChange={(event) => setIncomeGoal(Number(event.target.value || 0))} /></Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="Earned" value={money(commissionEarnedThisMonth)} />
              <MiniStat label="Remaining" value={money(remainingGoal)} />
              <MiniStat label="Access needed" value={`${estimatedAccessNeeded}`} />
            </div>
            <p className="text-xs text-muted-foreground">This is an estimate, not a guarantee.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Your {tierLabels[tier] ?? 'tier'} leaderboard</CardTitle>
          <CardDescription>Full tier list. Top 3 bonuses require admin review before payout.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-muted-foreground"><tr className="border-b"><th className="py-3 pr-4">Rank</th><th className="py-3 pr-4">Affiliate</th><th className="py-3 pr-4">Badges</th><th className="py-3 pr-4">Access</th><th className="py-3 pr-4">Revenue</th><th className="py-3 pr-4">Score</th><th className="py-3 pr-4">Prize</th></tr></thead>
            <tbody>
              {leaderboardRows.map((row: Record<string, any>, index: number) => (
                <tr key={`${row.affiliateName ?? index}-${index}`} className="border-b last:border-0"><td className="py-3 pr-4 font-semibold">#{row.rank ?? index + 1}</td><td className="py-3 pr-4">{row.affiliateName ?? 'Affiliate'}</td><td className="py-3 pr-4"><BadgeList badges={row.badges ?? []} /></td><td className="py-3 pr-4">{row.accessPaymentsPaid ?? 0}</td><td className="py-3 pr-4">{money(row.accessRevenue ?? 0)}</td><td className="py-3 pr-4">{row.score ?? 0}</td><td className="py-3 pr-4">{row.prizeAmount ? money(row.prizeAmount) : '—'}</td></tr>
              ))}
              {!leaderboardRows.length ? <tr><td className="py-4 text-muted-foreground" colSpan={7}>No leaderboard data yet. Keep promoting access payments.</td></tr> : null}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" /> Referral link and promo tools</CardTitle>
            <CardDescription>Students using your code get 10% off their first access payment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-muted/30 p-4 text-sm break-all">{referralLink || 'Referral link unlocks after approval.'}</div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button onClick={() => copyText(referralLink)} disabled={!referralLink} className="gap-2"><Copy className="h-4 w-4" /> {copied ? 'Copied!' : 'Copy link'}</Button>
              <Button onClick={() => copyText(`I am inviting you to UnivAI short courses. Use my code ${affiliate.code} to get 10% off your first access payment. Start here: ${referralLink}`)} disabled={!referralLink} variant="outline" className="gap-2"><Copy className="h-4 w-4" /> Copy caption</Button>
              <Button asChild variant="outline" className="gap-2"><a href={whatsappLink || '#'} target="_blank" rel="noreferrer"><Share2 className="h-4 w-4" /> Share WhatsApp</a></Button>
              <Button asChild variant="outline" className="gap-2"><a href={referralLink || '#'} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Open</a></Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Follow-up pipeline</CardTitle>
            <CardDescription>Focus on converting entry-paid learners into access-paid learners.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <MiniStat label="Signed up / leads" value={String(affiliate.summary?.verifiedSignups ?? recentReferrals.length)} />
            <MiniStat label="Entry paid" value={String(entryFeesPaid)} />
            <MiniStat label="Access paid" value={String(accessPaymentsPaid)} />
            <MiniStat label="Access revenue" value={money(accessRevenue)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="rounded-3xl">
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Upgrade progress</CardTitle><CardDescription>{upgrade.nextTier ? `Next tier: ${tierLabels[upgrade.nextTier]}` : 'You are on the highest tier.'}</CardDescription></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {upgrade.nextTier ? <><ProgressLine label="Lifetime access payments" value={Number(upgrade.accessPayments ?? 0)} target={Number(upgrade.requiredAccessPayments ?? 0)} /><ProgressLine label="Lifetime access revenue" value={Number(upgrade.accessRevenue ?? 0)} target={Number(upgrade.requiredAccessRevenue ?? 0)} money /><div className="rounded-2xl border bg-muted/30 p-4"><p className="font-semibold">{pendingUpgrade ? 'Upgrade request pending' : canRequestUpgrade ? 'Eligible to request upgrade' : 'Keep working to unlock upgrade'}</p><p className="mt-1 text-muted-foreground">Upgrades require access payments, revenue, activity, and clean behavior.</p>{canRequestUpgrade ? <Button className="mt-3" onClick={submitUpgradeRequest} disabled={upgrading}>{upgrading ? 'Sending...' : 'Request upgrade'}</Button> : null}</div></> : <p className="rounded-2xl border bg-muted/30 p-4 text-muted-foreground">Maintain Elite performance to keep recurring commission active.</p>}
          </CardContent>
        </Card>
        <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Tier health</CardTitle><CardDescription>Higher tiers must be maintained every month.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><p className="text-2xl font-bold">{tierHealth.status ?? 'safe'}</p><p className="text-muted-foreground">{tierHealth.message}</p></CardContent></Card>
        <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-primary" /> Badges</CardTitle><CardDescription>Status rewards for performance and consistency.</CardDescription></CardHeader><CardContent><BadgeList badges={badges} /></CardContent></Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader><CardTitle>Withdraw earnings</CardTitle><CardDescription>Automatic Lenco payout is available for clean accounts within your tier limit.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"><Field label={`Amount - available ${money(available)}`}><Input type="number" min={50} value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} placeholder="50" /></Field><div className="rounded-2xl border bg-muted/30 p-3 text-sm"><strong>Minimum:</strong> K50<br /><span className="text-muted-foreground">Daily auto limit: {money(affiliate.autoPayoutDailyLimit)}</span></div><Button onClick={submitWithdrawal} disabled={withdrawing || available < 50 || Number(withdrawAmount || 0) < 50}>{withdrawing ? 'Processing...' : 'Withdraw now'}</Button></CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <HistoryCard title="Referrals" empty="No referrals yet.">{recentReferrals.map((referral: Record<string, any>) => <HistoryItem key={referral.id} main={referral.firstPaidAt ? 'Paid referral' : 'Signed up'} meta={`${referral.sourceType} · ${formatDate(referral.createdAt)}`} status={referral.firstPaidAt ? 'paid' : 'pending'} />)}</HistoryCard>
        <HistoryCard title="Earnings" empty="No affiliate earnings yet.">{recentEarnings.map((earning: Record<string, any>) => <HistoryItem key={earning.id} main={money(earning.commissionAmount, earning.currency)} meta={`${earning.sourceType} · ${formatDate(earning.createdAt)}`} status={earning.status} />)}</HistoryCard>
        <HistoryCard title="Payouts" empty="No payout requests yet.">{recentPayouts.map((payout: Record<string, any>) => <HistoryItem key={payout.id} main={money(payout.amount, payout.currency)} meta={`${payout.method ?? 'Payout'} · ${formatDate(payout.requestedAt)}`} status={payout.status} />)}</HistoryCard>
      </div>
    </main>
  );
}

function AffiliateApplicationView({ rejected, message, error, applyForm, setApplyForm, saving, onSubmit }: { rejected: boolean; message: string | null; error: string | null; applyForm: ApplyForm; setApplyForm: React.Dispatch<React.SetStateAction<ApplyForm>>; saving: boolean; onSubmit: () => void }) {
  return <main className="space-y-6"><section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6"><p className="text-sm font-semibold uppercase tracking-wide text-primary">Affiliate Program</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{rejected ? 'Request affiliate access again' : 'Become a UnivAI Affiliate'}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Share UnivAI short courses and earn when referred learners register, pay the entry fee, and buy course access.</p></section>{rejected ? <Notice tone="error"><span className="inline-flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> Your previous affiliate request was not approved. Update your reason, payout details, and channels, then request access again.</span></Notice> : null}{message ? <Notice>{message}</Notice> : null}{error ? <Notice tone="error">{error}</Notice> : null}<Card className="rounded-3xl"><CardHeader><CardTitle>Apply to become an affiliate</CardTitle><CardDescription>Approved students start as Starter Affiliates. Elite recurring commission is locked until serious performance is proven.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Field label="Display name"><Input value={applyForm.displayName} onChange={(event) => setApplyForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Your public affiliate name" /></Field><Field label="Mobile money phone"><Input value={applyForm.payoutPhone} onChange={(event) => setApplyForm((current) => ({ ...current, payoutPhone: event.target.value }))} placeholder="097..." /></Field><Field label="Provider"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={applyForm.payoutOperator} onChange={(event) => setApplyForm((current) => ({ ...current, payoutOperator: event.target.value as ApplyForm['payoutOperator'] }))}><option value="airtel">Airtel Money</option><option value="mtn">MTN Money</option><option value="zamtel">Zamtel Money</option></select></Field><Field label="Promotion channels"><Input value={applyForm.promotionChannels} onChange={(event) => setApplyForm((current) => ({ ...current, promotionChannels: event.target.value }))} placeholder="WhatsApp, Facebook, campus groups" /></Field></div><Field label="Why should UnivAI approve you?"><Textarea rows={4} value={applyForm.applicationReason} onChange={(event) => setApplyForm((current) => ({ ...current, applicationReason: event.target.value }))} /></Field><label className="flex items-start gap-3 text-sm text-muted-foreground"><input type="checkbox" className="mt-1" checked={applyForm.acceptedTerms} onChange={(event) => setApplyForm((current) => ({ ...current, acceptedTerms: event.target.checked }))} />I agree not to create fake accounts, self-referrals, or misleading promotions. Suspicious commissions can be reversed.</label><Button onClick={onSubmit} disabled={saving || !applyForm.acceptedTerms || !applyForm.payoutPhone.trim() || !applyForm.applicationReason.trim()} className="w-full">{saving ? 'Submitting...' : 'Submit affiliate application'}</Button></CardContent></Card></main>;
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: LucideIcon }) { return <Card className="rounded-3xl"><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-bold">{value}</p></div><Icon className="h-8 w-8 text-primary" /></CardContent></Card>; }
function MiniStat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function BadgeList({ badges }: { badges: any[] }) { const items = badges.map((badge) => typeof badge === 'string' ? badge : badge.badgeLabel ?? badge.label ?? badge.badge_key ?? 'Badge').filter(Boolean); return <div className="flex flex-wrap gap-2">{items.length ? items.map((badge) => <span key={badge} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{badge}</span>) : <span className="text-muted-foreground">No badges yet</span>}</div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function Notice({ children, tone = 'success' }: { children: ReactNode; tone?: 'success' | 'error' }) { return <div className={`rounded-2xl border p-4 text-sm ${tone === 'error' ? 'border-destructive/40 bg-destructive/5' : 'bg-primary/5'}`}>{children}</div>; }
function ProgressLine({ label, value, target, money: isMoney = false }: { label: string; value: number; target: number; money?: boolean }) { const percentage = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 100; return <div className="space-y-2"><div className="flex justify-between text-sm"><span>{label}</span><span>{isMoney ? `${money(value)} / ${money(target)}` : `${value} / ${target}`}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${percentage}%` }} /></div></div>; }
function HistoryCard({ title, empty, children }: { title: string; empty: string; children: ReactNode }) { const hasItems = Array.isArray(children) ? children.some(Boolean) : Boolean(children); return <Card className="rounded-3xl"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-3">{hasItems ? children : <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">{empty}</p>}</CardContent></Card>; }
function HistoryItem({ main, meta, status }: { main: string; meta: string; status?: string }) { return <div className="rounded-2xl border p-4 text-sm"><div className="flex items-center justify-between gap-3"><strong>{main}</strong><span className="rounded-full bg-muted px-3 py-1 text-xs">{status}</span></div><p className="mt-1 text-muted-foreground">{meta}</p></div>; }
function money(value?: string | number | null, currency = 'ZMW') { const amount = Number(value ?? 0); if (!Number.isFinite(amount)) return `${currency} 0`; return `${currency} ${amount.toLocaleString()}`; }
function formatDate(value?: string | null) { return value ? new Date(value).toLocaleString() : 'No date'; }
function sumRows(rows: Record<string, any>[], field: string) { return rows.reduce((total, row) => total + Number(row?.[field] ?? 0), 0); }
