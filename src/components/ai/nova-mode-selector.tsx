'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, Brain, Code2, Compass, Dumbbell, FileText, GraduationCap } from 'lucide-react';

export const novaModes = [
  { id: 'tutor', label: 'Tutor', description: 'Guide me step by step', icon: BookOpen },
  { id: 'explain', label: 'Explain', description: 'Make this clearer', icon: Brain },
  { id: 'quiz', label: 'Quiz Me', description: 'Test me one question at a time', icon: Dumbbell },
  { id: 'summarize', label: 'Summarize', description: 'Compress the lesson', icon: FileText },
  { id: 'exam_prep', label: 'Exam Prep', description: 'Prepare for assessment', icon: GraduationCap },
  { id: 'code_help', label: 'Code Help', description: 'Hints before solutions', icon: Code2 },
  { id: 'study_plan', label: 'Study Plan', description: 'Plan my next move', icon: Compass },
] as const;

export type NovaMode = (typeof novaModes)[number]['id'];

const modeInstruction: Record<NovaMode, string> = {
  tutor: 'Act as a patient tutor. Explain step by step and check that the learner understands.',
  explain: 'Explain the concept in simpler words, then give a practical example.',
  quiz: 'Quiz the learner one question at a time. Wait for their answer before giving the next question.',
  summarize: 'Summarize the content into clear study notes with the most important points first.',
  exam_prep: 'Prepare the learner for an exam. Focus on likely questions, weak areas, and revision priorities.',
  code_help: 'Help with code by giving hints first. Do not reveal the full solution unless the learner asks.',
  study_plan: 'Create a practical study plan with clear priorities and short tasks.',
};

export function getNovaModeInstruction(mode: NovaMode) {
  return modeInstruction[mode];
}

type NovaModeSelectorProps = {
  value: NovaMode;
  onChange: (mode: NovaMode) => void;
  disabled?: boolean;
  compact?: boolean;
};

export function NovaModeSelector({ value, onChange, disabled = false, compact = false }: NovaModeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Nova mode</p>
        <p className="hidden text-xs text-muted-foreground sm:block">Choose how Nova should think.</p>
      </div>
      <div className={cn('grid gap-2', compact ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-7')}>
        {novaModes.map((mode) => {
          const Icon = mode.icon;
          const active = value === mode.id;
          return (
            <Button
              key={mode.id}
              type="button"
              variant={active ? 'default' : 'outline'}
              className={cn(
                'h-auto flex-col items-start justify-start gap-1 rounded-2xl px-3 py-3 text-left',
                active ? 'shadow-[0_18px_38px_-24px_hsl(var(--primary))]' : 'bg-background/70'
              )}
              disabled={disabled}
              onClick={() => onChange(mode.id)}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4" />
                {mode.label}
              </span>
              {!compact ? <span className="text-[11px] font-normal opacity-80">{mode.description}</span> : null}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
