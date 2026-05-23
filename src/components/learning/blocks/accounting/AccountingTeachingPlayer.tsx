'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, Brain, GraduationCap, HelpCircle, Lightbulb, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MathText } from '@/components/learning/math-text';
import type { AccountingCardContent } from './engine';
import { accountingLearningModes, modeInstruction, type AccountingLearningMode } from './learner-experience';
import { buildAccountingHints } from './hint-engine';
import { buildAccountingMistakeFeedback } from './mistake-feedback';
import { AccountingStepPlayer } from './accounting-step-player';
import { buildAccountingTeachingFlow } from './teaching-flows';

export function AccountingTeachingPlayer({ content, title, children }: { content: AccountingCardContent; title: string; children: ReactNode }) {
  const [mode, setMode] = useState<AccountingLearningMode>('teach');
  const [hintLevel, setHintLevel] = useState(0);
  const flow = useMemo(() => buildAccountingTeachingFlow(content, title), [content, title]);
  const hints = useMemo(() => buildAccountingHints(content, title), [content, title]);
  const feedback = useMemo(() => buildAccountingMistakeFeedback(content), [content]);
  const activeHint = hints.hints[Math.min(hintLevel, Math.max(hints.hints.length - 1, 0))];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><GraduationCap className="size-4" /> Accounting Teaching Experience</div>
            <h3 className="text-lg font-semibold tracking-tight"><MathText text={flow.topic} /></h3>
            <p className="text-sm leading-6 text-muted-foreground"><MathText text={flow.teacherIntro} /></p>
          </div>
          <div className="rounded-xl border bg-background/70 p-3 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-semibold text-foreground"><Target className="size-4 text-primary" /> Learner goal</div>
            <MathText text={flow.learnerGoal} />
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {accountingLearningModes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={`rounded-2xl border p-3 text-left transition-all hover:border-primary/50 ${mode === item.id ? 'border-primary bg-primary/10 shadow-sm' : 'bg-background'}`}
          >
            <div className="text-sm font-semibold">{item.label}</div>
            <div className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-muted/20 p-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Current mode:</span> {modeInstruction(mode)}
      </div>

      {mode === 'teach' || mode === 'guided_practice' ? <AccountingStepPlayer flow={flow} /> : null}

      {mode === 'guided_practice' ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><HelpCircle className="size-4" /> {hints.title}</div>
          <p className="text-sm leading-6 text-muted-foreground"><MathText text={activeHint ?? 'Try the workpaper first, then request a hint.'} /></p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setHintLevel((current) => Math.max(0, current - 1))} disabled={hintLevel === 0}>Less help</Button>
            <Button type="button" size="sm" onClick={() => setHintLevel((current) => Math.min(hints.hints.length - 1, current + 1))} disabled={hintLevel >= hints.hints.length - 1}>Give me another hint</Button>
          </div>
        </div>
      ) : null}

      {mode === 'correction' ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="size-4" /> {feedback.title}</div>
          <div className="grid gap-3 md:grid-cols-2">
            {feedback.checks.map((item) => (
              <div key={item.mistake} className="rounded-xl border bg-background/70 p-3">
                <div className="mb-1 text-sm font-semibold"><MathText text={item.mistake} /></div>
                <p className="text-xs leading-5 text-muted-foreground"><MathText text={item.feedback} /></p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {mode === 'exam' ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Brain className="size-4" /> Exam mode</div>
          <p className="text-sm leading-6 text-muted-foreground">Attempt the workpaper without hints. After attempting, switch to Correction Mode and Teach Mode to compare your reasoning with the model logic.</p>
        </div>
      ) : null}

      <div className="rounded-2xl border bg-background p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Lightbulb className="size-4 text-primary" /> Animated accounting workpaper</div>
        {children}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border bg-muted/20 p-4">
          <div className="mb-2 text-sm font-semibold">Common mistake</div>
          <p className="text-sm leading-6 text-muted-foreground"><MathText text={flow.commonMistake} /></p>
        </div>
        <div className="rounded-2xl border bg-muted/20 p-4">
          <div className="mb-2 text-sm font-semibold">Exam tip</div>
          <p className="text-sm leading-6 text-muted-foreground"><MathText text={flow.examTip} /></p>
        </div>
      </div>
    </div>
  );
}
