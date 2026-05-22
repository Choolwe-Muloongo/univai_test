'use client';

import type { BlockRendererProps } from '../schemas';
import { ChemistryVisualRenderer } from './ChemistryVisualRenderer';
import { cloneChemistryVisual } from './defaults';
import type { ChemistryVisual } from './types';

export function ChemistryBlockRenderer({ payload }: BlockRendererProps) {
  const visual = resolveVisual(payload);

  return (
    <div className="space-y-4">
      {payload.body ? <p className="text-sm leading-6 text-muted-foreground">{String(payload.body)}</p> : null}
      <ChemistryVisualRenderer visual={visual} mode="student" />
    </div>
  );
}

export function ChemistryBlockPreviewRenderer({ payload }: BlockRendererProps) {
  const visual = resolveVisual(payload);
  return <ChemistryVisualRenderer visual={visual} mode="preview" />;
}

function resolveVisual(payload: Record<string, unknown>): ChemistryVisual {
  const visual = payload.visual;

  if (visual && typeof visual === 'object' && !Array.isArray(visual)) {
    return normalizeVisual(visual as Partial<ChemistryVisual>);
  }

  const template = typeof payload.chemistryTemplate === 'string'
    ? payload.chemistryTemplate
    : typeof payload.template === 'string'
      ? payload.template
      : 'equation_balancer';

  return cloneChemistryVisual(template);
}

function normalizeVisual(visual: Partial<ChemistryVisual>): ChemistryVisual {
  return {
    id: visual.id || 'chemistry-visual-json',
    subject: 'chemistry',
    level: visual.level,
    visualType: visual.visualType || 'chemical_equation',
    template: visual.template || 'custom',
    title: visual.title,
    body: visual.body,
    equation: visual.equation,
    species: Array.isArray(visual.species) ? visual.species : [],
    particles: Array.isArray(visual.particles) ? visual.particles : [],
    steps: Array.isArray(visual.steps) ? visual.steps : [],
    tables: Array.isArray(visual.tables) ? visual.tables : [],
    interactions: Array.isArray(visual.interactions) ? visual.interactions : [],
    metadata: visual.metadata || {},
  };
}
