'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bug, CheckCircle2, Download, Lightbulb, RefreshCw, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import {
  getAdminBetaReports,
  updateBetaReport,
  verifyAllBetaReports,
  type AdminBetaReportsResponse,
  type BetaReportRecord,
  type BetaReportStatus,
  type VerifyAllBetaReportsResponse,
} from '@/lib/api/beta-reports';

export default function AdminBetaReportsPage() {
  const [data, setData] = useState<AdminBetaReportsResponse | null>(null);
  const [status, setStatus] = useState('open');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifyingAll, setVerifyingAll] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const exportUrl = useMemo(() => {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (type) query.set('type', type);
    const qs = query.toString();
    return `/api/admin/beta-reports/export.txt${qs ? `?${qs}` : ''}`;
  }, [status, type]);

  async function load() {
    setError(null);
    const response = await getAdminBetaReports({ status, type });
    setData(response);
  }

  useEffect(() => {
    let mounted = true;
    setNotice(null);
    load()
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load beta reports.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [status, type]);

  async function refresh() {
    setRefreshing(true);
    setNotice(null);
    try {
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to refresh beta reports.');
    } finally {
      setRefreshing(false);
    }
  }

  async function checkAllReports() {
    setVerifyingAll(true);
    setNotice(null);
    setError(null);

    try {
      const result: VerifyAllBetaReportsResponse = await verifyAllBetaReports({ status, type });
      setNotice(result.message ?? `Verification complete: ${result.checked} checked, ${result.closed} closed, ${result.failed} still failing${result.skipped ? `, ${result.skipped} skipped` : ''}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to verify reports. Make sure the backend /admin/beta-reports/verify-all endpoint exists.');
    } finally {
      setVerifyingAll(false);
    }
  }

  async function changeStatus(report: BetaReportRecord, nextStatus: BetaReportStatus) {
    setBusyId(report.id);
    setNotice(null);
    setError(null);
    try {
      await updateBetaReport(report.id, { status: nextStatus, severity: report.severity });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update report status.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <PageLoading message="Loading beta reports..." />;
  if (error && !data) return <PageError message={error} actionHref="/admin/dashboard" actionLabel="Back to dashboard" />;

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Issue Control Center</p>
            <h1 className="text-3xl font-bold tracking-tight">Error reports & feature requests</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Review student-submitted reports, feature requests, automatically captured client-side errors, and backend/API failures including SQL/database errors.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={checkAllReports} disabled={verifyingAll || refreshing} className="gap-2">
              <ShieldCheck className={`h-4 w-4 ${verifyingAll ? 'animate-pulse' : ''}`} />
              {verifyingAll ? 'Checking all...' : 'Check All Open Errors'}
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <a href={exportUrl} download>
                <Download className="h-4 w-4" /> Download TXT
              </a>
            </Button>
            <Button onClick={refresh} disabled={refreshing || verifyingAll} variant="outline" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>
      </section>

      {notice ? (
        <Card className="rounded-3xl border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30">
          <CardContent className="p-4 text-sm font-medium text-emerald-900 dark:text-emerald-100">{notice}</CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="rounded-3xl border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="p-4 text-sm font-medium text-amber-900 dark:text-amber-100">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Open" value={data?.summary.open ?? 0} icon={AlertTriangle} />
        <Metric title="Critical" value={data?.summary.critical ?? 0} icon={Bug} />
        <Metric title="Errors" value={data?.summary.errors ?? 0} icon={Bug} />
        <Metric title="Feature requests" value={data?.summary.features ?? 0} icon={Lightbulb} />
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Focus on the reports that need attention first. Check All uses these same filters, so you can verify only open errors or a specific report type.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2 text-sm font-medium">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary">
              <option value="open">Open</option>
              <option value="reviewing">Reviewing</option>
              <option value="planned">Planned</option>
              <option value="resolved">Resolved</option>
              <option value="verifying">Verifying</option>
              <option value="verified">Verified</option>
              <option value="failed_verification">Failed verification</option>
              <option value="closed">Closed</option>
              <option value="">All</option>
            </select>
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Type</span>
            <select value={type} onChange={(event) => setType(event.target.value)} className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary">
              <option value="">All</option>
              <option value="error">Errors</option>
              <option value="feature">Feature requests</option>
              <option value="improvement">Improvements</option>
              <option value="other">Other</option>
            </select>
          </label>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {data?.reports.length ? data.reports.map((report) => (
          <ReportCard key={report.id} report={report} busy={busyId === report.id || verifyingAll} onStatus={changeStatus} />
        )) : (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">No reports found for these filters.</CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function ReportCard({ report, busy, onStatus }: { report: BetaReportRecord; busy: boolean; onStatus: (report: BetaReportRecord, status: BetaReportStatus) => Promise<void> }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge value={report.type} />
              <Badge value={report.severity} variant={severityVariant(report.severity)} />
              <Badge value={report.status} />
              <Badge value={report.source} />
              {report.verificationStatus ? <Badge value={`check: ${report.verificationStatus}`} variant={report.verificationStatus === 'failed' ? 'danger' : report.verificationStatus === 'passed' ? 'success' : 'default'} /> : null}
            </div>
            <CardTitle className="mt-3 text-xl">{report.title}</CardTitle>
            <CardDescription>
              {report.user?.name || 'Unknown user'} · {report.user?.email || 'No email'} · {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'No date'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onStatus(report, 'reviewing')}>Reviewing</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onStatus(report, 'planned')}>Planned</Button>
            <Button size="sm" disabled={busy} onClick={() => onStatus(report, 'resolved')} className="gap-2"><CheckCircle2 className="h-4 w-4" /> Resolve</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onStatus(report, 'closed')}>Close</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {report.description ? <p className="rounded-2xl border bg-muted/30 p-4 leading-6">{report.description}</p> : null}
        <div className="grid gap-3 lg:grid-cols-2">
          <Info label="Page" value={report.pageUrl || '-'} />
          <Info label="Browser/device" value={[report.browser, report.device].filter(Boolean).join(' · ') || '-'} />
          <Info label="Error" value={[report.errorName, report.errorMessage].filter(Boolean).join(': ') || '-'} />
          <Info label="Report ID" value={`#${report.id}`} />
          <Info label="Verification" value={report.verificationMessage || report.verificationStatus || 'Not checked yet'} />
          <Info label="Last checked" value={report.verificationLastRunAt ? new Date(report.verificationLastRunAt).toLocaleString() : '-'} />
        </div>
        {report.stackTrace ? (
          <details className="rounded-2xl border bg-muted/30 p-4">
            <summary className="cursor-pointer font-semibold">Stack trace</summary>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs">{report.stackTrace}</pre>
          </details>
        ) : null}
        {report.context ? (
          <details className="rounded-2xl border bg-muted/30 p-4">
            <summary className="cursor-pointer font-semibold">Technical context</summary>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(report.context, null, 2)}</pre>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string | number; icon: typeof AlertTriangle }) {
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

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border p-3"><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="mt-1 break-words font-medium">{value}</p></div>;
}

function Badge({ value, variant = 'default' }: { value: string; variant?: 'default' | 'danger' | 'warning' | 'success' }) {
  const className = variant === 'danger'
    ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
    : variant === 'warning'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
      : variant === 'success'
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
        : 'bg-muted text-muted-foreground';
  return <span className={`rounded-full px-3 py-1 font-semibold capitalize ${className}`}>{value.replaceAll('_', ' ')}</span>;
}

function severityVariant(value: string) {
  if (value === 'critical' || value === 'high') return 'danger' as const;
  if (value === 'medium') return 'warning' as const;
  return 'default' as const;
}
