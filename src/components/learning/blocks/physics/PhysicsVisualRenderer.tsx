'use client';

import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PhysicsVisual } from './types';
import { CircuitPhysicsRenderer } from './renderers/CircuitPhysicsRenderer';
import { CollisionSimulationRenderer } from './renderers/CollisionSimulationRenderer';
import { GraphPhysicsRenderer } from './renderers/GraphPhysicsRenderer';
import { OpticsPhysicsRenderer } from './renderers/OpticsPhysicsRenderer';
import { PhysicsInteractionPanel } from './renderers/PhysicsInteractionPanel';
import { PhysicsStepPanel } from './renderers/PhysicsStepPanel';
import { SvgDiagramRenderer } from './renderers/SvgDiagramRenderer';
import { WavePhysicsRenderer } from './renderers/WavePhysicsRenderer';
import { evaluatePhysicsInteraction, type PhysicsFeedbackState } from './renderers/physicsRuntime';

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

  const rendererProps = { visual, highlightedIds, hiddenIds, selectedTargetId, onSelect: handleTarget };

  return (
    <div className="space-y-4 rounded-3xl border bg-background p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Physics visual engine</p>
          <p className="text-sm text-muted-foreground">{visual.template.replace(/_/g, ' ')} · {visual.visualType}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === 'builder' ? <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Builder preview</span> : null}
          <Button type="button" variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="mr-2 size-4" /> Reset
          </Button>
        </div>
      </div>

      {renderPhysicsVisual(visual, rendererProps)}

      <PhysicsStepPanel step={activeStep} stepIndex={stepIndex} totalSteps={steps.length} onStepIndexChange={setStepIndex} onFeedbackReset={() => setFeedback(null)} />
      <PhysicsInteractionPanel interaction={activeInteraction} feedback={feedback} onFeedback={setFeedback} />
    </div>
  );
}

function renderPhysicsVisual(visual: PhysicsVisual, props: Parameters<typeof SvgDiagramRenderer>[0]) {
  switch (visual.template) {
    case 'collision':
      return <CollisionSimulationRenderer visual={visual} />;
    case 'kinematics_graph':
      return <GraphPhysicsRenderer {...props} />;
    case 'circuit':
      return <CircuitPhysicsRenderer {...props} />;
    case 'ray_diagram':
      return <OpticsPhysicsRenderer {...props} />;
    case 'wave':
      return <WavePhysicsRenderer {...props} />;
    default:
      return <SvgDiagramRenderer {...props} />;
  }
}
