import { MathText } from '@/components/learning/math-text';
import { Button } from '@/components/ui/button';
import type { PhysicsTeachingStep } from '../types';

type Props = {
  step: PhysicsTeachingStep | null;
  stepIndex: number;
  totalSteps: number;
  onStepIndexChange: (index: number) => void;
  onFeedbackReset?: () => void;
};

export function PhysicsStepPanel({ step, stepIndex, totalSteps, onStepIndexChange, onFeedbackReset }: Props) {
  if (!step) return null;
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Step {stepIndex + 1} of {totalSteps}</p>
          <h4 className="mt-1 font-semibold"><MathText text={step.title} /></h4>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" disabled={stepIndex === 0} onClick={() => { onStepIndexChange(Math.max(0, stepIndex - 1)); onFeedbackReset?.(); }}>Back</Button>
          <Button type="button" size="sm" disabled={stepIndex >= totalSteps - 1} onClick={() => { onStepIndexChange(Math.min(totalSteps - 1, stepIndex + 1)); onFeedbackReset?.(); }}>Next step</Button>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground"><MathText text={step.explanation} /></p>
      {step.equation ? <div className="mt-3 rounded-xl border bg-background p-3 text-center text-lg font-semibold"><MathText text={`$${step.equation}$`} /></div> : null}
    </div>
  );
}
