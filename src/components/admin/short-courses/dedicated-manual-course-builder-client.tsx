'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type BuilderMode = 'manual' | 'ai';
type BuilderStep = 'setup' | 'lessons' | 'cards' | 'quiz' | 'preview';

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

      {mode === 'ai' ? <AiHelperPlaceholder /> : <ManualStepPlaceholder step={step} />}
    </div>
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
