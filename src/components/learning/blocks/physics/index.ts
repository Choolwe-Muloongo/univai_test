import type { LearningBlockDefinition, LearningBlockPayload } from '../schemas';
import { PhysicsBlockEditor } from './PhysicsBlockEditor';
import { PhysicsBlockPreviewRenderer, PhysicsBlockRenderer } from './PhysicsBlockRenderer';
import { clonePhysicsVisual } from './defaults';

const defaultPayload: LearningBlockPayload = {
  type: 'physics_visual',
  title: 'Interactive physics visual',
  body: 'Use the diagram, steps, and checkpoint to understand the physics idea.',
  physicsCardType: 'free_body_diagram_card',
  physicsTemplate: 'free_body',
  visual: clonePhysicsVisual('free_body'),
  required: true,
};

export const physicsBlockDefinitions: LearningBlockDefinition[] = [
  {
    type: 'physics_visual',
    label: 'Physics Visual Engine',
    category: 'physics',
    family: 'physics-engine',
    description: 'Interactive physics diagram, graph, simulation, collision, circuit, wave, optics, or lab visual using the shared Physics Visual Renderer.',
    defaultPayload,
    payloadSchema: {
      type: 'object',
      required: ['type', 'visual'],
      properties: {
        type: { const: 'physics_visual' },
        title: { type: 'string' },
        body: { type: 'string' },
        physicsCardType: { type: 'string' },
        physicsTemplate: { type: 'string' },
        visual: { type: 'object' },
      },
    },
    AdminEditor: PhysicsBlockEditor,
    StudentRenderer: PhysicsBlockRenderer,
    PreviewRenderer: PhysicsBlockPreviewRenderer,
    validate: (payload) => {
      const issues: string[] = [];
      const visual = payload.visual as Record<string, unknown> | undefined;
      if (!visual || typeof visual !== 'object') issues.push('Physics visual JSON is required.');
      if (visual && !Array.isArray(visual.objects)) issues.push('Physics visual must include an objects array.');
      if (visual && (!visual.canvas || typeof visual.canvas !== 'object')) issues.push('Physics visual must include canvas settings.');
      return { valid: issues.length === 0, issues };
    },
    completion: { required: true },
    certificate: { canRequire: true, defaultRequired: true, label: 'Complete physics visual interaction' },
    aiInstructions: 'Use type physics_visual. Put all diagram data inside visual as structured JSON: canvas, objects, arrows, labels, hotspots, steps, and interactions. Never store physics diagrams as image-only cards.',
    difficulty: 'medium',
    bestUsedFor: [
      'free-body diagrams',
      'pulleys',
      'kinematics graphs',
      'projectile motion',
      'circuits',
      'ray diagrams',
      'waves',
      'collisions',
      'momentum',
      'lab experiments',
    ],
    autoMarked: true,
  },
];

export type {
  PhysicsArrow,
  PhysicsCardType,
  PhysicsHotspot,
  PhysicsInteraction,
  PhysicsLabel,
  PhysicsObject,
  PhysicsTeachingStep,
  PhysicsTemplate,
  PhysicsVisual,
  PhysicsVisualType,
} from './types';
