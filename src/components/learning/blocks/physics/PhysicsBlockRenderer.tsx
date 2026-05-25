'use client';

import { PhysicsVisualRenderer } from './PhysicsVisualRenderer';
import { clonePhysicsVisual } from './defaults';
import type { BlockRendererProps } from '../schemas';
import type { PhysicsVisual } from './types';

export function PhysicsBlockRenderer({ payload }: BlockRendererProps) {
  const visual = resolveVisual(payload);
  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-hidden break-words">
      {payload.body ? <p className="break-words text-sm leading-6 text-muted-foreground">{String(payload.body)}</p> : null}
      <div className="min-w-0 max-w-full overflow-hidden">
        <PhysicsVisualRenderer visual={visual} mode="student" />
      </div>
    </div>
  );
}

export function PhysicsBlockPreviewRenderer({ payload }: BlockRendererProps) {
  const visual = resolveVisual(payload);
  return <PhysicsVisualRenderer visual={visual} mode="preview" />;
}

function resolveVisual(payload: Record<string, unknown>): PhysicsVisual {
  const visual = payload.visual;
  if (visual && typeof visual === 'object' && !Array.isArray(visual)) {
    return normalizeVisual(visual as Partial<PhysicsVisual>);
  }

  const template = typeof payload.physicsTemplate === 'string' ? payload.physicsTemplate : typeof payload.template === 'string' ? payload.template : 'free_body';
  if (template === 'pulley') return clonePhysicsVisual('pulley');
  if (template === 'collision') return clonePhysicsVisual('collision');
  return clonePhysicsVisual('free_body');
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
    metadata: visual.metadata || {},
  } as PhysicsVisual;
}
