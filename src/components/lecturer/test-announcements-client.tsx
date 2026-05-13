'use client';

import { FormEvent, useEffect, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { createTestAnnouncement, getLecturerTestingOverview } from '@/lib/api';

type Row = Record<string, unknown>;

type LecturerTestingOverview = {
  courseOfferings?: Row[];
  testAnnouncements?: Row[];
  assessments?: Row[];
};

export function TestAnnouncementsClient({ createFirst = false }: { createFirst?: boolean }) {
  const [overview, setOverview] = useState<LecturerTestingOverview>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    courseOfferingId: '',
    title: '',
    description: '',
    testDate: '',
    durationMinutes: '60',
    format: 'mixed',
    difficulty: 'standard',
    coverage: '',
    status: 'published',
  });

  async function refresh() {
    const data = (await getLecturerTestingOverview()) as LecturerTestingOverview;
    setOverview(data);
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Testing workspace is unavailable.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createTestAnnouncement({
        courseOfferingId: form.courseOfferingId ? Number(form.courseOfferingId) : null,
        title: form.title,
        description: form.description || buildDescription(form.coverage),
        testDate: form.testDate || null,
        durationMinutes: Number(form.durationMinutes) || 60,
        format: form.format,
        difficulty: form.difficulty,
        status: form.status,
        coverage: form.coverage
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((topic) => ({ topic })),
      });
      setForm((value) => ({ ...value, title: '', description: '', coverage: '' }));
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create test announcement.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading message="Loading lecturer test announcements..." />;

  const formCard = (
    <Card>
      <CardHeader>
        <CardTitle>Create Test Announcement</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={save}>
          <Field label="Course offering">
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.courseOfferingId} onChange={(event) => setForm((value) => ({ ...value, courseOfferingId: event.target.value }))}>
              <option value="">General course announcement</option>
              {(overview.courseOfferings ?? []).map((offering) => (
                <option key={String(offering.id)} value={String(offering.id)}>
                  Offering {String(offering.id)} - {String(offering.status ?? 'active')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title">
            <Input required value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} />
          </Field>
          <Field label="Test date">
            <Input type="datetime-local" value={form.testDate} onChange={(event) => setForm((value) => ({ ...value, testDate: event.target.value }))} />
          </Field>
          <Field label="Duration minutes">
            <Input type="number" min={10} value={form.durationMinutes} onChange={(event) => setForm((value) => ({ ...value, durationMinutes: event.target.value }))} />
          </Field>
          <Field label="Format">
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.format} onChange={(event) => setForm((value) => ({ ...value, format: event.target.value }))}>
              <option value="mixed">Mixed questions</option>
              <option value="mcq">Multiple choice</option>
              <option value="short_answer">Short answer</option>
              <option value="practical">Practical</option>
              <option value="essay">Essay</option>
            </select>
          </Field>
          <Field label="Difficulty">
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.difficulty} onChange={(event) => setForm((value) => ({ ...value, difficulty: event.target.value }))}>
              <option value="foundation">Foundation</option>
              <option value="standard">Standard</option>
              <option value="advanced">Advanced</option>
            </select>
          </Field>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Coverage topics, one per line</Label>
            <Textarea required rows={6} value={form.coverage} onChange={(event) => setForm((value) => ({ ...value, coverage: event.target.value }))} placeholder="Unit 1: Core definitions&#10;Unit 2: Worked examples&#10;Practical case study" />
          </div>
          <Button className="sm:col-span-2" disabled={saving}>{saving ? 'Publishing...' : 'Publish test announcement'}</Button>
        </form>
      </CardContent>
    </Card>
  );

  const listCard = (
    <Card>
      <CardHeader>
        <CardTitle>Published Announcements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(overview.testAnnouncements ?? []).length ? (overview.testAnnouncements ?? []).map((test) => (
          <article key={String(test.id)} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{String(test.title ?? 'Test announcement')}</p>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{String(test.status ?? 'draft')}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{String(test.description ?? 'Coverage supplied by lecturer.')}</p>
            <p className="mt-2 text-sm text-muted-foreground">Date: {String(test.test_date ?? test.testDate ?? 'To be confirmed')}</p>
          </article>
        )) : <p className="text-sm text-muted-foreground">No test announcements yet.</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-normal text-primary">Lecturer Testing</p>
        <h1 className="text-3xl font-bold">Test Announcements</h1>
        <p className="max-w-3xl text-muted-foreground">
          Announce tests with clear coverage so students can use lecturer-supervised AI prep tied to the real assessment.
        </p>
      </section>

      {error ? <PageError message={error} /> : null}
      {createFirst ? formCard : listCard}
      {createFirst ? listCard : formCard}
    </div>
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

function buildDescription(coverage: string) {
  const topics = coverage.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 3);
  return topics.length
    ? `This assessment covers ${topics.join(', ')}. Use the AI study engine for summaries, flashcards and practice questions based on the approved coverage.`
    : 'Assessment coverage has been defined by the lecturer.';
}
