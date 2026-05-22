'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink, Link2, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getMyAffiliate } from '@/lib/api/student-affiliate';
import type { AffiliateRecord } from '@/lib/api/types';

export default function StudentAffiliatePage() {
  const [affiliate, setAffiliate] = useState<AffiliateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    getMyAffiliate()
      .then((data) => {
        if (mounted) setAffiliate(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const referralLink = useMemo(() => {
    if (!affiliate?.code || typeof window === 'undefined') return '';
    return `${window.location.origin}/register?ref=${encodeURIComponent(affiliate.code)}`;
  }, [affiliate?.code]);

  async function copyLink() {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (loading) return <PageLoading message="Loading affiliate dashboard..." />;

  if (!affiliate) {
    return (
      <PageError
        title="Affiliate account not active yet"
        message="Your student account does not have an affiliate profile yet. Ask an admin to create or connect an affiliate record for your account."
        actionHref="/student/dashboard"
        actionLabel="Back to dashboard"
      />
    );
  }

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Affiliate Dashboard</p>
            <h1 className="text-3xl font-bold tracking-tight">Earn by sharing UnivAI</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Share your unique student link. Referrals, earnings, and payout activity will appear here after payments are confirmed.
            </p>
          </div>
          <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
            <p className="text-muted-foreground">Affiliate code</p>
            <p className="text-2xl font-bold tracking-wide">{affiliate.code}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard title="Available to withdraw" value={money(affiliate.summary?.availableToWithdraw)} icon={Wallet} />
        <MetricCard title="Commission earned" value={money(affiliate.summary?.commissionEarned)} icon={Wallet} />
        <MetricCard title="Pending payouts" value={money(affiliate.summary?.pendingPayouts)} icon={Wallet} />
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" /> Your referral link</CardTitle>
          <CardDescription>Give this link to students who want to register or buy short courses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border bg-muted/30 p-4 text-sm break-all">{referralLink || 'Referral link unavailable'}</div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={copyLink} disabled={!referralLink} className="gap-2">
              <Copy className="h-4 w-4" /> {copied ? 'Copied!' : 'Copy link'}
            </Button>
            {referralLink ? (
              <Button asChild variant="outline" className="gap-2">
                <a href={referralLink} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Open link</a>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Recent earnings</CardTitle>
            <CardDescription>Latest commissions recorded for your affiliate code.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {affiliate.recentEarnings?.length ? affiliate.recentEarnings.map((earning) => (
              <div key={earning.id} className="rounded-2xl border p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <strong>{money(earning.commissionAmount, earning.currency)}</strong>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">{earning.status}</span>
                </div>
                <p className="mt-1 text-muted-foreground">{earning.sourceType} · {earning.createdAt ? new Date(earning.createdAt).toLocaleString() : 'No date'}</p>
              </div>
            )) : <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">No affiliate earnings yet.</p>}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Recent payouts</CardTitle>
            <CardDescription>Withdrawal requests and payout status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {affiliate.recentPayouts?.length ? affiliate.recentPayouts.map((payout) => (
              <div key={payout.id} className="rounded-2xl border p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <strong>{money(payout.amount, payout.currency)}</strong>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">{payout.status}</span>
                </div>
                <p className="mt-1 text-muted-foreground">{payout.method ?? 'Payout'} · {payout.requestedAt ? new Date(payout.requestedAt).toLocaleString() : 'No date'}</p>
              </div>
            )) : <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">No payout requests yet.</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Wallet }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-primary" />
      </CardContent>
    </Card>
  );
}

function money(value?: string | number | null, currency = 'ZMW') {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return `${currency} 0`;
  return `${currency} ${amount.toLocaleString()}`;
}
