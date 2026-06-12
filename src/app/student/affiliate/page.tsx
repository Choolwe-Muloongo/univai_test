'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, Copy, ExternalLink, Link2, Share2, Trophy, Users, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { applyForAffiliate, getMyAffiliate, requestMyAffiliatePayout } from '@/lib/api/student-affiliate';
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

export default function StudentAffiliatePage() {
  const [affiliate, setAffiliate] = useState<AffiliateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyForm, setApplyForm] = useState<ApplyForm>(defaultApplyForm);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  async function refresh() {
    const data = await getMyAffiliate();
    setAffiliate(data);
  }

  useEffect(() => {
    let mounted = true;
    getMyAffiliate()
      .then((data) => {
        if (mounted) setAffiliate(data);
      })
      .catch(() => {
        if (mounted) setAffiliate(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const affiliateStatus = String(affiliate?.status ?? '').toLowerCase();
  const hasAffiliateAccess = Boolean(affiliate?.id && affiliateStatus === 'active');
  const applicationIsPending = Boolean(affiliate?.id && affiliateStatus === 'pending');
  const applicationWasRejected = Boolean(affiliate?.id && affiliateStatus === 'rejected');

  const referralLink = useMemo(() => {
    if (!hasAffiliateAccess || !affiliate?.code || typeof window === 'undefined') return '';
    return `${window.location.origin}/register?ref=${encodeURIComponent(affiliate.code)}`;
  }, [affiliate?.code, hasAffiliateAccess]);

  const whatsappLink = useMemo(() => {
    if (!referralLink) return '';
    return `https://wa.me/?text=${encodeURIComponent(`Join UnivAI short courses using my link: ${referralLink}`)}`;
  }, [referralLink]);

  async function copyLink() {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
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
      setMessage(payout.status === 'pending_review'
        ? 'Withdrawal sent for admin review because it passed the automatic payout limit.'
        : 'Withdrawal submitted to Lenco. Check payout status below.');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to request withdrawal.');
    } finally {
      setWithdrawing(false);
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
        <Card className="rounded-3xl">
          <CardHeader><CardTitle>Application details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Name:</strong> {affiliate.displayName || 'Pending affiliate'}</p>
            <p><strong>Payout:</strong> {affiliate.payoutOperator || 'provider pending'} · {affiliate.payoutPhone || 'phone pending'}</p>
            <p><strong>Status:</strong> pending approval</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const available = Number(affiliate.summary?.availableToWithdraw ?? 0);
  const minimumWithdrawal = 50;
  const progress = affiliate.tierProgress ?? {};

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Affiliate Dashboard</p>
            <h1 className="text-3xl font-bold tracking-tight">Earn by sharing UnivAI</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Share your link, track referrals, earn commissions, and withdraw automatically through Lenco.</p>
          </div>
          <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
            <p className="text-muted-foreground">Current tier</p>
            <p className="text-2xl font-bold tracking-wide">{affiliate.tierLabel ?? 'Starter Affiliate'}</p>
            <p className="text-xs text-muted-foreground">Code: {affiliate.code}</p>
          </div>
        </div>
      </section>

      {message ? <Notice>{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Available" value={money(available)} icon={Wallet} />
        <MetricCard title="Total earned" value={money(affiliate.summary?.commissionEarned)} icon={Wallet} />
        <MetricCard title="Paid out" value={money(affiliate.summary?.successfulPayouts)} icon={Wallet} />
        <MetricCard title="Pending payout" value={money(affiliate.summary?.pendingPayouts)} icon={Wallet} />
        <MetricCard title="Paid referrals" value={String(affiliate.summary?.paidReferrals ?? 0)} icon={Users} />
        <MetricCard title="Signups" value={String(affiliate.summary?.verifiedSignups ?? 0)} icon={Users} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" /> Your referral link</CardTitle>
            <CardDescription>Share this with students who want to register or buy short courses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-muted/30 p-4 text-sm break-all">{referralLink || 'Referral link unlocks after approval.'}</div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={copyLink} disabled={!referralLink} className="gap-2"><Copy className="h-4 w-4" /> {copied ? 'Copied!' : 'Copy link'}</Button>
              <Button asChild variant="outline" className="gap-2"><a href={whatsappLink || '#'} target="_blank" rel="noreferrer"><Share2 className="h-4 w-4" /> Share WhatsApp</a></Button>
              <Button asChild variant="outline" className="gap-2"><a href={referralLink || '#'} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Open</a></Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Tier progress</CardTitle>
            <CardDescription>{progress.nextTier ? 'Keep growing to unlock the next tier.' : 'You are on the highest tier.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ProgressLine label="Paid referrals" value={Number(progress.paidReferrals ?? 0)} target={Number(progress.requiredPaidReferrals ?? 0)} />
            <ProgressLine label="Referred revenue" value={Number(progress.referredRevenue ?? 0)} target={Number(progress.requiredReferredRevenue ?? 0)} money />
            <div className="rounded-2xl border bg-muted/30 p-4">
              <p className="font-semibold">Your earnings rule</p>
              <p className="mt-1 text-muted-foreground">Entry bonus applies once. First access purchase pays {affiliate.shortCourseRate ?? 10}%. Recurring commission is {affiliate.recurringCommissionEnabled ? `enabled for ${affiliate.recurringMonths} months.` : 'locked until Elite Partner.'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Withdraw earnings</CardTitle>
          <CardDescription>Automatic Lenco payout is available for clean accounts within your tier limit.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Field label={`Amount - available ${money(available)}`}><Input type="number" min={minimumWithdrawal} value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} placeholder="50" /></Field>
          <div className="rounded-2xl border bg-muted/30 p-3 text-sm"><strong>Minimum:</strong> K50<br /><span className="text-muted-foreground">Daily auto limit: {money(affiliate.autoPayoutDailyLimit)}</span></div>
          <Button onClick={submitWithdrawal} disabled={withdrawing || available < minimumWithdrawal || Number(withdrawAmount || 0) < minimumWithdrawal}>{withdrawing ? 'Processing...' : 'Withdraw now'}</Button>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <HistoryCard title="Referrals" empty="No referrals yet.">
          {affiliate.recentReferrals?.map((referral: Record<string, any>) => <HistoryItem key={referral.id} main={referral.firstPaidAt ? 'Paid referral' : 'Signed up'} meta={`${referral.sourceType} · ${formatDate(referral.createdAt)}`} status={referral.firstPaidAt ? 'paid' : 'pending'} />)}
        </HistoryCard>
        <HistoryCard title="Earnings" empty="No affiliate earnings yet.">
          {affiliate.recentEarnings?.map((earning: Record<string, any>) => <HistoryItem key={earning.id} main={money(earning.commissionAmount, earning.currency)} meta={`${earning.sourceType} · ${formatDate(earning.createdAt)}`} status={earning.status} />)}
        </HistoryCard>
        <HistoryCard title="Payouts" empty="No payout requests yet.">
          {affiliate.recentPayouts?.map((payout: Record<string, any>) => <HistoryItem key={payout.id} main={money(payout.amount, payout.currency)} meta={`${payout.method ?? 'Payout'} · ${formatDate(payout.requestedAt)}`} status={payout.status} />)}
        </HistoryCard>
      </div>

      <Card className="rounded-3xl">
        <CardHeader><CardTitle>Affiliate rules</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <p>Starter, Campus Promoter, and Ambassador earn one-time commissions on the first meaningful short-course purchase.</p>
          <p>Elite Partner unlocks 5% recurring commission for 12 months, only after strict admin approval.</p>
          <p>No self-referrals, fake accounts, duplicate abuse, or misleading promotions.</p>
          <p>Suspicious withdrawals can be sent to admin review before Lenco payout.</p>
        </CardContent>
      </Card>
    </main>
  );
}

function AffiliateApplicationView({
  rejected,
  message,
  error,
  applyForm,
  setApplyForm,
  saving,
  onSubmit,
}: {
  rejected: boolean;
  message: string | null;
  error: string | null;
  applyForm: ApplyForm;
  setApplyForm: React.Dispatch<React.SetStateAction<ApplyForm>>;
  saving: boolean;
  onSubmit: () => void;
}) {
  return (
    <main className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Affiliate Program</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{rejected ? 'Request affiliate access again' : 'Become a UnivAI Affiliate'}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Share UnivAI short courses and earn when referred learners register, pay the entry fee, and buy course access.
        </p>
      </section>
      {rejected ? <Notice tone="error"><span className="inline-flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> Your previous affiliate request was not approved. Update your reason, payout details, and channels, then request access again.</span></Notice> : null}
      {message ? <Notice>{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Apply to become an affiliate</CardTitle>
          <CardDescription>Approved students start as Starter Affiliates. Elite recurring commission is locked until serious performance is proven.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Display name"><Input value={applyForm.displayName} onChange={(event) => setApplyForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Your public affiliate name" /></Field>
            <Field label="Mobile money phone"><Input value={applyForm.payoutPhone} onChange={(event) => setApplyForm((current) => ({ ...current, payoutPhone: event.target.value }))} placeholder="097..." /></Field>
            <Field label="Provider">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={applyForm.payoutOperator} onChange={(event) => setApplyForm((current) => ({ ...current, payoutOperator: event.target.value as ApplyForm['payoutOperator'] }))}>
                <option value="airtel">Airtel Money</option>
                <option value="mtn">MTN Money</option>
                <option value="zamtel">Zamtel Money</option>
              </select>
            </Field>
            <Field label="Promotion channels"><Input value={applyForm.promotionChannels} onChange={(event) => setApplyForm((current) => ({ ...current, promotionChannels: event.target.value }))} placeholder="WhatsApp, Facebook, campus groups" /></Field>
          </div>
          <Field label="Why should UnivAI approve you?"><Textarea rows={4} value={applyForm.applicationReason} onChange={(event) => setApplyForm((current) => ({ ...current, applicationReason: event.target.value }))} /></Field>
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input type="checkbox" className="mt-1" checked={applyForm.acceptedTerms} onChange={(event) => setApplyForm((current) => ({ ...current, acceptedTerms: event.target.checked }))} />
            I agree not to create fake accounts, self-referrals, or misleading promotions. Suspicious commissions can be reversed.
          </label>
          <Button onClick={onSubmit} disabled={saving || !applyForm.acceptedTerms || !applyForm.payoutPhone.trim() || !applyForm.applicationReason.trim()} className="w-full">{saving ? 'Submitting...' : 'Submit affiliate application'}</Button>
        </CardContent>
      </Card>
    </main>
  );
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Wallet }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>
        <Icon className="h-8 w-8 text-primary" />
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function Notice({ children, tone = 'success' }: { children: ReactNode; tone?: 'success' | 'error' }) {
  return <div className={`rounded-2xl border p-4 text-sm ${tone === 'error' ? 'border-destructive/40 bg-destructive/5' : 'bg-primary/5'}`}>{children}</div>;
}

function ProgressLine({ label, value, target, money: isMoney = false }: { label: string; value: number; target: number; money?: boolean }) {
  const percentage = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 100;
  return <div className="space-y-2"><div className="flex justify-between text-sm"><span>{label}</span><span>{isMoney ? `${money(value)} / ${money(target)}` : `${value} / ${target}`}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${percentage}%` }} /></div></div>;
}

function HistoryCard({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const hasItems = Array.isArray(children) ? children.some(Boolean) : Boolean(children);
  return <Card className="rounded-3xl"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-3">{hasItems ? children : <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">{empty}</p>}</CardContent></Card>;
}

function HistoryItem({ main, meta, status }: { main: string; meta: string; status?: string }) {
  return <div className="rounded-2xl border p-4 text-sm"><div className="flex items-center justify-between gap-3"><strong>{main}</strong><span className="rounded-full bg-muted px-3 py-1 text-xs">{status}</span></div><p className="mt-1 text-muted-foreground">{meta}</p></div>;
}

function money(value?: string | number | null, currency = 'ZMW') {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return `${currency} 0`;
  return `${currency} ${amount.toLocaleString()}`;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : 'No date';
}
