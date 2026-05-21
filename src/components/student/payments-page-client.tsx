'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ElementType } from 'react';
import { BadgeCheck, BookOpen, CreditCard, ExternalLink, ReceiptText, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { useSession } from '@/components/providers/session-provider';
import { AccessDetails, CoursePlanPurchaseCard } from '@/components/student/course-plan-purchase-card';
import { getInvoices, payInvoice, verifyInvoicePayment } from '@/lib/api';
import { getMyShortCourses, paymentUrl, type ShortCourseEnrollmentSummary } from '@/lib/api/short-courses';
import type { Invoice } from '@/lib/api/types';
import { STUDENT_ACCESS_TIER, roleToStudentAccessTier } from '@/lib/auth/roles';
import { accessLabel, invoiceCategory, invoiceFriendlyStatus, planLabel } from '@/lib/short-course-ui';

export function PaymentsPageClient() {
  const { session } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [shortCourses, setShortCourses] = useState<ShortCourseEnrollmentSummary[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(session?.user?.role ?? null);
  }, [session]);

  async function loadBilling() {
    setLoading(true);
    try {
      const [myShortCourses, invoiceData] = await Promise.all([
        getMyShortCourses().catch(() => []),
        getInvoices().catch(() => []),
      ]);
      setShortCourses(myShortCourses);
      setInvoices(invoiceData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load billing information.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBilling();
  }, []);

  const accessTier = roleToStudentAccessTier(userRole);
  const isProgrammeStudent = accessTier !== STUDENT_ACCESS_TIER.FREE_LEARNING;
  const activeCourses = shortCourses.filter((item) => item.course);
  const shortCourseInvoices = invoices.filter((invoice) => invoice.type?.includes('short_course') || /short course|certificate/i.test(invoice.title));
  const pendingShortCourseInvoices = shortCourseInvoices.filter((invoice) => invoice.status !== 'paid');
  const paidShortCourseInvoices = shortCourseInvoices.filter((invoice) => invoice.status === 'paid');

  const billingTotals = useMemo(() => {
    const toNumber = (value: string) => Number.parseFloat(value || '0') || 0;
    const paid = invoices.filter((invoice) => invoice.status === 'paid').reduce((sum, invoice) => sum + toNumber(invoice.amount), 0);
    const pending = invoices.filter((invoice) => invoice.status !== 'paid').reduce((sum, invoice) => sum + toNumber(invoice.amount), 0);
    return { paid, pending };
  }, [invoices]);

  async function handlePay(invoiceId: number) {
    setPayingId(invoiceId);
    setError(null);
    setNotice(null);
    try {
      const payment = await payInvoice(invoiceId);
      const url = paymentUrl(payment);
      if (url) {
        window.location.href = url;
        return;
      }
      setNotice('Payment confirmed. Refreshing your billing status.');
      const refreshed = await getInvoices();
      setInvoices(refreshed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to pay this invoice.');
    } finally {
      setPayingId(null);
    }
  }

  async function refreshVerification() {
    const invoice = Number(new URLSearchParams(window.location.search).get('invoice'));
    if (!Number.isFinite(invoice)) return;
    const verification = await verifyInvoicePayment(invoice).catch(() => null);
    setNotice(verification?.message ?? 'Payment is being confirmed. Refresh if the invoice still shows pending.');
    const refreshed = await getInvoices();
    setInvoices(refreshed);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success' && params.get('invoice')) {
      void refreshVerification();
    }
  }, []);

  if (loading) return <PageLoading message="Loading billing..." />;
  if (error) return <PageError message={error} actionHref="/short-courses" actionLabel="Browse short courses" />;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Billing</p>
            <h1 className="text-3xl font-bold tracking-tight">Short-course access and payments</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Buy or renew a single-course plan directly from this page. No hunting through the catalogue.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="w-full sm:w-auto"><Link href="/student/courses">Open my short courses</Link></Button>
            <Button asChild className="w-full sm:w-auto"><Link href="/short-courses">Browse short courses</Link></Button>
          </div>
        </div>
        {notice ? <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">{notice}</div> : null}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Current access</h2>
            <p className="text-sm text-muted-foreground">Each Journey card now has its own direct plan buttons.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">Paid invoices: {paidShortCourseInvoices.length}</span>
            <span className="rounded-full bg-muted px-3 py-1">Pending: {pendingShortCourseInvoices.length}</span>
          </div>
        </div>

        {activeCourses.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {activeCourses.map((item) => {
              const course = item.course!;
              return (
                <Card key={item.id} className="flex h-full min-w-0 flex-col rounded-2xl">
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-1">{accessLabel(item)}</span>
                      <span className="rounded-full bg-muted px-2 py-1">{planLabel(item.accessPlan ?? (item.entryFeePaid ? 'starter_access' : null))}</span>
                    </div>
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4 text-sm">
                    <AccessDetails item={item} />
                    <CoursePlanPurchaseCard
                      item={item}
                      onNotice={(message) => setNotice(message || null)}
                      onError={(message) => setError(message || null)}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="space-y-3 p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-primary" />
              <div>
                <CardTitle>No short-course access yet</CardTitle>
                <CardDescription className="mt-2">Choose a short course and buy access when you are ready.</CardDescription>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild><Link href="/short-courses">Browse courses</Link></Button>
                <Button asChild variant="outline"><Link href="/register/short-courses">Create an account</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Pending short-course invoices</CardTitle>
            <CardDescription>Payments that still need confirmation or checkout.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingShortCourseInvoices.length ? pendingShortCourseInvoices.map((invoice) => (
              <div key={invoice.id} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-1">{invoiceCategory(invoice)}</span>
                    <span className="rounded-full bg-muted px-2 py-1">{invoiceFriendlyStatus(invoice.status)}</span>
                  </div>
                  <p className="font-semibold">{invoice.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.currency ?? 'ZMW'} {invoice.amount} {invoice.dueDate ? `· due ${invoice.dueDate}` : ''}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link href={`/student/payments/invoices?invoice=${invoice.id}`}>Open</Link>
                  </Button>
                  <Button onClick={() => handlePay(invoice.id)} disabled={payingId === invoice.id} className="w-full sm:w-auto">
                    {payingId === invoice.id ? 'Working...' : 'Pay now'}
                  </Button>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                No pending short-course invoices.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Billing summary</CardTitle>
              <CardDescription>Total invoices and payment status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryLine label="Invoices total" value={`${invoices.length}`} />
              <SummaryLine label="Paid total" value={formatMoneyDisplay(billingTotals.paid)} />
              <SummaryLine label="Pending total" value={formatMoneyDisplay(billingTotals.pending)} />
              <SummaryLine label="Programme account" value={isProgrammeStudent ? 'Available' : 'Short-course only'} />
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
              <CardDescription>Common actions for short-course learners.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickLink icon={ReceiptText} label="Invoice history" href="/student/payments/invoices" />
              <QuickLink icon={CreditCard} label="Payment history" href="/student/payments/history" />
              <QuickLink icon={ShieldCheck} label="Scholarships & aid" href="/student/payments/aid" />
              <QuickLink icon={BadgeCheck} label="Certificates" href="/student/certificates" />
              <QuickLink icon={ExternalLink} label="Browse public catalogue" href="/short-courses" />
            </CardContent>
          </Card>
        </div>
      </section>

      {isProgrammeStudent ? (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Programme billing</CardTitle>
            <CardDescription>Formal programme learners still have access to the wider billing tools.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Use the invoice pages for tuition and programme fees. The short-course area above is the main launch surface.
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border p-3"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div>;
}

function QuickLink({ icon: Icon, label, href }: { icon: ElementType; label: string; href: string }) {
  return (
    <Button asChild variant="outline" className="w-full justify-start">
      <Link href={href} className="justify-start">
        <Icon className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}

function formatMoneyDisplay(value: number) {
  return `ZMW ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
