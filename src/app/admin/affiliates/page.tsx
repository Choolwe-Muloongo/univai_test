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
} from '@/lib/api/admin-affiliate';
import type { AffiliateOverview, AffiliateRecord } from '@/lib/api/types';

type CreateForm = {
  userId: string;
  code: string;
  displayName: string;
  scope: 'all' | 'formal_programmes' | 'short_courses';
  status: 'active' | 'pending' | 'inactive' | 'rejected';
  tier: 'starter' | 'campus_promoter' | 'ambassador' | 'elite_partner';
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
  scope: 'short_courses',
  status: 'active',
  tier: 'starter',
  formalProgrammeRate: '0',
  shortCourseRate: '10',
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
  const pendingAffiliates = affiliates.filter((affiliate) => affiliate.status === 'pending');

  async function submitAffiliate(custom?: Partial<CreateForm>) {
    const payloadForm = { ...form, ...(custom ?? {}) };
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await createAffiliate({
        userId: payloadForm.userId ? Number(payloadForm.userId) : undefined,
        code: payloadForm.code || undefined,
        displayName: payloadForm.displayName,
        scope: payloadForm.scope,
        status: payloadForm.status,
        tier: payloadForm.tier,
        formalProgrammeRate: Number(payloadForm.formalProgrammeRate || 0),
        shortCourseRate: Number(payloadForm.shortCourseRate || 0),
        payoutPhone: payloadForm.payoutPhone || undefined,
        payoutOperator: payloadForm.payoutOperator || undefined,
        payoutCountry: payloadForm.payoutCountry || undefined,
        lencoAccountId: payloadForm.lencoAccountId || undefined,
        notes: payloadForm.notes || undefined,
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

  function loadAffiliate(affiliate: AffiliateRecord, status?: CreateForm['status']) {
    setForm({
      userId: affiliate.userId ? String(affiliate.userId) : '',
      code: affiliate.code ?? '',
      displayName: affiliate.displayName ?? '',
      scope: affiliate.scope ?? 'short_courses',
      status: status ?? affiliate.status ?? 'active',
      tier: affiliate.tier ?? 'starter',
      formalProgrammeRate: String(affiliate.formalProgrammeRate ?? 0),
      shortCourseRate: String(affiliate.shortCourseRate ?? 10),
      payoutPhone: affiliate.payoutPhone ?? '',
      payoutOperator: affiliate.payoutOperator ?? '',
      payoutCountry: affiliate.payoutCountry ?? 'zm',
      lencoAccountId: affiliate.lencoAccountId ?? '',
      notes: affiliate.notes ?? '',
    });
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
        <p className="max-w-3xl text-muted-foreground">Approve affiliate applications, assign tiers, track commissions, and process Lenco withdrawals.</p>
      </section>

      {message ? <div className="rounded-2xl border bg-primary/5 p-4 text-sm">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard icon={Wallet} label="Affiliates" value={data?.summary.count ?? 0} />
        <SummaryCard icon={BadgeCheck} label="Active" value={data?.summary.active ?? 0} />
        <SummaryCard icon={BadgeCheck} label="Pending" value={data?.summary.pending ?? pendingAffiliates.length} />
        <SummaryCard icon={Landmark} label="Available" value={`ZMW ${Number(data?.summary.totalAvailable ?? 0).toLocaleString()}`} />
      </div>

      {pendingAffiliates.length ? (
        <Card className="rounded-3xl">
          <CardHeader><CardTitle>Pending affiliate applications</CardTitle><CardDescription>Review student applications and approve only clean promoters.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {pendingAffiliates.map((affiliate) => (
              <div key={affiliate.id} className="rounded-2xl border p-4 text-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div><p className="font-semibold">{affiliate.displayName}</p><p className="text-muted-foreground">{affiliate.userEmail ?? 'No email'} · {affiliate.payoutOperator} {affiliate.payoutPhone}</p><p className="mt-2 text-muted-foreground">{affiliate.applicationReason ?? 'No reason provided.'}</p></div>
                  <div className="flex gap-2"><Button size="sm" onClick={() => { loadAffiliate(affiliate, 'active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Approve</Button><Button size="sm" variant="outline" onClick={() => { loadAffiliate(affiliate, 'rejected'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Reject</Button></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-3xl">
          <CardHeader><CardTitle>Create or update affiliate</CardTitle><CardDescription>Set status to active to approve, rejected to decline, or pending to hold.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="User ID"><Input value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))} placeholder="Required to link student" /></Field>
              <Field label="Affiliate code"><Input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="AUTO if blank" /></Field>
              <Field label="Display name"><Input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Affiliate name" /></Field>
              <Field label="Status"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as CreateForm['status'] }))}><option value="pending">Pending</option><option value="active">Active / approved</option><option value="inactive">Inactive</option><option value="rejected">Rejected</option></select></Field>
              <Field label="Tier"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.tier} onChange={(event) => setForm((current) => ({ ...current, tier: event.target.value as CreateForm['tier'] }))}><option value="starter">Starter</option><option value="campus_promoter">Campus Promoter</option><option value="ambassador">UnivAI Ambassador</option><option value="elite_partner">Elite Partner - recurring</option></select></Field>
              <Field label="Scope"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.scope} onChange={(event) => setForm((current) => ({ ...current, scope: event.target.value as CreateForm['scope'] }))}><option value="all">All</option><option value="formal_programmes">Formal programmes only</option><option value="short_courses">Short courses only</option></select></Field>
              <Field label="Formal rate %"><Input type="number" min={0} max={100} step={0.1} value={form.formalProgrammeRate} onChange={(event) => setForm((current) => ({ ...current, formalProgrammeRate: event.target.value }))} /></Field>
              <Field label="Short-course first purchase %"><Input type="number" min={0} max={100} step={0.1} value={form.shortCourseRate} onChange={(event) => setForm((current) => ({ ...current, shortCourseRate: event.target.value }))} /></Field>
              <Field label="Lenco account ID"><Input value={form.lencoAccountId} onChange={(event) => setForm((current) => ({ ...current, lencoAccountId: event.target.value }))} /></Field>
              <Field label="Payout phone"><Input value={form.payoutPhone} onChange={(event) => setForm((current) => ({ ...current, payoutPhone: event.target.value }))} /></Field>
              <Field label="Payout operator"><Input value={form.payoutOperator} onChange={(event) => setForm((current) => ({ ...current, payoutOperator: event.target.value }))} placeholder="airtel / mtn / zamtel" /></Field>
              <Field label="Payout country"><Input value={form.payoutCountry} onChange={(event) => setForm((current) => ({ ...current, payoutCountry: event.target.value }))} /></Field>
            </div>
            <Field label="Notes"><Textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></Field>
            <Button onClick={() => submitAffiliate()} disabled={saving} className="w-full">{saving ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving...</> : 'Save affiliate'}</Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader><CardTitle>Affiliate list</CardTitle><CardDescription>Commission status, tier, earnings, and payout actions.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={refresh} className="w-full"><RefreshCw className="mr-2 size-4" />Refresh</Button>
            <div className="space-y-4">
              {affiliates.map((affiliate) => {
                const available = Number(affiliate.summary.availableToWithdraw ?? 0);
                return (
                  <div key={affiliate.id} className="rounded-2xl border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold">{affiliate.displayName}</p><p className="text-sm text-muted-foreground">{affiliate.code} - {affiliate.scope} - {affiliate.status}</p><p className="text-xs text-muted-foreground">{affiliate.tierLabel ?? affiliate.tier} · First purchase {affiliate.shortCourseRate}% · Recurring {affiliate.recurringCommissionEnabled ? 'enabled' : 'locked'}</p></div><div className="text-right text-sm"><p className="font-semibold">ZMW {available.toLocaleString()}</p><p className="text-muted-foreground">Available</p></div></div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3"><Input value={payoutAmounts[affiliate.id] ?? ''} onChange={(event) => setPayoutAmounts((current) => ({ ...current, [affiliate.id]: event.target.value }))} placeholder="Payout amount" /><Button onClick={() => submitPayout(affiliate)} disabled={busyId === affiliate.id || available <= 0}>{busyId === affiliate.id ? 'Working...' : 'Create payout'}</Button><Button variant="outline" onClick={() => loadAffiliate(affiliate)}>Edit</Button></div>
                    <div className="mt-3 space-y-2 text-xs text-muted-foreground"><p>Signups: {affiliate.summary.verifiedSignups ?? 0} | Paid referrals: {affiliate.summary.paidReferrals ?? 0}</p><p>Gross: {affiliate.summary.grossEarned} | Commission: {affiliate.summary.commissionEarned}</p><p>Pending: {affiliate.summary.pendingPayouts} | Processing: {affiliate.summary.processingPayouts} | Paid: {affiliate.summary.successfulPayouts}</p></div>
                    {affiliate.recentPayouts.length ? <div className="mt-4 space-y-2">{affiliate.recentPayouts.map((payout) => <div key={payout.id} className="rounded-xl border bg-muted/30 p-3 text-sm"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{payout.reference}</p><p className="text-xs text-muted-foreground">{payout.status} - {payout.currency} {payout.amount}</p></div><Button size="sm" variant="outline" onClick={() => verifyPayout(payout.id)} disabled={busyId === payout.id}>{busyId === payout.id ? 'Checking...' : 'Verify'}</Button></div></div>)}</div> : null}
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
  return <Card className="rounded-3xl"><CardContent className="flex items-center gap-4 p-5"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"><Icon className="size-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></div></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
