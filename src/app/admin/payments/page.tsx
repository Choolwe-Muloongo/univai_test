'use client';

import { useEffect, useMemo, useState } from 'react';
import { CreditCard, RefreshCw, ShieldCheck, TestTube2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { apiFetch } from '@/lib/api/client';

type AdminPayment = {
  id: number;
  invoiceId?: number | null;
  studentName?: string | null;
  studentEmail?: string | null;
  title?: string | null;
  invoiceType?: string | null;
  amount: string;
  currency?: string | null;
  method?: string | null;
  provider?: string | null;
  reference?: string | null;
  status: string;
  isTest: boolean;
  paymentMode?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
};

type AdminPaymentsResponse = {
  settings: {
    paymentMode: string;
    lencoCollectionsEnabled: boolean;
    showTestPaymentsInAdmin: boolean;
    paymentsAreTest: boolean;
    testModeMessage?: string | null;
  };
  summary: {
    totalPayments: number;
    testPayments: number;
    livePayments: number;
    visibleAmount: string;
  };
  payments: AdminPayment[];
};

export default function PaymentsPage() {
  const [data, setData] = useState<AdminPaymentsResponse | null>(null);
  const [includeTest, setIncludeTest] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(nextIncludeTest = includeTest) {
    setError(null);
    const response = await apiFetch<AdminPaymentsResponse>(`/admin/payments?includeTest=${nextIncludeTest ? '1' : '0'}`);
    setData(response);
  }

  useEffect(() => {
    let mounted = true;
    load(includeTest)
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load payments.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [includeTest]);

  async function refresh() {
    setRefreshing(true);
    await load(includeTest).finally(() => setRefreshing(false));
  }

  const modeLabel = useMemo(() => readableMode(data?.settings.paymentMode), [data?.settings.paymentMode]);

  if (loading) return <PageLoading message="Loading payments..." />;
  if (error) return <PageError message={error} actionHref="/admin/dashboard" actionLabel="Back to dashboard" />;

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Finance Control</p>
            <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Track live payments, Lenco test payments, local test-mode activations, and legacy beta-test records. Test records are labelled clearly so they do not pollute real finance reports.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setIncludeTest((value) => !value)}>
              {includeTest ? 'Hide test payments' : 'Show test payments'}
            </Button>
            <Button onClick={refresh} disabled={refreshing} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Visible payments" value={data?.summary.totalPayments ?? 0} icon={CreditCard} />
        <Metric title="Live records" value={data?.summary.livePayments ?? 0} icon={ShieldCheck} />
        <Metric title="Test records" value={data?.summary.testPayments ?? 0} icon={TestTube2} />
        <Metric title="Visible total" value={money(data?.summary.visibleAmount)} icon={CreditCard} />
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Current payment mode: {modeLabel}</CardTitle>
          <CardDescription>
            Lenco collections: {data?.settings.lencoCollectionsEnabled ? 'enabled' : 'disabled'} · Test payments visible by default: {data?.settings.showTestPaymentsInAdmin ? 'yes' : 'no'}
          </CardDescription>
        </CardHeader>
        {data?.settings.paymentsAreTest ? (
          <CardContent>
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              {data.settings.testModeMessage || 'Payments are currently running in test mode. New payments will be labelled as test records.'}
            </div>
          </CardContent>
        ) : null}
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Payment records</CardTitle>
          <CardDescription>Showing latest 250 records.</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.payments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">Payment</th>
                    <th className="px-3 py-3">Student</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Mode</th>
                    <th className="px-3 py-3">Provider</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0">
                      <td className="px-3 py-4 align-top">
                        <p className="font-medium">{payment.title || `Invoice #${payment.invoiceId ?? '-'}`}</p>
                        <p className="text-xs text-muted-foreground">{payment.invoiceType || 'payment'}</p>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <p className="font-medium">{payment.studentName || 'Unknown student'}</p>
                        <p className="text-xs text-muted-foreground">{payment.studentEmail || 'No email'}</p>
                      </td>
                      <td className="px-3 py-4 align-top font-semibold">{money(payment.amount, payment.currency || 'ZMW')}</td>
                      <td className="px-3 py-4 align-top"><ModeBadge payment={payment} /></td>
                      <td className="px-3 py-4 align-top">{payment.provider || payment.method || 'manual'}</td>
                      <td className="px-3 py-4 align-top capitalize">{payment.status}</td>
                      <td className="px-3 py-4 align-top">{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '-'}</td>
                      <td className="max-w-[220px] break-all px-3 py-4 align-top text-xs text-muted-foreground">{payment.reference || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No payment records found.</div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string | number; icon: typeof CreditCard }) {
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

function ModeBadge({ payment }: { payment: AdminPayment }) {
  const label = payment.isTest ? readableMode(payment.paymentMode || 'local_test') : 'Live';
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${payment.isTest ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'}`}>{label}</span>;
}

function readableMode(mode?: string | null) {
  if (mode === 'lenco_test') return 'Lenco Test';
  if (mode === 'local_test') return 'Local Test';
  if (mode === 'legacy_test') return 'Legacy Test';
  return 'Live';
}

function money(value?: string | number | null, currency = 'ZMW') {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return `${currency} 0`;
  return `${currency} ${amount.toLocaleString()}`;
}
