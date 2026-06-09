import { accountingBlockDefinitions } from './accounting';
import { aiDataBlockDefinitions } from './ai-data';
import { businessBlockDefinitions } from './business';
import { certificateBlockDefinitions } from './certificate';
import { chemistryBlockDefinitions } from './chemistry';
import { codingBlockDefinitions } from './coding';
import { cybersecurityBlockDefinitions } from './cybersecurity';
import { dragDropBlockDefinitions } from './drag-drop';
import { gamificationBlockDefinitions } from './gamification';
import { graphingBlockDefinitions } from './graphing';
import { mathBlockDefinitions } from './math';
import { mediaBlockDefinitions } from './media';
import { physicsBlockDefinitions } from './physics';
import { projectBlockDefinitions } from './projects';
import { questionBlockDefinitions } from './questions';
import { scienceBlockDefinitions } from './science';
import { simulationBlockDefinitions } from './simulations';
import { spreadsheetBlockDefinitions } from './spreadsheet';
import { teachingBlockDefinitions } from './teaching';
import { vocationalBlockDefinitions } from './vocational';
import { webBlockDefinitions } from './web';
import { writingBlockDefinitions } from './writing';
import type { LearningBlockCategory, LearningBlockDefinition, LearningBlockPayload } from './schemas';

const rawDefinitions = [
  ...teachingBlockDefinitions,
  ...questionBlockDefinitions,
  ...mathBlockDefinitions,
  ...graphingBlockDefinitions,
  ...accountingBlockDefinitions,
  ...spreadsheetBlockDefinitions,
  ...codingBlockDefinitions,
  ...webBlockDefinitions,
  ...businessBlockDefinitions,
  ...scienceBlockDefinitions,
  ...chemistryBlockDefinitions,
  ...physicsBlockDefinitions,
  ...cybersecurityBlockDefinitions,
  ...aiDataBlockDefinitions,
  ...mediaBlockDefinitions,
  ...dragDropBlockDefinitions,
  ...projectBlockDefinitions,
  ...gamificationBlockDefinitions,
  ...certificateBlockDefinitions,
  ...simulationBlockDefinitions,
  ...writingBlockDefinitions,
  ...vocationalBlockDefinitions,
];

export const blockDefinitions: LearningBlockDefinition[] = uniqueByType(rawDefinitions);

export const blockRegistry = new Map<string, LearningBlockDefinition>(
  blockDefinitions.map((definition) => [definition.type, definition]),
);

export const registeredBlockTypes = blockDefinitions.map((definition) => definition.type);
export const registeredBlockTypeSet = new Set(registeredBlockTypes);
export const learningBlockRegistryCount = registeredBlockTypes.length;

export const blockCategories = Array.from(new Set(blockDefinitions.map((definition) => definition.category))).sort();

export function getBlockDefinition(type?: string | null) {
  if (!type) return undefined;
  return blockRegistry.get(normalizeBlockType(type));
}

export function createDefaultBlock(type: string, patch: Partial<LearningBlockPayload> = {}): LearningBlockPayload {
  const definition = getBlockDefinition(type);
  if (!definition) {
    return {
      type: normalizeBlockType(type),
      title: titleCase(type),
      body: 'Add learner-facing content for this block.',
      ...patch,
    };
  }
  return { ...definition.defaultPayload, ...patch, type: definition.type };
}

export function validateLearningBlock(payload: LearningBlockPayload) {
  const definition = getBlockDefinition(payload.type);
  if (!definition) {
    return {
      valid: true,
      issues: payload.type ? [] : ['Block type is required.'],
    };
  }
  return definition.validate(payload);
}

export function validateLearningBlocks(blocks: LearningBlockPayload[]) {
  return blocks.map((block, index) => ({ index, type: block.type, ...validateLearningBlock(block) }));
}

