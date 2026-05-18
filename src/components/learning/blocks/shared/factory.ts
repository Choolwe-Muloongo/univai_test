import {
  BoardBlockStudentRenderer,
  GenericBlockAdminEditor,
  GenericBlockPreviewRenderer,
  GenericBlockStudentRenderer,
} from './generic-components';
import type {
  BlockTypeSpec,
  LearningBlockDefinition,
  LearningBlockPayload,
  LearningBlockCategory,
} from '../schemas';

const questionSignals = ['question', 'quiz', 'test', 'exam', 'assessment', 'prediction', 'debug', 'fix', 'fill', 'match', 'sort', 'label', 'review', 'checker'];
const certificateSignals = ['certificate', 'exam', 'project', 'required', 'checkpoint', 'gate', 'completion'];
const manualSignals = ['rubric', 'teacher_marked', 'peer_review', 'oral', 'project', 'portfolio', 'essay', 'reflection'];

export function createBlockDefinitions(specs: BlockTypeSpec[]): LearningBlockDefinition[] {
  return specs.map(createBlockDefinition);
}

export function createBlockDefinition(spec: BlockTypeSpec): LearningBlockDefinition {
  const label = spec.label ?? titleCase(spec.type);
  const requiresAnswer = spec.completion?.requiresAnswer ?? questionSignals.some((signal) => spec.type.includes(signal));
  const manualMarked = spec.manualMarked ?? manualSignals.some((signal) => spec.type.includes(signal));
  const canRequireCertificate = spec.certificate?.canRequire ?? (certificateSignals.some((signal) => spec.type.includes(signal)) || manualMarked);
  const renderer = spec.category === 'classroom_board' ? BoardBlockStudentRenderer : GenericBlockStudentRenderer;

  return {
    type: spec.type,
    label,
    category: spec.category,
    family: spec.family,
    description: spec.description ?? defaultDescription(spec.category, label),
    defaultPayload: {
      type: spec.type,
      title: label,
      body: defaultBody(spec.category, label),
      prompt: requiresAnswer ? `Respond to this ${label.toLowerCase()} prompt.` : undefined,
      options: requiresAnswer ? ['I understand', 'I need help'] : undefined,
      correctAnswer: requiresAnswer ? 'I understand' : undefined,
      explanation: requiresAnswer ? 'Review the teaching step before answering.' : undefined,
      ...spec.defaultPayload,
    },
    payloadSchema: payloadSchemaFor(spec.type, spec.category, requiresAnswer),
    AdminEditor: GenericBlockAdminEditor,
    StudentRenderer: renderer,
    PreviewRenderer: GenericBlockPreviewRenderer,
    validate: (payload) => validateGenericPayload(payload, label, requiresAnswer),
    completion: {
      required: spec.completion?.required ?? false,
      requiresAnswer,
      requiresReveal: spec.completion?.requiresReveal ?? spec.type.includes('reveal'),
      manualReview: spec.completion?.manualReview ?? manualMarked,
    },
    certificate: {
      canRequire: canRequireCertificate,
      defaultRequired: spec.certificate?.defaultRequired ?? false,
      label: spec.certificate?.label,
    },
    autoMark: spec.autoMarked || (requiresAnswer && !manualMarked) ? autoMarkExact : undefined,
    feedback: (payload) => stringValue(payload.explanation) || null,
    aiInstructions: spec.aiInstructions ?? aiInstructionsFor(spec.category, label),
    difficulty: spec.difficulty ?? 'medium',
    bestUsedFor: spec.bestUsedFor ?? bestUsesFor(spec.category),
    autoMarked: spec.autoMarked ?? (requiresAnswer && !manualMarked),
    manualMarked,
  };
}

export function blockSpecs(category: LearningBlockCategory, family: string, types: string[], descriptionPrefix: string): BlockTypeSpec[] {
  return types.map((type) => ({
    type,
    category,
    family,
    description: `${descriptionPrefix}: ${titleCase(type)}.`,
  }));
}

function payloadSchemaFor(type: string, category: LearningBlockCategory, requiresAnswer: boolean) {
  return {
    type: 'object',
    required: ['type'],
    properties: {
      type: { const: type },
      title: { type: 'string' },
      body: { type: 'string' },
      prompt: { type: 'string' },
      question: { type: 'string' },
      options: { type: ['array', 'string'] },
      correctAnswer: { type: ['string', 'number', 'boolean'] },
      explanation: { type: 'string' },
      visual: { type: 'object' },
      required: { type: 'boolean' },
      certificateRequired: { type: 'boolean' },
    },
    metadata: { category, requiresAnswer },
    additionalProperties: true,
  };
}

function validateGenericPayload(payload: LearningBlockPayload, label: string, requiresAnswer: boolean) {
  const issues: string[] = [];
  if (!payload || typeof payload !== 'object') issues.push(`${label} payload must be an object.`);
  if (payload.type && typeof payload.type !== 'string') issues.push('Block type must be a string.');
  if (!stringValue(payload.title) && !stringValue(payload.body) && !stringValue(payload.prompt) && !stringValue(payload.question)) {
    issues.push(`${label} needs a title, explanation, prompt, or question.`);
  }
  if (requiresAnswer && !stringValue(payload.question ?? payload.prompt ?? payload.body)) {
    issues.push(`${label} needs a learner-facing question or prompt.`);
  }
  return { valid: issues.length === 0, issues };
}

function autoMarkExact(payload: LearningBlockPayload, answer: unknown) {
  const expected = normalizeAnswer(payload.correctAnswer ?? payload.answer);
  const actual = normalizeAnswer(answer);
  const correct = expected !== '' && expected === actual;
  return {
    correct,
    score: correct ? 1 : 0,
    feedback: stringValue(payload.explanation) || (correct ? 'Correct.' : 'Review the previous step and try again.'),
  };
}

function aiInstructionsFor(category: LearningBlockCategory, label: string) {
  return `Generate an editable ${label} block for the ${category} family. Keep the content concrete, classroom-friendly, and suitable for a human instructor to review before publishing.`;
}

function bestUsesFor(category: LearningBlockCategory) {
  switch (category) {
    case 'classroom_board':
      return ['Step-by-step teaching', 'Worked examples', 'Revealing reasoning gradually'];
    case 'questions':
      return ['Practice', 'Checkpoint assessment', 'Exam readiness'];
    case 'coding':
    case 'web':
      return ['Coding lab', 'Debugging', 'Mini project work'];
    case 'accounting':
    case 'spreadsheet':
      return ['Workbook activities', 'Calculations', 'Professional practice'];
    case 'projects':
      return ['Portfolio evidence', 'Certificate requirements', 'Capstone work'];
    default:
      return ['Teaching', 'Practice', 'Review'];
  }
}

function defaultDescription(category: LearningBlockCategory, label: string) {
  return `${label} block for ${category.replace('-', ' ')} learning.`;
}

function defaultBody(category: LearningBlockCategory, label: string) {
  if (category === 'classroom_board') return `Use this board step to teach ${label.toLowerCase()} one idea at a time.`;
  return `Add learner-facing content for ${label.toLowerCase()}.`;
}

function normalizeAnswer(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function stringValue(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
}

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
