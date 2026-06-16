'use client';

import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, Copy, RefreshCw, ShieldCheck, Wallet, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { applyForAffiliate, getMyAffiliate } from '@/lib/api/student-affiliate';
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
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyForm, setApplyForm] = useState<ApplyForm>(defaultApplyForm);

  async function refresh(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    try {
      const data = await getMyAffiliate();
      setAffiliate(data);
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    getMyAffiliate()
      .then((data) => { if (mounted) setAffiliate(data); })
      .catch(() => { if (mounted) setAffiliate(null); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const status = String(affiliate?.status ?? '').toLowerCase();
  const requirementsStatus = String(affiliate?.requirementsStatus ?? '').toLowerCase();
  const active = Boolean(affiliate?.id && status === 'active');
  const pending = Boolean(affiliate?.id && status === 'pending');
  const paymentRequired = Boolean(affiliate?.id && (status === 'payment_required' || requirementsStatus === 'payment_required'));
  const rejected = Boolean(affiliate?.id && status === 'rejected');

  const referralLink = useMemo(() => {
    if (!active || !affiliate?.code || typeof window === 'undefined') return '';
    return `${window.location.origin}/register/short-courses?ref=${encodeURIComponent(String(affiliate.code))}`;
  }, [active, affiliate?.code]);

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
      setMessage(String(next.status ?? '').toLowerCase() === 'payment_required' ? 'Application saved. Complete the entry fee and access payment to continue.' : 'Application submitted for admin review.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save affiliate application.');
    } finally {
      setSaving(false);
    }
  }

  async function copyReferral() {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (loading) return <PageLoading message="Loading affiliate dashboard..." />;
  if (paymentRequired && affiliate) return <PaymentRequired affiliate={affiliate} message={message} error={error} refreshing={refreshing} onRefresh={() => refresh(true)} />;
  if (pending && affiliate) return <PendingReview affiliate={affiliate} message={message} error={error} refreshing={refreshing} onRefresh={() => refresh(true)} />;
  if (!affiliate || rejected) return <ApplicationForm rejected={rejected} message={message} error={error} form={applyForm} setForm={setApplyForm} saving={saving} onSubmit={submitApplication} />;

  return (
    <main className="space-y-6">
      <Hero label="Affiliate Control Center" title="Your affiliate account is active" description="Share your referral link, track valid referrals, and withdraw approved earnings." />
      {message ? <Notice>{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="grid gap-5 md:grid-cols-3">
        <Metric title="Available" value={money(affiliate.summary?.availableToWithdraw)} />
        <Metric title="Signups" value={String(affiliate.summary?.verifiedSignups ?? 0)} />
        <Metric title="Paid referrals" value={String(affiliate.summary?.paidReferrals ?? 0)} />
      </div>
      <Card className="rounded-3xl">
        <CardHeader><CardTitle>Referral link</CardTitle><CardDescription>Your public link unlocks only after approval.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border bg-muted/30 p-4 text-sm break-all">{referralLink || 'Referral link unavailable.'}</div>
          <Button onClick={copyReferral} disabled={!referralLink} className="gap-2"><Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy referral link'}</Button>
        </CardContent>
      </Card>
    </main>
  );
}

function PaymentRequired({ affiliate, message, error, refreshing, onRefresh }: { affiliate: AffiliateRecord; message: string | null; error: string | null; refreshing: boolean; onRefresh: () => void }) {
  const flags = affiliate.requirementFlags ?? {};
  const entryPaid = Boolean(flags.entryFeePaid ?? affiliate.eligibility?.paidEntryFee ?? affiliate.entryFeePaidAt);
  const accessPaid = Boolean(flags.accessPaid ?? affiliate.eligibility?.paidAccess ?? affiliate.accessRequirementMetAt);
  const termsAccepted = Boolean(affiliate.termsVersion || affiliate.termsAcceptedAt);
  return (
    <main className="space-y-6">
      <Hero label="Affiliate Application Saved" title="Complete your affiliate requirements" description="Your application is stored. Activation requires the entry fee, access payment, terms acceptance, and admin review." />
      {message ? <Notice>{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Card className="rounded-3xl border-primary/20 bg-primary/5">
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Activation checklist</CardTitle><CardDescription>Finish these items, then refresh this page.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <Requirement done={entryPaid} title="Entry fee paid" text="Pay one short-course entry fee on your own account." />
          <Requirement done={accessPaid} title="Access package paid" text="Buy one course access plan or approved bundle." />
          <Requirement done={termsAccepted} title="Affiliate terms accepted" text="You accepted the affiliate rules during application." />
          {affiliate.legacyApplication ? <Notice>Legacy application preserved. It still needs the current payment and access requirements before activation.</Notice> : null}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
            <Button asChild><a href="/student/short-courses">Browse short courses</a></Button>
            <Button asChild variant="outline"><a href="/student/billing">View invoices</a></Button>
            <Button type="button" variant="outline" onClick={onRefresh} disabled={refreshing} className="gap-2"><RefreshCw className="h-4 w-4" /> {refreshing ? 'Checking...' : 'Refresh status'}</Button>
          </div>
        </CardContent>
      </Card>
      <TermsSummary />
    </main>
  );
}

function PendingReview({ affiliate, message, error, refreshing, onRefresh }: { affiliate: AffiliateRecord; message: string | null; error: string | null; refreshing: boolean; onRefresh: () => void }) {
  return (
    <main className="space-y-6">
      <Hero label="Affiliate Application" title="Your application is under review" description="Your requirements are complete. Admin must approve the account before your referral link unlocks." />
      {message ? <Notice>{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Card className="rounded-3xl"><CardHeader><CardTitle>Review status</CardTitle><CardDescription>Application code: {affiliate.code}</CardDescription></CardHeader><CardContent className="space-y-3"><Requirement done title="Entry fee complete" text="Your entry fee requirement is recorded." /><Requirement done title="Access complete" text="Your access payment requirement is recorded." /><Requirement done={false} title="Admin approval" text="Approval is still pending." /><Button type="button" variant="outline" onClick={onRefresh} disabled={refreshing} className="gap-2"><RefreshCw className="h-4 w-4" /> {refreshing ? 'Checking...' : 'Refresh status'}</Button></CardContent></Card>
    </main>
  );
}

function ApplicationForm({ rejected, message, error, form, setForm, saving, onSubmit }: { rejected: boolean; message: string | null; error: string | null; form: ApplyForm; setForm: React.Dispatch<React.SetStateAction<ApplyForm>>; saving: boolean; onSubmit: () => void }) {
  return (
    <main className="space-y-6">
      <Hero label="Affiliate Program" title={rejected ? 'Request affiliate access again' : 'Become a UnivAI Affiliate'} description="Save your application now. Activation requires entry fee, access payment, and admin approval." />
      {message ? <Notice>{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl"><CardHeader><CardTitle>Application details</CardTitle><CardDescription>Use correct payout details. Wrong details can delay payouts.</CardDescription></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Display name"><Input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Your public affiliate name" /></Field>
            <Field label="Mobile money phone"><Input value={form.payoutPhone} onChange={(event) => setForm((current) => ({ ...current, payoutPhone: event.target.value }))} placeholder="097..." /></Field>
            <Field label="Provider"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.payoutOperator} onChange={(event) => setForm((current) => ({ ...current, payoutOperator: event.target.value as ApplyForm['payoutOperator'] }))}><option value="airtel">Airtel Money</option><option value="mtn">MTN Money</option><option value="zamtel">Zamtel Money</option></select></Field>
            <Field label="Promotion channels"><Input value={form.promotionChannels} onChange={(event) => setForm((current) => ({ ...current, promotionChannels: event.target.value }))} placeholder="WhatsApp, Facebook, campus groups" /></Field>
          </div>
          <Field label="Why should UnivAI approve you?"><Textarea rows={4} value={form.applicationReason} onChange={(event) => setForm((current) => ({ ...current, applicationReason: event.target.value }))} /></Field>
          <label className="flex items-start gap-3 rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground"><input type="checkbox" className="mt-1" checked={form.acceptedTerms} onChange={(event) => setForm((current) => ({ ...current, acceptedTerms: event.target.checked }))} /><span>I understand that affiliate activation requires a paid short-course entry fee, a paid access package, admin approval, and compliance with the <a href="/affiliate-terms" className="font-semibold text-primary hover:underline">Affiliate Terms</a>.</span></label>
          <Button onClick={onSubmit} disabled={saving || !form.acceptedTerms || !form.payoutPhone.trim() || !form.applicationReason.trim()} className="w-full">{saving ? 'Saving...' : 'Save affiliate application'}</Button>
        </CardContent></Card>
        <TermsSummary />
      </div>
    </main>
  );
}

function TermsSummary() { return <Card className="rounded-3xl"><CardHeader><CardTitle>Affiliate terms summary</CardTitle><CardDescription>Clear rules before activation.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>Applying does not guarantee approval.</p><p>Activation requires one paid short-course entry fee and one paid access package.</p><p>Commissions apply only to valid referrals and may be reviewed before payout.</p><p>Payouts require correct mobile money details.</p><p><a href="/affiliate-terms" className="font-semibold text-primary hover:underline">Read full Affiliate Terms</a> · <a href="/payment-rules" className="font-semibold text-primary hover:underline">Payment Rules</a> · <a href="/policies" className="font-semibold text-primary hover:underline">Policies</a></p></CardContent></Card>; }
function Requirement({ done, title, text }: { done: boolean; title: string; text: string }) { return <div className="flex items-start gap-3 rounded-2xl border bg-background p-4 text-sm">{done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />}<div><p className="font-semibold">{title}</p><p className="text-muted-foreground">{text}</p></div></div>; }
function Hero({ label, title, description }: { label: string; title: string; description: string }) { return <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6"><p className="text-sm font-semibold uppercase tracking-wide text-primary">{label}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p></section>; }
function Metric({ title, value }: { title: string; value: string }) { return <Card className="rounded-3xl"><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-bold">{value}</p></div><Wallet className="h-8 w-8 text-primary" /></CardContent></Card>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function Notice({ children, tone = 'success' }: { children: ReactNode; tone?: 'success' | 'error' }) { return <div className={`rounded-2xl border p-4 text-sm ${tone === 'error' ? 'border-destructive/40 bg-destructive/5' : 'bg-primary/5'}`}>{children}</div>; }
function money(value?: string | number | null, currency = 'ZMW') { const amount = Number(value ?? 0); return `${currency} ${Number.isFinite(amount) ? amount.toLocaleString() : '0'}`; }
