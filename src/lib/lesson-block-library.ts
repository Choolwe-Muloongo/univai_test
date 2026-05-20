import {
  BLOCK_TEMPLATE_CATEGORIES,
  BLOCK_TEMPLATE_LIBRARY,
  COURSE_BLOCK_TEMPLATE_COUNT,
  type CourseBlockSeed,
} from './course-block-library';
import { blockDefinitions, learningBlockRegistryCount } from '@/components/learning/blocks/registry';

export type BroadCardType = string;

export type BroadMathTool = 'none' | 'equation' | 'formula' | 'graph' | 'table' | 'formula_sheet' | 'number_line' | 'matrix' | 'geometry' | 'venn';

export type LessonBlockTemplate = {
  id: string;
  category: string;
  subjectArea: string;
  teachingMove: string;
  label: string;
  help: string;
  type: BroadCardType;
  title: string;
  body?: string;
  question?: string;
  text?: string;
  statement?: string;
  prompt?: string;
  front?: string;
  back?: string;
  items?: string;
  criteria?: string;
  options?: string;
  answer?: string;
  explanation?: string;
  mathTool?: BroadMathTool;
  difficulty?: string;
  bestUsedFor?: string;
  assessmentMode?: string;
  certificateCapable?: boolean;
  equation?: string;
  expression?: string;
  xMin?: string;
  xMax?: string;
  columns?: string;
  rows?: string;
  formulas?: string;
  min?: string;
  max?: string;
  points?: string;
};

const visualTypes = new Set(['equation', 'formula', 'graph', 'table', 'number_line', 'matrix', 'formula_sheet', 'geometry', 'venn']);

const registryTemplates: LessonBlockTemplate[] = blockDefinitions.map((definition) => {
  const payload = definition.defaultPayload;
  const visualType = visualTypes.has(definition.type) ? definition.type as BroadMathTool : 'none';

  return {
    id: `registry-${definition.type}`,
    category: definition.category,
    subjectArea: definition.category.replace(/[-_]/g, ' '),
    teachingMove: definition.family,
    label: definition.label,
    help: definition.description,
    type: definition.type,
    title: typeof payload.title === 'string' ? payload.title : definition.label,
    body: typeof payload.body === 'string' ? payload.body : undefined,
    question: typeof payload.question === 'string' ? payload.question : undefined,
    prompt: typeof payload.prompt === 'string' ? payload.prompt : undefined,
    options: Array.isArray(payload.options) ? payload.options.map(String).join('\n') : typeof payload.options === 'string' ? payload.options : undefined,
    answer: stringifyAnswer(payload.correctAnswer ?? payload.answer),
    explanation: typeof payload.explanation === 'string' ? payload.explanation : undefined,
    mathTool: visualType,
    difficulty: definition.difficulty,
    bestUsedFor: definition.bestUsedFor?.join(', '),
    assessmentMode: definition.autoMarked ? 'Auto-marked' : definition.manualMarked ? 'Manual' : 'Teaching',
    certificateCapable: definition.certificate.canRequire,
  };
});

const starterTemplates: LessonBlockTemplate[] = BLOCK_TEMPLATE_LIBRARY.map((template) => {
  const block = template.block;
  const visualType = visualTypes.has(block.type) ? block.type as BroadMathTool : block.visual && typeof block.visual === 'object' ? String((block.visual as Record<string, unknown>).type || 'none') as BroadMathTool : 'none';
  const visual = visualTypes.has(block.type) ? block : block.visual as CourseBlockSeed | undefined;
  const functions = Array.isArray(visual?.functions) ? visual.functions : [];

  return {
    id: template.id,
    category: template.category,
    subjectArea: template.domainLabel,
    teachingMove: template.intent,
    label: `${template.domainLabel}: ${template.label}`,
    help: template.description,
    type: visualTypes.has(block.type) ? 'teach' : block.type,
    title: block.title || template.label,
    body: block.body || stringValue(block.description),
    question: block.question,
    text: block.text,
    statement: block.statement,
    prompt: block.prompt,
    front: block.front,
    back: block.back,
    items: stringifyList(block.items),
    criteria: stringifyList(block.criteria),
    options: Array.isArray(block.options) ? block.options.join('\n') : undefined,
    answer: stringifyAnswer(block.correctAnswer),
    explanation: block.explanation,
    mathTool: visualType,
    difficulty: template.category === 'Assessment' ? 'medium' : 'introductory',
    bestUsedFor: template.intent,
    assessmentMode: ['Assessment', 'Practice'].includes(template.category) ? 'Auto-marked capable' : 'Teaching',
    certificateCapable: ['Assessment', 'Project'].includes(template.category),
    equation: typeof visual?.equation === 'string' ? visual.equation : undefined,
    expression: functions.length ? String((functions[0] as Record<string, unknown> | undefined)?.expression ?? '') : undefined,
    xMin: numberString(visual?.xMin),
    xMax: numberString(visual?.xMax),
    columns: Array.isArray(visual?.columns) ? visual.columns.map(String).join(', ') : undefined,
    rows: rowsString(visual?.rows),
    formulas: formulasString(visual?.formulas),
    min: numberString(visual?.min),
    max: numberString(visual?.max),
    points: pointsString(visual?.points),
  };
});

export const LESSON_BLOCK_TEMPLATES: LessonBlockTemplate[] = [...registryTemplates, ...starterTemplates];

export const LESSON_BLOCK_TEMPLATE_COUNT = COURSE_BLOCK_TEMPLATE_COUNT + learningBlockRegistryCount;

export const LESSON_BLOCK_CATEGORIES = ['All', ...Array.from(new Set([...blockDefinitions.map((definition) => definition.category), ...BLOCK_TEMPLATE_CATEGORIES]))];

function stringifyAnswer(value: unknown) {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return undefined;
}

function stringifyList(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item) => {
      if (typeof item === 'string' || typeof item === 'number') return String(item);
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        return String(record.title ?? record.label ?? record.name ?? record.text ?? record.description ?? record.explanation ?? '');
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

function numberString(value: unknown) {
  return typeof value === 'number' || typeof value === 'string' ? String(value) : undefined;
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function rowsString(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value.map((row) => Array.isArray(row) ? row.join(', ') : String(row)).join('\n');
}

function formulasString(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((formula) => {
      if (!formula || typeof formula !== 'object') return '';
      const record = formula as Record<string, unknown>;
      return [record.name, record.formula, record.description].filter(Boolean).join(' | ');
    })
    .filter(Boolean)
    .join('\n');
}

function pointsString(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((point) => {
      if (typeof point === 'number' || typeof point === 'string') return String(point);
      if (point && typeof point === 'object') return String((point as Record<string, unknown>).value ?? '');
      return '';
    })
    .filter(Boolean)
    .join(', ');
}
