import type { LearningBlockDefinition, LearningBlockPayload } from '../schemas';
import { ChemistryBlockEditor } from './ChemistryBlockEditor';
import { ChemistryBlockPreviewRenderer, ChemistryBlockRenderer } from './ChemistryBlockRenderer';
import { cloneChemistryVisual } from './defaults';

const defaultPayload: LearningBlockPayload = {
  type: 'chemistry_visual',
  title: 'Interactive chemistry activity',
  body: 'Use the equation, steps, particles, and checkpoint to understand the chemistry idea.',
  chemistryCardType: 'equation_balancer_card',
  chemistryTemplate: 'equation_balancer',
  visual: cloneChemistryVisual('equation_balancer'),
  required: true,
};

export const chemistryBlockDefinitions: LearningBlockDefinition[] = [
  {
    type: 'chemistry_visual',
    label: 'Chemistry Visual Engine',
    category: 'science',
    family: 'chemistry-engine',
    description: 'Interactive chemistry equation, molecule, periodic table, atom structure, reaction, stoichiometry, titration, pH, organic, or lab activity.',
    defaultPayload,
    payloadSchema: {
      type: 'object',
      required: ['type', 'visual'],
      properties: {
        type: { const: 'chemistry_visual' },
        title: { type: 'string' },
        body: { type: 'string' },
        chemistryCardType: { type: 'string' },
        chemistryTemplate: { type: 'string' },
        visual: { type: 'object' },
      },
    },
    AdminEditor: ChemistryBlockEditor,
    StudentRenderer: ChemistryBlockRenderer,
    PreviewRenderer: ChemistryBlockPreviewRenderer,
    validate: (payload) => {
      const issues: string[] = [];
      const visual = payload.visual as Record<string, unknown> | undefined;
      if (!visual || typeof visual !== 'object') issues.push('Chemistry visual JSON is required.');
      if (visual && visual.subject !== 'chemistry') issues.push('Chemistry visual subject must be chemistry.');
      if (visual && !visual.visualType) issues.push('Chemistry visual must include visualType.');
      return { valid: issues.length === 0, issues };
    },
    completion: { required: true },
    certificate: { canRequire: true, defaultRequired: true, label: 'Complete chemistry interaction' },
    aiInstructions: 'Use type chemistry_visual. Put equations, species, particles, tables, steps, and interactions inside visual as structured JSON. Never store chemistry activities as image-only cards.',
    difficulty: 'medium',
    bestUsedFor: [
      'chemical equations',
      'equation balancing',
      'molecule building',
      'periodic table activities',
      'atom structure',
      'electron configuration',
      'stoichiometry',
      'reaction types',
      'acid-base calculations',
      'titration',
      'organic chemistry',
      'redox',
      'equilibrium',
      'lab observations',
    ],
    autoMarked: true,
  },
];

export type {
  ChemistryEquation,
  ChemistryInteraction,
  ChemistryParticle,
  ChemistrySpecies,
  ChemistryTable,
  ChemistryTeachingStep,
  ChemistryVisual,
  ChemistryVisualType,
} from './types';
