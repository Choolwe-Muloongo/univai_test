'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { getSchools } from '@/lib/api';
import type { School } from '@/lib/api/types';

type BuilderMode = 'manual' | 'ai';
type BuilderStep = 'setup' | 'lessons' | 'cards' | 'quiz' | 'preview';

type CourseForm = {
  title: string;
  description: string;
  schoolId: string;
  level: string;
  durationHours: string;
  entryFee: string;
  currency: string;
  certificateFee: string;
};

const manualSteps: Array<{ id: BuilderStep; label: string; description: string }> = [
  { id: 'setup', label: 'Setup', description: 'Course details' },
  { id: 'lessons', label: 'Lessons', description: 'Plan chapters' },
  { id: 'cards', label: 'Cards', description: 'Build content' },
  { id: 'quiz', label: 'Quiz Bank', description: 'Practice questions' },
  { id: 'preview', label: 'Preview', description: 'Student view' },
];

export function DedicatedManualCourseBuilderClient() {
  const [mode, setMode] = useState<BuilderMode>('manual');
  const [step, setStep] = useState<BuilderStep>('setup');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm>({
    title: '',
    description: '',
    schoolId: '',
    level: 'beginner',
    durationHours: '8',
    entryFee: '0',
    currency: 'ZMW',
    certificateFee: '0',
  });

  useEffect(() => {
    let mounted = true;
    getSchools()
      .then((data) => {
        if (!mounted) return;
        setSchools(data);
        if (data[0]) setForm((value) => ({ ...value, schoolId: data[0].id }));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load schools.'))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) return <PageLoading message="Loading manual studio..." />;

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-primary/20 shadow-sm">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-primary">Dedicated manual course studio</p>
              <h2 className="text-2xl font-bold">Create courses visually without JSON.</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manual tools stay clean. AI tools stay separate. Switch only when you want AI help.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={mode === 'manual' ? 'default' : 'outline'} onClick={() => setMode('manual')}>
                Manual builder
              </Button>
              <Button type="button" variant={mode === 'ai' ? 'default' : 'outline'} onClick={() => setMode('ai')}>
                AI helper
              </Button>
            </div>
          </div>

          {mode === 'manual' ? (
            <div className="grid gap-2 md:grid-cols-5">
              {manualSteps.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStep(item.id)}
                  className={`rounded-2xl border p-3 text-left transition ${step === item.id ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/50'}`}
                >
                  <p className="text-sm font-semibold">{index + 1}. {item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {error ? <PageError message={error} /> : null}
      {mode === 'ai' ? <AiHelperPlaceholder /> : <ManualStep step={step} form={form} setForm={setForm} schools={schools} goNext={() => setStep('lessons')} />}
    </div>
  );
}

function ManualStep({ step, form, setForm, schools, goNext }: { step: BuilderStep; form: CourseForm; setForm: React.Dispatch<React.SetStateAction<CourseForm>>; schools: School[]; goNext: () => void }) {
  if (step === 'setup') return <SetupStep form={form} setForm={setForm} schools={schools} goNext={goNext} />;
  return <ManualStepPlaceholder step={step} />;
}

function SetupStep({ form, setForm, schools, goNext }: { form: CourseForm; setForm: React.Dispatch<React.SetStateAction<CourseForm>>; schools: School[]; goNext: () => void }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Course setup</CardTitle>
        <CardDescription>Manual setup only. No AI prompt, no document upload, no JSON.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Field label="Course title">
          <Input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} placeholder="Example: Software Development Fundamentals" />
        </Field>
        <Field label="Course description">
          <Textarea rows={4} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} placeholder="Explain what learners will learn and why the course matters." />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="School / Faculty">
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.schoolId} onChange={(event) => setForm((value) => ({ ...value, schoolId: event.target.value }))}>
              {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
            </select>
          </Field>
          <Field label="Course level">
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.level} onChange={(event) => setForm((value) => ({ ...value, level: event.target.value }))}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </Field>
          <Field label="Total hours">
            <Input type="number" min={1} value={form.durationHours} onChange={(event) => setForm((value) => ({ ...value, durationHours: event.target.value }))} />
          </Field>
          <Field label="Entry fee">
            <Input type="number" min={0} value={form.entryFee} onChange={(event) => setForm((value) => ({ ...value, entryFee: event.target.value }))} />
          </Field>
          <Field label="Currency">
            <Input value={form.currency} onChange={(event) => setForm((value) => ({ ...value, currency: event.target.value.toUpperCase() }))} />
          </Field>
          <Field label="Certificate fee">
            <Input type="number" min={0} value={form.certificateFee} onChange={(event) => setForm((value) => ({ ...value, certificateFee: event.target.value }))} />
          </Field>
        </div>
        <Button type="button" onClick={goNext}>Continue to lessons</Button>
      </CardContent>
    </Card>
  );
}

function ManualStepPlaceholder({ step }: { step: BuilderStep }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>{manualSteps.find((item) => item.id === step)?.label}</CardTitle>
        <CardDescription>This section will be upgraded in the next commits.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Manual mode will not show document upload, AI prompts, or JSON fields.
      </CardContent>
    </Card>
  );
}

function AiHelperPlaceholder() {
  return (
    <Card className="rounded-3xl border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>AI helper</CardTitle>
        <CardDescription>AI tools live here only. After AI generates a draft, admins edit it manually.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Prompt and document upload tools will be added here, away from the manual builder.
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
