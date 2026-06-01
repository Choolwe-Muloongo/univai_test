'use client';

import { useState } from 'react';

import { MathText } from '@/components/learning/math-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhysicsVisualRenderer } from './PhysicsVisualRenderer';
import { clonePhysicsVisual } from './defaults';
import type { BlockRendererProps } from '../schemas';
import type { PhysicsVisual } from './types';

export function PhysicsBlockRenderer({ payload }: BlockRendererProps) {
  const visual = resolveVisual(payload);
  return (
    <div className="space-y-4">
      {payload.body ? <p className="text-sm leading-6 text-muted-foreground">{String(payload.body)}</p> : null}
      <PhysicsVisualRenderer visual={visual} mode="student" />
    </div>
  );
}

export function PhysicsBlockPreviewRenderer({ payload }: BlockRendererProps) {
  const visual = resolveVisual(payload);
  return <PhysicsVisualRenderer visual={visual} mode="preview" />;
}

export function PhysicsQuestionWithDiagramRenderer({ payload }: BlockRendererProps) {
  const visual = resolveVisualFromQuestion(payload);
  const question = resolveQuestion(payload);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const isCorrect = checked ? compareAnswer(answer, question.correctAnswer, question.tolerance) : false;
  const canCheck = answer.trim().length > 0 || question.options.length > 0;

  return (
    <div className="space-y-4">
      {payload.body ? <p className="text-sm leading-6 text-muted-foreground"><MathText text={String(payload.body)} /></p> : null}
      <PhysicsVisualRenderer visual={visual} mode="student" />
      <div className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Question with diagram</p>
        <p className="mt-2 break-words text-base font-semibold leading-7"><MathText text={question.prompt} /></p>
        {question.options.length ? (
          <div className="mt-4 grid gap-2">
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                disabled={checked}
                onClick={() => setAnswer(option)}
                className={`rounded-2xl border p-3 text-left text-sm transition ${answer === option ? 'border-primary bg-primary/5' : 'hover:border-primary/50'} ${checked ? 'cursor-default' : ''}`}
              >
                <MathText text={option} />
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input value={answer} disabled={checked} onChange={(event) => setAnswer(event.target.value)} placeholder={question.unit ? `Enter answer in ${question.unit}` : 'Enter your answer'} />
            <Button type="button" onClick={() => setChecked(true)} disabled={!answer.trim()}>Check answer</Button>
          </div>
        )}
        {question.options.length ? <Button type="button" className="mt-4" onClick={() => setChecked(true)} disabled={!canCheck || checked}>Check answer</Button> : null}
        {checked ? (
          <div className={`mt-4 rounded-2xl border p-4 text-sm ${isCorrect ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
            <p className="font-semibold">{isCorrect ? 'Correct' : 'Not quite'}</p>
            <p className="mt-1 break-words text-muted-foreground"><MathText text={question.explanation || `Correct answer: ${question.correctAnswer}${question.unit ? ` ${question.unit}` : ''}`} /></p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function resolveVisual(payload: Record<string, unknown>): PhysicsVisual {
  const visual = payload.visual;
  if (visual && typeof visual === 'object' && !Array.isArray(visual)) return normalizeVisual(visual as Partial<PhysicsVisual>);
  const template = typeof payload.physicsTemplate === 'string' ? payload.physicsTemplate : typeof payload.template === 'string' ? payload.template : 'free_body';
  if (template === 'pulley') return clonePhysicsVisual('pulley');
  if (template === 'collision') return clonePhysicsVisual('collision');
  return clonePhysicsVisual('free_body');
}

function resolveVisualFromQuestion(payload: Record<string, unknown>): PhysicsVisual {
  const diagram = payload.diagram ?? payload.visual;
  if (diagram && typeof diagram === 'object' && !Array.isArray(diagram)) return normalizeVisual(diagram as Partial<PhysicsVisual>);
  return resolveVisual(payload);
}

function resolveQuestion(payload: Record<string, unknown>) {
  const nested = payload.question && typeof payload.question === 'object' && !Array.isArray(payload.question) ? payload.question as Record<string, unknown> : {};
  return {
    prompt: String(nested.prompt ?? payload.prompt ?? payload.question ?? 'Answer the question using the diagram.'),
    correctAnswer: nested.correctAnswer ?? payload.correctAnswer ?? payload.answer ?? '',
    unit: String(nested.unit ?? payload.unit ?? ''),
    tolerance: Number(nested.tolerance ?? payload.tolerance ?? 0),
    explanation: String(nested.explanation ?? payload.explanation ?? ''),
    options: Array.isArray(nested.options) ? nested.options.map(String) : Array.isArray(payload.options) ? payload.options.map(String) : [],
  };
}

function normalizeVisual(visual: Partial<PhysicsVisual>): PhysicsVisual {
  return {
    id: visual.id || 'physics-visual-json',
    subject: 'physics',
    visualType: visual.visualType || 'diagram',
    template: visual.template || 'custom',
    renderMode: visual.renderMode || 'svg',
    canvas: {
      width: Number(visual.canvas?.width || 800),
      height: Number(visual.canvas?.height || 500),
      background: visual.canvas?.background || 'plain',
      unitScale: visual.canvas?.unitScale,
    },
    objects: Array.isArray(visual.objects) ? visual.objects : [],
    labels: Array.isArray(visual.labels) ? visual.labels : [],
    arrows: Array.isArray(visual.arrows) ? visual.arrows : [],
    hotspots: Array.isArray(visual.hotspots) ? visual.hotspots : [],
    steps: Array.isArray(visual.steps) ? visual.steps : [],
    interactions: Array.isArray(visual.interactions) ? visual.interactions : [],
    equations: Array.isArray(visual.equations) ? visual.equations : [],
    metadata: visual.metadata || visual,
  } as PhysicsVisual;
}

function compareAnswer(actual: string, expected: unknown, tolerance: number) {
  const expectedText = String(expected ?? '').trim();
  const actualText = actual.trim();
  const actualNumber = Number(actualText.replace(/[^0-9.+-]/g, ''));
  const expectedNumber = Number(expectedText.replace(/[^0-9.+-]/g, ''));
  if (Number.isFinite(actualNumber) && Number.isFinite(expectedNumber)) return Math.abs(actualNumber - expectedNumber) <= Math.max(tolerance, 0.000001);
  return actualText.toLowerCase().replace(/\s+/g, ' ') === expectedText.toLowerCase().replace(/\s+/g, ' ');
}