export function blocksByCategory(category?: LearningBlockCategory | 'All') {
  if (!category || category === 'All') return blockDefinitions;
  return blockDefinitions.filter((definition) => definition.category === category);
}

export function searchBlocks(query: string, category?: LearningBlockCategory | 'All') {
  const needle = query.trim().toLowerCase();
  return blocksByCategory(category).filter((definition) => {
    if (!needle) return true;
    return `${definition.type} ${definition.label} ${definition.category} ${definition.family} ${definition.description} ${definition.bestUsedFor?.join(' ') ?? ''}`
      .toLowerCase()
      .includes(needle);
  });
}

export function recommendedBlocksForCourseType(courseType?: string | null) {
  const normalized = (courseType ?? '').toLowerCase();
  const categories: LearningBlockCategory[] = [];
  if (normalized.includes('programming') || normalized.includes('coding')) categories.push('coding');
  if (normalized.includes('web')) categories.push('web', 'coding');
  if (normalized.includes('accounting') || normalized.includes('finance')) categories.push('accounting', 'spreadsheet', 'business');
  if (normalized.includes('chemistry')) categories.push('science', 'simulations');
  if (normalized.includes('physics')) categories.push('physics', 'science', 'simulations', 'graphing');
  if (normalized.includes('math') || normalized.includes('science')) categories.push('classroom_board', 'math', 'graphing', 'science', 'physics');
  if (normalized.includes('business') || normalized.includes('entrepreneur')) categories.push('business', 'spreadsheet');
  if (normalized.includes('exam')) categories.push('questions', 'certificate');
  if (normalized.includes('project')) categories.push('projects', 'certificate');
  if (normalized.includes('vocational') || normalized.includes('practical')) categories.push('vocational', 'simulations');

  const selected = categories.length ? blockDefinitions.filter((definition) => categories.includes(definition.category)) : blockDefinitions;
  return selected.slice(0, 36);
}

export function normalizeBlockType(type: string) {
  const normalized = type.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized === 'teach' || normalized === 'content' || normalized === 'read') return 'explanation';
  if ([
    'multiple_choice',
    'mcq',
    'checkpoint',
    'quiz',
    'quick_check',
    'auto_marked_question',
    'lesson_checkpoint',
    'exam_review_block',
    'symbol_matching',
    'visual_question',
    'graph_question',
    'graph_interpretation_question',
    'geometry_question',
    'table_question',
    'number_line_question',
    'interval_question',
  ].includes(normalized)) return 'question';
  if ([
    'fill_in_the_blank',
    'typed_answer',
    'short_answer_check',
    'missing_step_check',
  ].includes(normalized)) return 'fill_blank';
  if (normalized === 'truefalse' || normalized === 'true_or_false') return 'true_false';
  if (normalized === 'physics_card' || normalized === 'physics_diagram' || normalized === 'physics_simulation') return 'physics_visual';
  if ([
    'chemistry_card',
    'chemistry_diagram',
    'chemistry_simulation',
    'chemical_equation_balancer',
    'periodic_table_activity',
    'molecule_builder',
    'atom_structure_activity',
    'reaction_type_activity',
  ].includes(normalized)) return 'chemistry_visual';
  if (normalized === 'chart' || normalized === 'plot') return 'graph';
  if (normalized === 'mini_project') return 'code_mini_project';
  if (normalized === 'accounting_studio') return 'accounting_exam_question';
  return normalized || 'explanation';
}

function uniqueByType(definitions: LearningBlockDefinition[]) {
  const seen = new Set<string>();
  const result: LearningBlockDefinition[] = [];
  definitions.forEach((definition) => {
    if (seen.has(definition.type)) return;
    seen.add(definition.type);
    result.push(definition);
  });
  return result;
}

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export type {
  BlockEditorProps,
  BlockRendererProps,
  BlockRuntimeState,
  BlockValidationResult,
  LearningBlockDefinition,
  LearningBlockPayload,
} from './schemas';
