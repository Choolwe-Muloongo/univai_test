'use client';

import { FormEvent, useEffect, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import {
  createAnnouncement,
  createCertificate,
  createFeeRule,
  createMessageTemplate,
  createSavedReport,
  getPlatformOperationsOverview,
} from '@/lib/api';
import type { PlatformOperationsOverview } from '@/lib/api/types';

type Row = Record<string, unknown>;

export function AdminOperationsClient({ section = 'finance' }: { section?: 'finance' | 'certificates' | 'communication' | 'reports' | 'ai' | 'content' }) {
  const [overview, setOverview] = useState<PlatformOperationsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fee, setFee] = useState({ feeType: 'short_course_entry', name: '', amount: '0', currency: 'ZMW', appliesToType: 'short_course', appliesToId: '' });
  const [certificate, setCertificate] = useState({ studentName: '', title: '', certificateType: 'Certificate of Completion', sourceType: 'short_course', sourceId: '' });
  const [template, setTemplate] = useState({ name: '', channel: 'email', subject: '', body: '' });
  const [announcement, setAnnouncement] = useState({ title: '', audience: 'all_learners', body: '', status: 'draft' });
  const [report, setReport] = useState({ name: '', reportType: 'finance', summary: '' });

  async function refresh() {
    setOverview(await getPlatformOperationsOverview());
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Admin operations are unavailable.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function submit(action: () => Promise<unknown>) {
    setSaving(true);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save operation.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading message="Loading admin operations..." />;
  if (!overview) return <PageError message="Admin operations could not load." />;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-normal text-primary">Operations</p>
        <h1 className="text-3xl font-bold">{sectionTitle(section)}</h1>
        <p className="max-w-3xl text-muted-foreground">
          Manage live platform records for fees, certificates, communication, reports, AI usage and review queues.
        </p>
      </section>

      {error ? <PageError message={error} /> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Fee rules" value={overview.feeRules.length} />
        <Metric label="Certificates" value={overview.certificates.length} />
        <Metric label="Announcements" value={overview.announcements.length} />
        <Metric label="Saved reports" value={overview.savedReports.length} />
      </div>

      {section === 'finance' ? (
        <OperationsGrid>
          <OperationCard title="Create Fee Rule">
            <form className="space-y-4" onSubmit={(event) => {
              event.preventDefault();
              void submit(() => createFeeRule({ ...fee, amount: Number(fee.amount), status: 'active' }));
            }}>
              <Field label="Fee name"><Input required value={fee.name} onChange={(event) => setFee((value) => ({ ...value, name: event.target.value }))} /></Field>
              <Field label="Fee type">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={fee.feeType} onChange={(event) => setFee((value) => ({ ...value, feeType: event.target.value }))}>
                  <option value="application">Application fee</option>
                  <option value="admission">Admission fee</option>
                  <option value="programme_tuition">Programme tuition</option>
                  <option value="short_course_entry">Short-course entry</option>
                  <option value="certificate">Certificate fee</option>
                  <option value="ai_package">AI package</option>
                </select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Amount"><Input type="number" min={0} value={fee.amount} onChange={(event) => setFee((value) => ({ ...value, amount: event.target.value }))} /></Field>
                <Field label="Currency"><Input value={fee.currency} onChange={(event) => setFee((value) => ({ ...value, currency: event.target.value.toUpperCase() }))} /></Field>
              </div>
              <Field label="Applies to ID"><Input value={fee.appliesToId} onChange={(event) => setFee((value) => ({ ...value, appliesToId: event.target.value }))} placeholder="Optional course/program id" /></Field>
              <Button disabled={saving}>{saving ? 'Saving...' : 'Save fee rule'}</Button>
            </form>
          </OperationCard>
          <RecordList title="Recent Payments" rows={overview.payments} primary="reference" secondary="status" />
          <RecordList title="Invoices" rows={overview.invoices} primary="title" secondary="status" />
          <RecordList title="Instructor Earnings" rows={overview.instructorAiGenerations} primary="title" secondary="status" />
        </OperationsGrid>
      ) : null}

      {section === 'certificates' ? (
        <OperationsGrid>
          <OperationCard title="Issue Certificate">
            <form className="space-y-4" onSubmit={(event) => {
              event.preventDefault();
              void submit(() => createCertificate({ ...certificate, status: 'issued' }));
            }}>
              <Field label="Student name"><Input required value={certificate.studentName} onChange={(event) => setCertificate((value) => ({ ...value, studentName: event.target.value }))} /></Field>
              <Field label="Certificate title"><Input required value={certificate.title} onChange={(event) => setCertificate((value) => ({ ...value, title: event.target.value }))} /></Field>
              <Field label="Certificate type"><Input value={certificate.certificateType} onChange={(event) => setCertificate((value) => ({ ...value, certificateType: event.target.value }))} /></Field>
              <Field label="Source ID"><Input value={certificate.sourceId} onChange={(event) => setCertificate((value) => ({ ...value, sourceId: event.target.value }))} /></Field>
              <Button disabled={saving}>{saving ? 'Issuing...' : 'Issue certificate'}</Button>
            </form>
          </OperationCard>
          <RecordList title="Issued Certificates" rows={overview.certificates} primary="student_name" secondary="certificate_number" />
        </OperationsGrid>
      ) : null}

      {section === 'communication' ? (
        <OperationsGrid>
          <OperationCard title="Message Template">
            <form className="space-y-4" onSubmit={(event) => {
              event.preventDefault();
              void submit(() => createMessageTemplate(template));
            }}>
              <Field label="Template name"><Input required value={template.name} onChange={(event) => setTemplate((value) => ({ ...value, name: event.target.value }))} /></Field>
              <Field label="Subject"><Input value={template.subject} onChange={(event) => setTemplate((value) => ({ ...value, subject: event.target.value }))} /></Field>
              <Field label="Body"><Textarea required rows={5} value={template.body} onChange={(event) => setTemplate((value) => ({ ...value, body: event.target.value }))} /></Field>
              <Button disabled={saving}>{saving ? 'Saving...' : 'Save template'}</Button>
            </form>
          </OperationCard>
          <OperationCard title="Announcement">
            <form className="space-y-4" onSubmit={(event) => {
              event.preventDefault();
              void submit(() => createAnnouncement(announcement));
            }}>
              <Field label="Title"><Input required value={announcement.title} onChange={(event) => setAnnouncement((value) => ({ ...value, title: event.target.value }))} /></Field>
              <Field label="Audience">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={announcement.audience} onChange={(event) => setAnnouncement((value) => ({ ...value, audience: event.target.value }))}>
                  <option value="all_learners">All learners</option>
                  <option value="programme_students">Programme students</option>
                  <option value="short_course_learners">Short-course learners</option>
                  <option value="lecturers">Lecturers</option>
                  <option value="instructors">Instructors</option>
                  <option value="unpaid_fees">Students with unpaid fees</option>
                </select>
              </Field>
              <Field label="Body"><Textarea required rows={5} value={announcement.body} onChange={(event) => setAnnouncement((value) => ({ ...value, body: event.target.value }))} /></Field>
              <Button disabled={saving}>{saving ? 'Saving...' : 'Save announcement'}</Button>
            </form>
          </OperationCard>
          <RecordList title="Delivery Logs" rows={overview.deliveryLogs} primary="channel" secondary="status" />
        </OperationsGrid>
      ) : null}

      {section === 'reports' ? (
        <OperationsGrid>
          <OperationCard title="Save Report Snapshot">
            <form className="space-y-4" onSubmit={(event) => {
              event.preventDefault();
              void submit(() => createSavedReport({
                name: report.name,
                reportType: report.reportType,
                summary: { note: report.summary, generatedAt: new Date().toISOString() },
              }));
            }}>
              <Field label="Report name"><Input required value={report.name} onChange={(event) => setReport((value) => ({ ...value, name: event.target.value }))} /></Field>
              <Field label="Report type"><Input value={report.reportType} onChange={(event) => setReport((value) => ({ ...value, reportType: event.target.value }))} /></Field>
              <Field label="Summary"><Textarea rows={5} value={report.summary} onChange={(event) => setReport((value) => ({ ...value, summary: event.target.value }))} /></Field>
              <Button disabled={saving}>{saving ? 'Saving...' : 'Save report'}</Button>
            </form>
          </OperationCard>
          <RecordList title="Saved Reports" rows={overview.savedReports} primary="name" secondary="report_type" />
        </OperationsGrid>
      ) : null}

      {section === 'ai' ? <RecordList title="Instructor AI Generations" rows={overview.instructorAiGenerations} primary="title" secondary="status" /> : null}
      {section === 'content' ? <RecordList title="Course Review Submissions" rows={overview.courseReviewSubmissions} primary="title" secondary="status" /> : null}
    </div>
  );
}

function sectionTitle(section: string) {
  const labels: Record<string, string> = {
    finance: 'Finance Operations',
    certificates: 'Certificates',
    communication: 'Communication',
    reports: 'Reports',
    ai: 'AI Usage and Instructor Drafts',
    content: 'Content Review',
  };
  return labels[section] ?? 'Admin Operations';
}

function OperationsGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 xl:grid-cols-2">{children}</div>;
}

function OperationCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function RecordList({ title, rows, primary, secondary }: { title: string; rows: Row[]; primary: string; secondary: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length ? rows.map((row, index) => (
          <div key={String(row.id ?? index)} className="rounded-lg border p-4">
            <p className="font-semibold">{String(row[primary] ?? row.name ?? row.title ?? `Record ${index + 1}`)}</p>
            <p className="text-sm text-muted-foreground">{String(row[secondary] ?? row.status ?? '')}</p>
          </div>
        )) : <p className="text-sm text-muted-foreground">No records yet.</p>}
      </CardContent>
    </Card>
  );
}
