'use client';

import { FormEvent, useEffect, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { createAiStudySession, getStudentLearningOverview } from '@/lib/api';

type Row = Record<string, unknown>;

type StudentLearningOverview = {
  courseEnrollments?: Row[];
  testAnnouncements?: Row[];
  studyDocuments?: Row[];
  studySessions?: Row[];
};

export function StudentAiStudyClient({ initialMode = 'study_vault' }: { initialMode?: 'study_vault' | 'cram_mode' | 'combined' }) {
  const [overview, setOverview] = useState<StudentLearningOverview>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    courseId: '',
    testAnnouncementId: '',
    mode: initialMode,
    goal: '',
    availableMinutes: initialMode === 'cram_mode' ? '120' : '180',
    sourceDocumentIds: '',
    officialDocumentIds: '',
  });

  async function refresh() {
    const data = (await getStudentLearningOverview()) as StudentLearningOverview;
    setOverview(data);
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'AI study workspace is unavailable.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function createSession(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createAiStudySession({
        courseId: form.courseId || null,
        testAnnouncementId: form.testAnnouncementId ? Number(form.testAnnouncementId) : null,
        mode: form.mode,
        goal: buildGoal(form.goal, form.mode),
        availableMinutes: Number(form.availableMinutes) || 120,
        sourceDocumentIds: parseIds(form.sourceDocumentIds),
        officialDocumentIds: parseIds(form.officialDocumentIds),
      });
      setForm((value) => ({ ...value, goal: '', sourceDocumentIds: '', officialDocumentIds: '' }));
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create AI study session.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading message="Loading AI study workspace..." />;

  const sessions = overview.studySessions ?? [];
  const documents = overview.studyDocuments ?? [];
  const tests = overview.testAnnouncements ?? [];

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-normal text-primary">AI Study Engine</p>
        <h1 className="text-3xl font-bold">{form.mode === 'cram_mode' ? 'Cram Mode' : 'AI Study Vault'}</h1>
        <p className="max-w-3xl text-muted-foreground">
          Combine approved UnivAI materials, lecturer test coverage and your own notes into protected summaries, quizzes, flashcards and revision plans.
        </p>
      </section>

      {error ? <PageError message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create Study Session</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={createSession}>
              <Field label="Mode">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.mode} onChange={(event) => setForm((value) => ({ ...value, mode: event.target.value as typeof initialMode }))}>
                  <option value="study_vault">AI Study Vault</option>
                  <option value="combined">Combined Study Mode</option>
                  <option value="cram_mode">Cram Mode</option>
                </select>
              </Field>
              <Field label="Course ID">
                <Input value={form.courseId} onChange={(event) => setForm((value) => ({ ...value, courseId: event.target.value }))} placeholder="Optional course id" />
              </Field>
              <Field label="Upcoming test">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.testAnnouncementId} onChange={(event) => setForm((value) => ({ ...value, testAnnouncementId: event.target.value }))}>
                  <option value="">No linked test</option>
                  {tests.map((test) => (
                    <option key={String(test.id)} value={String(test.id)}>
                      {String(test.title ?? `Test ${test.id}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Available minutes">
                <Input type="number" min={30} value={form.availableMinutes} onChange={(event) => setForm((value) => ({ ...value, availableMinutes: event.target.value }))} />
              </Field>
              <Field label="Goal">
                <Textarea rows={4} value={form.goal} onChange={(event) => setForm((value) => ({ ...value, goal: event.target.value }))} placeholder="Example: I need to pass tomorrow's database test and I am weak on normalization." />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Uploaded document IDs">
                  <Input value={form.sourceDocumentIds} onChange={(event) => setForm((value) => ({ ...value, sourceDocumentIds: event.target.value }))} placeholder="1,2,3" />
                </Field>
                <Field label="Official document IDs">
                  <Input value={form.officialDocumentIds} onChange={(event) => setForm((value) => ({ ...value, officialDocumentIds: event.target.value }))} placeholder="10,11" />
                </Field>
              </div>
              <Button disabled={saving}>{saving ? 'Creating...' : 'Create AI study plan'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Student uploads: {documents.length}. Upcoming tests with lecturer coverage: {tests.length}.
            </p>
            <div className="grid gap-3">
              {tests.slice(0, 5).map((test) => (
                <div key={String(test.id)} className="rounded-lg border p-3">
                  <p className="font-medium">{String(test.title ?? 'Upcoming test')}</p>
                  <p className="text-sm text-muted-foreground">{String(test.test_date ?? test.testDate ?? 'Date to be confirmed')}</p>
                </div>
              ))}
              {!tests.length ? <p className="text-sm text-muted-foreground">No lecturer test announcements yet.</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generated Study Plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length ? sessions.map((session) => (
            <article key={String(session.id)} className="rounded-lg border p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-semibold">{String(session.mode ?? 'study session')}</p>
                <span className="text-sm text-muted-foreground">{String(session.available_minutes ?? session.availableMinutes ?? '')} minutes</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{String(session.output_summary ?? session.outputSummary ?? '').slice(0, 1800)}</p>
            </article>
          )) : <p className="text-sm text-muted-foreground">No study sessions yet.</p>}
        </CardContent>
      </Card>
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

function parseIds(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function buildGoal(goal: string, mode: string) {
  if (goal.trim()) return goal.trim();
  if (mode === 'cram_mode') return 'Create an urgent, focused exam preparation plan using my permitted materials and weak areas.';
  if (mode === 'combined') return 'Combine official UnivAI materials and my uploaded notes into a practical study plan.';
  return 'Organise approved study materials into summaries, flashcards, quizzes and weak-area practice.';
}
