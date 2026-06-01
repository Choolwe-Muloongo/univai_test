import type { LearningBlockDefinition, LearningBlockPayload } from '../schemas';
import { PhysicsBlockEditor } from './PhysicsBlockEditor';
import { PhysicsBlockPreviewRenderer, PhysicsBlockRenderer, PhysicsQuestionWithDiagramRenderer } from './PhysicsBlockRenderer';
import { clonePhysicsVisual } from './defaults';
import { autoMarkHydraulicsInteraction } from './hydraulicsAssessment';

const defaultPayload: LearningBlockPayload = {
  type: 'physics_visual',
  title: 'Interactive physics visual',
  body: 'Use the diagram, steps, and checkpoint to understand the physics idea.',
  physicsCardType: 'free_body_diagram_card',
  physicsTemplate: 'free_body',
  visual: clonePhysicsVisual('free_body'),
  required: true,
};

const defaultQuestionDiagramPayload: LearningBlockPayload = {
  type: 'question_with_diagram',
  title: 'Physics diagram question',
  body: 'Use the diagram to answer the question. The diagram stays visible while you work.',
  diagram: {
    ...clonePhysicsVisual('kinematics_graph'),
    metadata: {
      title: 'Velocity-time graph: distance from area',
      graph: {
        title: 'Velocity-time graph',
        xLabel: 'time / s',
        yLabel: 'velocity / m/s',
        points: [[0, 6], [4, 6], [7, 0]],
        areaSegments: [
          { id: 'A', label: 'A', shapeType: 'rectangle', startTime: 0, endTime: 4, startValue: 6, endValue: 6, formulaText: 'A = width × height', calculationText: '4 s × 6 m/s', resultText: '24 m' },
          { id: 'B', label: 'B', shapeType: 'triangle', startTime: 4, endTime: 7, startValue: 6, endValue: 0, formulaText: 'B = 1/2 × base × height', calculationText: '1/2 × 3 s × 6 m/s', resultText: '9 m' },
        ],
        summaryText: 'Total distance = A + B = 33 m',
      },
    },
  },
  question: {
    prompt: 'Calculate the total distance travelled.',
    correctAnswer: 33,
    unit: 'm',
    tolerance: 0.1,
    explanation: 'The rectangle area is 24 m and the triangle area is 9 m. Total distance = 24 + 9 = 33 m.',
  },
  required: true,
};

export const physicsBlockDefinitions: LearningBlockDefinition[] = [
  {
    type: 'physics_visual',
    label: 'Physics Visual Engine',
    category: 'physics',
    family: 'physics-engine',
    description: 'Interactive physics diagram, graph, simulation, collision, circuit, wave, optics, hydraulics, or lab visual using the shared Physics Visual Renderer.',
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
    validate: (payload) => validatePhysicsVisualPayload(payload),
    completion: { required: true },
    certificate: { canRequire: true, defaultRequired: true, label: 'Complete physics visual interaction' },
    autoMark: (payload, answer) => {
      const hydraulicsResult = autoMarkHydraulicsInteraction(payload, answer);
      if (hydraulicsResult) return hydraulicsResult;
      return { correct: true, score: 1, feedback: 'Physics visual interaction recorded.' };
    },
    aiInstructions: 'Use type physics_visual. Put all diagram data inside visual as structured JSON: canvas, objects, arrows, labels, hotspots, steps, and interactions. Never store physics diagrams as image-only cards. Use specialist templates such as kinematics_graph, projectile, free_body, angle_vector_resolution, inclined_plane, pulley, collision, circuit, wave, electric_field, and thermodynamic_cycle.',
    difficulty: 'medium',
    bestUsedFor: ['free-body diagrams', 'pulleys', 'kinematics graphs', 'projectile motion', 'circuits', 'ray diagrams', 'waves', 'collisions', 'momentum', 'hydraulic pressure', 'pipe flow', 'hydraulic circuit reading', 'fault diagnosis', 'lab experiments'],
    autoMarked: true,
  },
  {
    type: 'question_with_diagram',
    label: 'Physics Question With Diagram',
    category: 'physics',
    family: 'physics-engine',
    description: 'A physics diagram stays visible while the student answers a numerical or multiple-choice question below it.',
    defaultPayload: defaultQuestionDiagramPayload,
    payloadSchema: {
      type: 'object',
      required: ['type', 'diagram', 'question'],
      properties: {
        type: { const: 'question_with_diagram' },
        title: { type: 'string' },
        body: { type: 'string' },
        diagram: { type: 'object' },
        question: { type: 'object' },
      },
    },
    AdminEditor: PhysicsBlockEditor,
    StudentRenderer: PhysicsQuestionWithDiagramRenderer,
    PreviewRenderer: PhysicsQuestionWithDiagramRenderer,
    validate: (payload) => {
      const issues: string[] = [];
      const diagram = payload.diagram as Record<string, unknown> | undefined;
      const question = payload.question as Record<string, unknown> | undefined;
      if (!diagram || typeof diagram !== 'object') issues.push('Diagram JSON is required.');
      if (!question || typeof question !== 'object') issues.push('Question object is required.');
      if (question && !question.prompt) issues.push('Question prompt is required.');
      if (question && typeof question.correctAnswer === 'undefined') issues.push('Question correctAnswer is required.');
      return { valid: issues.length === 0, issues };
    },
    completion: { required: true, requiresAnswer: true },
    certificate: { canRequire: true, defaultRequired: true, label: 'Answer physics diagram question' },
    autoMark: (payload, answer) => {
      const question = payload.question as Record<string, unknown> | undefined;
      const expected = question?.correctAnswer ?? payload.correctAnswer;
      const actual = String(answer ?? '').trim().toLowerCase();
      const target = String(expected ?? '').trim().toLowerCase();
      return { correct: actual === target, score: actual === target ? 1 : 0, feedback: actual === target ? 'Correct.' : 'Review the diagram and try again.' };
    },
    aiInstructions: 'Use type question_with_diagram when the student must answer while seeing a physics visual. Put the renderer data in diagram and the prompt/correctAnswer/unit/tolerance/explanation in question. Do not split the diagram and question into separate cards.',
    difficulty: 'medium',
    bestUsedFor: ['velocity-time graph questions', 'projectile questions', 'force diagram questions', 'circuit questions', 'energy diagrams', 'momentum diagrams'],
    autoMarked: true,
  },
];

function validatePhysicsVisualPayload(payload: LearningBlockPayload) {
  const issues: string[] = [];
  const visual = payload.visual as Record<string, unknown> | undefined;
  if (!visual || typeof visual !== 'object') issues.push('Physics visual JSON is required.');
  if (visual && !Array.isArray(visual.objects)) issues.push('Physics visual must include an objects array.');
  if (visual && (!visual.canvas || typeof visual.canvas !== 'object')) issues.push('Physics visual must include canvas settings.');
  return { valid: issues.length === 0, issues };
}

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
