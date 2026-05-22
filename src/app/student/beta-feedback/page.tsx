'use client';

import { useMemo, useState } from 'react';
import { Bug, Lightbulb, Send, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { submitBetaReport, type BetaReportSeverity, type BetaReportType } from '@/lib/api/beta-reports';

const reportTypes: Array<{ value: BetaReportType; label: string; icon: typeof Bug }> = [
  { value: 'error', label: 'Report an error', icon: Bug },
  { value: 'feature', label: 'Request a feature', icon: Lightbulb },
  { value: 'improvement', label: 'Suggest an improvement', icon: Sparkles },
  { value: 'other', label: 'Other feedback', icon: Send },
];

export default function StudentBetaFeedbackPage() {
  const [type, setType] = useState<BetaReportType>('error');
  const [severity, setSeverity] = useState<BetaReportSeverity>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedType = useMemo(() => reportTypes.find((item) => item.value === type) ?? reportTypes[0], [type]);

  async function submit() {
    if (!title.trim()) {
      setError('Please add a short title so we know what to look at.');
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await submitBetaReport({
        type,
        severity,
        title: title.trim(),
        description: description.trim() || undefined,
        pageUrl: pageUrl.trim() || (typeof window !== 'undefined' ? window.location.href : undefined),
        browser: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        source: 'student',
      });
      setNotice(response.message);
      setTitle('');
      setDescription('');
      setPageUrl('');
      setSeverity('medium');
      setType('error');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to send your report right now.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Beta Testing</p>
        <h1 className="text-3xl font-bold tracking-tight">Report an issue or request a feature</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          UnivAI is currently in beta testing. You may notice a few rough edges while we improve the platform every day. If something breaks, looks confusing, or does not work the way you expected, please report it here. You can also suggest features you would love to see added.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>What are you sending?</CardTitle>
            <CardDescription>Choose the closest option.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportTypes.map((item) => {
              const Icon = item.icon;
              const active = item.value === type;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setType(item.value)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-sm transition ${active ? 'border-primary bg-primary/5 text-primary' : 'hover:border-primary/50'}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{selectedType.label}</CardTitle>
            <CardDescription>Give us enough detail so the team can reproduce or understand it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notice ? <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{notice}</div> : null}
            {error ? <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</div> : null}

            <label className="block space-y-2 text-sm font-medium">
              <span>Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={type === 'feature' ? 'Example: Add downloadable lesson notes' : 'Example: Payment completed but course did not unlock'}
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Details</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Tell us what happened, what you expected, and any steps that can help us find it."
                rows={7}
                className="w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium">
                <span>Page link, optional</span>
                <input
                  value={pageUrl}
                  onChange={(event) => setPageUrl(event.target.value)}
                  placeholder="Paste the page where it happened"
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block space-y-2 text-sm font-medium">
                <span>Severity</span>
                <select
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value as BetaReportSeverity)}
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
            </div>

            <Button onClick={submit} disabled={busy} className="gap-2">
              <Send className="h-4 w-4" /> {busy ? 'Sending...' : 'Send report'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
