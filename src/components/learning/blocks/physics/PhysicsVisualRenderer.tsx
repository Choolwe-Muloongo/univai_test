'use client';

import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PhysicsVisual } from './types';
import { PhysicsInteractionPanel } from './renderers/PhysicsInteractionPanel';
import { PhysicsStepPanel } from './renderers/PhysicsStepPanel';
import { SvgDiagramRenderer } from './renderers/SvgDiagramRenderer';
import { evaluatePhysicsInteraction, type PhysicsFeedbackState } from './renderers/physicsRuntime';
import { getScientificRenderer } from '../science-engine/renderers/rendererRegistry';

type Props = {
  visual: PhysicsVisual;
  mode?: 'builder' | 'student' | 'preview';
};

export function PhysicsVisualRenderer({ visual, mode = 'student' }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<PhysicsFeedbackState>(null);
  const steps = visual.steps ?? [];
  const interactions = visual.interactions ?? [];
  const activeStep = steps[stepIndex] ?? null;
  const activeInteraction = interactions[0] ?? activeStep?.checkpointQuestion ?? null;
  const highlightedIds = useMemo(() => new Set(activeStep?.highlightObjectIds ?? []), [activeStep]);
  const hiddenIds = useMemo(() => new Set(activeStep?.hideObjectIds ?? []), [activeStep]);

  function handleTarget(targetId: string) {
    setSelectedTargetId(targetId);
    if (!activeInteraction) return;
    setFeedback(evaluatePhysicsInteraction(activeInteraction, targetId));
  }

  function reset() {
    setStepIndex(0);
    setSelectedTargetId(null);
    setFeedback(null);
  }

  const rendererProps: Parameters<typeof SvgDiagramRenderer>[0] = { visual, highlightedIds, hiddenIds, selectedTargetId, onSelect: handleTarget };

  return (
    <div className="min-w-0 space-y-4 overflow-hidden rounded-3xl border bg-background p-3 shadow-sm sm:p-4">
      <SharedScienceSvgDefs />
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Scientific & Engineering Visual Engine</p>
          <p className="break-words text-sm text-muted-foreground">{visual.template.replace(/_/g, ' ')} · {visual.visualType}{visual.physicsLevel ? ` · ${visual.physicsLevel.replace(/_/g, ' ')}` : ''}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {mode === 'builder' ? <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Builder preview</span> : null}
          <Button type="button" variant="outline" size="sm" className="min-h-10" onClick={reset}>
            <RotateCcw className="mr-2 size-4" /> Reset
          </Button>
        </div>
      </div>

      <div className="min-w-0 max-w-full overflow-x-auto rounded-2xl overscroll-x-contain">
        <div className="min-w-0 [&_svg]:h-auto [&_svg]:max-h-[70vh] [&_svg]:w-full [&_svg]:max-w-full [&_text]:select-none">
          {renderPhysicsVisual(visual, rendererProps)}
        </div>
      </div>

      <PhysicsStepPanel step={activeStep} stepIndex={stepIndex} totalSteps={steps.length} onStepIndexChange={setStepIndex} onFeedbackReset={() => setFeedback(null)} />
      <PhysicsInteractionPanel interaction={activeInteraction} feedback={feedback} onFeedback={setFeedback} visual={visual} />
    </div>
  );
}

function SharedScienceSvgDefs() {
  return (
    <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true" focusable="false">
      <defs>
        <marker id="pressure-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
          <path d="M2,2 L10,6 L2,10 z" fill="currentColor" />
        </marker>
        <marker id="flow-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
          <path d="M2,2 L10,6 L2,10 z" fill="#059669" />
        </marker>
        <linearGradient id="hydraulic-fluid" x1="0" x2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.45" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function renderPhysicsVisual(visual: PhysicsVisual, props: Parameters<typeof SvgDiagramRenderer>[0]) {
  const Renderer = getScientificRenderer(visual.template);
  return <Renderer {...props} visual={visual} />;
}
