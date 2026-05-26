'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, Brain, GraduationCap, HelpCircle, Lightbulb, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MathText } from '@/components/learning/math-text';
import type { AccountingCardContent } from './engine';
import { accountingLearningModes, modeInstruction, type AccountingLearningMode } from './learner-experience';
import { buildAccountingHints } from './hint-engine';
import { buildAccountingMistakeFeedback } from './mistake-feedback';
import { buildAccountingTeachingFlow } from './teaching-flows';

export function AccountingTeachingPlayer({ content, title, children }: { content: AccountingCardContent; title: string; children: ReactNode }) {
  const [mode, setMode] = useState<AccountingLearningMode>('teach');
  const [hintLevel, setHintLevel] = useState(0);
  const flow = useMemo(() => buildAccountingTeachingFlow(content, title), [content, title]);
  const hints = useMemo(() => buildAccountingHints(content, title), [content, title]);
  const feedback = useMemo(() => buildAccountingMistakeFeedback(content), [content]);
  const activeHint = hints.hints[Math.min(hintLevel, Math.max(hints.hints.length - 1, 0))];
  const hasWorkpaper = Boolean(children);

  return (
    <div className="min-w-0 max-w-full space-y-3 overflow-hidden break-words">
      <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-3 shadow-sm sm:p-4">
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,300px)]">
          <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">Accounting Teaching Experience</span>
            </div>
            <h3 className="break-words text-base font-semibold tracking-tight sm:text-lg"><MathText text={flow.topic} /></h3>
            <p className="break-words text-sm leading-6 text-muted-foreground"><MathText text={flow.teacherIntro} /></p>
          </div>
          <div className="min-w-0 rounded-xl border bg-background/70 p-3 text-xs leading-5 text-muted-foreground">
            <div className="mb-1 flex min-w-0 items-center gap-2 font-semibold text-foreground">
              <Target className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 break-words">Learner goal</span>
            </div>
            <div className="min-w-0 break-words"><MathText text={flow.learnerGoal} /></div>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-2 sm:grid-cols-2">
        {accountingLearningModes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={`min-w-0 rounded-2xl border p-3 text-left transition-all hover:border-primary/50 ${mode === item.id ? 'border-primary bg-primary/10 shadow-sm' : 'bg-background'}`}
          >
            <div className="break-words text-sm font-semibold">{item.label}</div>
            <div className="mt-1 line-clamp-2 break-words text-xs leading-5 text-muted-foreground">{item.description}</div>
          </button>
        ))}
      </div>

      <div className="min-w-0 rounded-2xl border bg-muted/20 p-3 text-sm leading-6 text-muted-foreground">
        <span className="font-medium text-foreground">Current mode:</span> <span className="break-words">{modeInstruction(mode)}</span>
      </div>

      {mode === 'teach' || mode === 'guided_practice' ? (
        <details className="min-w-0 max-w-full overflow-hidden rounded-2xl border bg-background p-3 shadow-sm sm:p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">Show accounting teaching path</summary>
          <div className="mt-3"><AccountingTeachingSteps flow={flow} /></div>
        </details>
      ) : null}

      {mode === 'guided_practice' ? (
        <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="mb-2 flex min-w-0 items-center gap-2 text-sm font-semibold">
            <HelpCircle className="h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{hints.title}</span>
          </div>
          <p className="break-words text-sm leading-6 text-muted-foreground"><MathText text={activeHint ?? 'Try the workpaper first, then request a hint.'} /></p>
          <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
            <Button type="button" size="sm" variant="outline" onClick={() => setHintLevel((current) => Math.max(0, current - 1))} disabled={hintLevel === 0} className="w-full sm:w-auto">Less help</Button>
            <Button type="button" size="sm" onClick={() => setHintLevel((current) => Math.min(hints.hints.length - 1, current + 1))} disabled={hintLevel >= hints.hints.length - 1} className="w-full sm:w-auto">Give me another hint</Button>
          </div>
        </section>
      ) : null}

      {mode === 'correction' ? (
        <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="mb-3 flex min-w-0 items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{feedback.title}</span>
          </div>
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            {feedback.checks.slice(0, 2).map((item) => (
              <div key={item.mistake} className="min-w-0 rounded-xl border bg-background/70 p-3">
                <div className="mb-1 break-words text-sm font-semibold"><MathText text={item.mistake} /></div>
                <p className="break-words text-xs leading-5 text-muted-foreground"><MathText text={item.feedback} /></p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === 'exam' ? (
        <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
          <div className="mb-2 flex min-w-0 items-center gap-2 text-sm font-semibold">
            <Brain className="h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">Exam mode</span>
          </div>
          <p className="break-words text-sm leading-6 text-muted-foreground">Attempt the workpaper without hints. After attempting, switch to Correction Mode and Teach Mode to compare your reasoning with the model logic.</p>
        </section>
      ) : null}

      {hasWorkpaper ? (
        <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border bg-background p-3 sm:p-4">
          <div className="mb-3 flex min-w-0 items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 break-words">Accounting workpaper</span>
          </div>
          <div className="min-w-0 max-w-full overflow-hidden">{children}</div>
        </section>
      ) : null}

      <details className="min-w-0 max-w-full overflow-hidden rounded-2xl border bg-muted/20 p-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">Common mistake and exam tip</summary>
        <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2">
          <div className="min-w-0 rounded-2xl border bg-background/70 p-4">
            <div className="mb-2 text-sm font-semibold">Common mistake</div>
            <p className="break-words text-sm leading-6 text-muted-foreground"><MathText text={flow.commonMistake} /></p>
          </div>
          <div className="min-w-0 rounded-2xl border bg-background/70 p-4">
            <div className="mb-2 text-sm font-semibold">Exam tip</div>
            <p className="break-words text-sm leading-6 text-muted-foreground"><MathText text={flow.examTip} /></p>
          </div>
        </div>
      </details>
    </div>
  );
}

function AccountingTeachingSteps({ flow }: { flow: ReturnType<typeof buildAccountingTeachingFlow> }) {
  if (!flow.steps.length) return null;

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border bg-background p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex min-w-0 items-center gap-2 text-sm font-semibold">
        <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 break-words">Accounting teaching path</span>
      </div>
      <div className="grid min-w-0 gap-3">
        {flow.steps.slice(0, 3).map((step, index) => (
          <article key={`${step.kind}-${index}`} className="min-w-0 rounded-2xl border bg-muted/20 p-3 sm:p-4">
            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <span className="rounded-full bg-primary/10 px-2 py-1">Step {index + 1}</span>
              <span className="min-w-0 break-words">{step.kind.replace(/_/g, ' ')}</span>
            </div>
            <h4 className="break-words text-base font-semibold"><MathText text={step.title} /></h4>
            <p className="mt-2 break-words text-sm leading-6 text-muted-foreground"><MathText text={step.body} /></p>
            {step.prompt ? <div className="mt-3 min-w-0 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm leading-6"><MathText text={step.prompt} /></div> : null}
          </article>
        ))}
      </div>
      {flow.steps.length > 3 ? <p className="mt-3 text-xs text-muted-foreground">Extra steps are reserved for separate lesson cards so this slide stays readable.</p> : null}
    </section>
  );
}