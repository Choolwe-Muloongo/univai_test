'use client';

import { useState } from 'react';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MathText } from '@/components/learning/math-text';
import type { AccountingTeachingFlow } from './teaching-flows';

export function AccountingStepPlayer({ flow }: { flow: AccountingTeachingFlow }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = flow.steps[stepIndex] ?? flow.steps[0];
  const progress = flow.steps.length ? Math.round(((stepIndex + 1) / flow.steps.length) * 100) : 0;

  return (
    <div className="space-y-3 rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="size-4 text-primary" /> Accounting teaching path</div>
          <div className="mt-1 text-xs text-muted-foreground">Step {stepIndex + 1} of {flow.steps.length} · {progress}% complete</div>
        </div>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="rounded-2xl border bg-muted/20 p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <GraduationCap className="size-4" /> {step.kind.replace(/_/g, ' ')}
        </div>
        <h4 className="text-base font-semibold"><MathText text={step.title} /></h4>
        <p className="mt-2 text-sm leading-6 text-muted-foreground"><MathText text={step.body} /></p>
        {step.prompt ? <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm"><MathText text={step.prompt} /></div> : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setStepIndex((current) => Math.max(0, current - 1))} disabled={stepIndex === 0}>
          <ChevronLeft className="mr-1 size-4" /> Previous
        </Button>
        <div className="flex flex-wrap gap-1">
          {flow.steps.map((item, index) => (
            <button
              key={`${item.kind}-${index}`}
              type="button"
              onClick={() => setStepIndex(index)}
              className={`size-2 rounded-full transition-all ${index === stepIndex ? 'w-6 bg-primary' : index < stepIndex ? 'bg-primary/60' : 'bg-muted-foreground/30'}`}
              aria-label={`Go to accounting teaching step ${index + 1}`}
            />
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setStepIndex((current) => Math.min(flow.steps.length - 1, current + 1))} disabled={stepIndex >= flow.steps.length - 1}>
          Next <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>

      {stepIndex >= flow.steps.length - 1 ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
          <CheckCircle2 className="size-4" /> You have completed the guided teaching path. Now test yourself in the workbook area.
        </div>
      ) : null}
    </div>
  );
}
