'use client';

import { MathVisualBlock } from '@/components/learning/math-visual-blocks';
import { ChemistryVisualRenderer } from '@/components/learning/blocks/chemistry/ChemistryVisualRenderer';
import type { ChemistryVisual } from '@/components/learning/blocks/chemistry/types';
import { PhysicsVisualRenderer } from '@/components/learning/blocks/physics/PhysicsVisualRenderer';
import type { PhysicsVisual } from '@/components/learning/blocks/physics/types';
import type { ShortCourseQuestion } from '@/lib/api/short-courses';

type QuestionWithVisual = ShortCourseQuestion & {
  sectionTitle?: string;
};

type QuestionVisualRendererProps = {
  question: QuestionWithVisual;
  className?: string;
};

const mathVisualTypes = new Set([
  'equation',
  'formula',
  'graph',
  'table',
  'number_line',
  'matrix',
  'formula_sheet',
  'geometry',
  'venn',
]);

export function QuestionVisualRenderer({ question, className }: QuestionVisualRendererProps) {
  const chemistryVisual = resolveQuestionChemistryVisual(question);
  if (chemistryVisual) {
    return <div className={className}><ChemistryVisualRenderer visual={chemistryVisual} mode="student" /></div>;
  }

  const physicsVisual = resolveQuestionPhysicsVisual(question);
  if (physicsVisual) {
    return <div className={className}><PhysicsVisualRenderer visual={physicsVisual} mode="student" /></div>;
  }

  const mathVisual = resolveQuestionMathVisual(question);
  if (mathVisual) {
    return (
      <div className={className ?? 'rounded-2xl border bg-muted/20 p-3'}>
        <MathVisualBlock block={mathVisual} />
      </div>
    );
  }

  if (question.imageUrl) {
    return (
      <figure className={className ?? 'overflow-hidden rounded-2xl border bg-muted/20'}>
        <img src={question.imageUrl} alt={question.imageAlt || 'Question diagram'} className="h-auto w-full object-contain" />
        {question.imageCaption ? <figcaption className="border-t px-3 py-2 text-xs text-muted-foreground">{question.imageCaption}</figcaption> : null}
      </figure>
    );
  }

  return null;
}

function resolveQuestionChemistryVisual(question: QuestionWithVisual): ChemistryVisual | null {
  const candidate = question.chemistryVisual ?? question.visual ?? question.diagram;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
  const visual = candidate as Partial<ChemistryVisual> & { subject?: unknown };
  const looksLikeChemistry = visual.subject === 'chemistry'
    || visual.visualType === 'equation_balancer'
    || visual.visualType === 'chemical_equation'
    || visual.visualType === 'stoichiometry'
    || visual.visualType === 'atom_structure'
    || visual.visualType === 'lab_observation'
    || Boolean(visual.equation);
  if (!looksLikeChemistry) return null;
  return {
    id: visual.id || `question-chemistry-${question.id}`,
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

function resolveQuestionPhysicsVisual(question: QuestionWithVisual): PhysicsVisual | null {
  const candidate = question.physicsVisual ?? question.visual ?? question.diagram;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
  const visual = candidate as Partial<PhysicsVisual> & { subject?: unknown; canvas?: Partial<PhysicsVisual['canvas']> };
  const looksLikePhysics = visual.subject === 'physics'
    || visual.template === 'wave'
    || visual.template === 'free_body'
    || visual.template === 'pulley'
    || visual.template === 'collision'
    || Array.isArray(visual.objects);
  if (!looksLikePhysics) return null;
  return {
    id: visual.id || `question-physics-${question.id}`,
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

function resolveQuestionMathVisual(question: QuestionWithVisual): Record<string, unknown> | null {
  const candidate = question.visual ?? question.diagram;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
  const visual = candidate as Record<string, unknown>;
  if (visual.subject === 'physics' || visual.subject === 'chemistry') return null;
  const rawType = String(visual.type ?? visual.visualType ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!mathVisualTypes.has(rawType)) return null;
  return { ...visual, type: rawType };
}
