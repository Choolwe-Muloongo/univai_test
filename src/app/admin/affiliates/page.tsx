'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BadgeCheck, Landmark, Loader2, RefreshCw, Wallet, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import {
  createAffiliate,
  getAffiliateOverview,
  requestAffiliatePayout,
  verifyAffiliatePayout,
} from '@/lib/api';
import type { AffiliateOverview, AffiliateRecord } from '@/lib/api/types';

type CreateForm = {
  userId: string;
  code: string;
  displayName: string;
  scope: 'all' | 'formal_programmes' | 'short_courses';
  formalProgrammeRate: string;
  shortCourseRate: string;
  payoutPhone: string;
  payoutOperator: string;
  payoutCountry: string;
  lencoAccountId: string;
  notes: string;
};

const defaultForm: CreateForm = {
  userId: '',
  code: '',
  displayName: '',
  scope: 'all',
  formalProgrammeRate: '10',
  shortCourseRate: '5',
  payoutPhone: '',
  payoutOperator: '',
  payoutCountry: 'zm',
  lencoAccountId: '',
  notes: '',
};

export default function AdminAffiliatesPage() {
  const [data, setData] = useState<AffiliateOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<CreateForm>(defaultForm);
  const [payoutAmounts, setPayoutAmounts] = useState<Record<number, string>>({});

  async function refresh() {
    const overview = await getAffiliateOverview();
    setData(overview);
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load affiliates.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const affiliates = useMemo(() => data?.affiliates ?? [], [data]);

  async function submitAffiliate() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await createAffiliate({
        userId: form.userId ? Number(form.userId) : undefined,
        code: form.code || undefined,
        displayName: form.displayName,
        scope: form.scope,
        formalProgrammeRate: Number(form.formalProgrammeRate || 0),
        shortCourseRate: Number(form.shortCourseRate || 0),
        payoutPhone: form.payoutPhone || undefined,
        payoutOperator: form.payoutOperator || undefined,
        payoutCountry: form.payoutCountry || undefined,
        lencoAccountId: form.lencoAccountId || undefined,
        notes: form.notes || undefined,
      });
      setForm(defaultForm);
      setMessage('Affiliate saved.');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save affiliate.');
    } finally {
      setSaving(false);
    }
  }

  async function submitPayout(affiliate: AffiliateRecord) {
    const amount = Number(payoutAmounts[affiliate.id] || 0);
    if (amount <= 0) return;
    setBusyId(affiliate.id);
    setError(null);
    setMessage(null);
    try {
      await requestAffiliatePayout(affiliate.id, {
        amount,
        currency: 'ZMW',
        phone: affiliate.payoutPhone || undefined,
        operator: affiliate.payoutOperator || undefined,
        country: affiliate.payoutCountry || 'zm',
      });
      setPayoutAmounts((current) => ({ ...current, [affiliate.id]: '' }));
      setMessage(`Payout requested for ${affiliate.displayName}.`);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to request payout.');
    } finally {
      setBusyId(null);
    }
  }

  async function verifyPayout(payoutId: number) {
    setBusyId(payoutId);
    setError(null);
    setMessage(null);
    try {
      await verifyAffiliatePayout(payoutId);
      setMessage('Payout status refreshed.');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to verify payout.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <PageLoading message="Loading affiliates..." />;
  if (error && !data) return <PageError message={error} actionHref="/admin/dashboard" actionLabel="Back to dashboard" />;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-normal text-primary">Revenue operations</p>
        <h1 className="text-3xl font-bold text-foreground">Affiliate Program</h1>
        <p className="max-w-3xl text-muted-foreground">Manage formal-programme and short-course affiliates, track earned commission, and process Lenco withdrawals.</p>
      </section>

      {message ? <div className="rounded-2xl border bg-primary/5 p-4 text-sm">{message}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={Wallet} label="Affiliates" value={data?.summary.count ?? 0} />
        <SummaryCard icon={BadgeCheck} label="Active" value={data?.summary.active ?? 0} />
        <SummaryCard icon={Landmark} label="Available to withdraw" value={`ZMW ${Number(data?.summary.totalAvailable ?? 0).toLocaleString()}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Create or update affiliate</CardTitle>
            <CardDescription>Assign a referral code, commission rates, and payout details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="User ID"><Input value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))} placeholder="Optional user id" /></Field>
              <Field label="Affiliate code"><Input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="AUTO if blank" /></Field>
              <Field label="Display name"><Input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Affiliate name" /></Field>
              <Field label="Scope"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.scope} onChange={(event) => setForm((current) => ({ ...current, scope: event.target.value as CreateForm['scope'] }))}><option value="all">All</option><option value="formal_programmes">Formal programmes only</option><option value="short_courses">Short courses only</option></select></Field>
              <Field label="Formal rate %"><Input type="number" min={0} max={100} step={0.1} value={form.formalProgrammeRate} onChange={(event) => setForm((current) => ({ ...current, formalProgrammeRate: event.target.value }))} /></Field>
              <Field label="Short-course rate %"><Input type="number" min={0} max={100} step={0.1} value={form.shortCourseRate} onChange={(event) => setForm((current) => ({ ...current, shortCourseRate: event.target.value }))} /></Field>
              <Field label="Lenco account ID"><Input value={form.lencoAccountId} onChange={(event) => setForm((current) => ({ ...current, lencoAccountId: event.target.value }))} /></Field>
              <Field label="Payout phone"><Input value={form.payoutPhone} onChange={(event) => setForm((current) => ({ ...current, payoutPhone: event.target.value }))} /></Field>
              <Field label="Payout operator"><Input value={form.payoutOperator} onChange={(event) => setForm((current) => ({ ...current, payoutOperator: event.target.value }))} placeholder="airtel / mtn / zamtel" /></Field>
              <Field label="Payout country"><Input value={form.payoutCountry} onChange={(event) => setForm((current) => ({ ...current, payoutCountry: event.target.value }))} /></Field>
            </div>
            <Field label="Notes"><Textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></Field>
            <Button onClick={submitAffiliate} disabled={saving} className="w-full">{saving ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving...</> : 'Save affiliate'}</Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Affiliate list</CardTitle>
            <CardDescription>Commission status, earnings, and payout actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={refresh} className="w-full"><RefreshCw className="mr-2 size-4" />Refresh</Button>
            <div className="space-y-4">
              {affiliates.map((affiliate) => {
                const available = Number(affiliate.summary.availableToWithdraw ?? 0);
                return (
                  <div key={affiliate.id} className="rounded-2xl border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{affiliate.displayName}</p>
                        <p className="text-sm text-muted-foreground">{affiliate.code} - {affiliate.scope} - {affiliate.status}</p>
                        <p className="text-xs text-muted-foreground">Formal {affiliate.formalProgrammeRate}% - Short course {affiliate.shortCourseRate}%</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold">ZMW {available.toLocaleString()}</p>
                        <p className="text-muted-foreground">Available</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Input value={payoutAmounts[affiliate.id] ?? ''} onChange={(event) => setPayoutAmounts((current) => ({ ...current, [affiliate.id]: event.target.value }))} placeholder="Payout amount" />
                      <Button onClick={() => submitPayout(affiliate)} disabled={busyId === affiliate.id || available <= 0}>{busyId === affiliate.id ? 'Working...' : 'Create payout'}</Button>
                    </div>
                    <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                      <p>Gross: {affiliate.summary.grossEarned} | Commission: {affiliate.summary.commissionEarned}</p>
                      <p>Pending: {affiliate.summary.pendingPayouts} | Processing: {affiliate.summary.processingPayouts} | Paid: {affiliate.summary.successfulPayouts}</p>
                    </div>
                    {affiliate.recentPayouts.length ? (
                      <div className="mt-4 space-y-2">
                        {affiliate.recentPayouts.map((payout) => (
                          <div key={payout.id} className="rounded-xl border bg-muted/30 p-3 text-sm">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-medium">{payout.reference}</p>
                                <p className="text-xs text-muted-foreground">{payout.status} - {payout.currency} {payout.amount}</p>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => verifyPayout(payout.id)} disabled={busyId === payout.id}>
                                {busyId === payout.id ? 'Checking...' : 'Verify'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {!affiliates.length ? <div className="rounded-2xl border-dashed border p-6 text-sm text-muted-foreground">No affiliates configured yet.</div> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
