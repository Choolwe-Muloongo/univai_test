import { createElement } from 'react';

import { CodeCardPlayer } from '@/components/learning/code-card-player';
import type { CodeCardBlock, CodeCardFile, CodeCardTest } from '@/lib/api/course-builder-types';

import { blockSpecs, createBlockDefinitions } from '../shared/factory';
import { GenericBlockAdminEditor } from '../shared/generic-components';
import type { BlockRendererProps, LearningBlockDefinition, LearningBlockPayload } from '../schemas';

const codingTypes = [
  'code_snippet', 'code_activity', 'code_output_prediction', 'fix_the_bug',
  'fill_missing_code', 'complete_function', 'complete_class', 'complete_loop',
  'complete_condition', 'reorder_code', 'code_multiple_choice', 'code_trace',
  'code_review', 'unit_test_activity', 'function_test',
  'input_output_test', 'algorithm_challenge', 'pseudocode_activity', 'flowchart_to_code',
  'code_to_flowchart', 'terminal_command_activity', 'regex_activity', 'json_editor',
  'yaml_editor', 'markdown_editor', 'api_request_builder', 'sql_query_activity',
  'database_table_activity', 'database_schema_builder', 'crud_activity',
  'auth_logic_activity', 'error_message_interpretation', 'refactor_code',
  'optimize_code', 'security_code_review', 'code_explanation_step', 'code_trace_step',
  'output_prediction_step', 'bug_fix_step', 'test_case_step', 'code_reveal_step',
];

const firstClassCodingTypes: CodeCardBlock['type'][] = [
  'code_playground',
  'debug_code',
  'complete_code',
  'predict_output',
  'code_explanation',
  'mini_project',
];

const genericCodingDefinitions = createBlockDefinitions(
  blockSpecs('coding', 'coding', codingTypes, 'Programming lab block'),
);

const firstClassCodingDefinitions: LearningBlockDefinition[] = firstClassCodingTypes.map((type) => ({
  type,
  label: titleCase(type),
  category: 'coding',
  family: 'coding',
  description: `First-class coding card: ${titleCase(type)}.`,
  defaultPayload: defaultCodePayload(type),
  payloadSchema: {
    type: 'object',
    required: ['type', 'title', 'instructions', 'language', 'files'],
    properties: {
      type: { const: type },
      title: { type: 'string' },
      instructions: { type: 'string' },
      language: { type: 'string' },
      files: { type: 'array' },
      tests: { type: 'array' },
      hints: { type: 'array' },
      solutionFiles: { type: 'array' },
      expectedOutput: { type: 'string' },
      previewMode: { type: 'string' },
      aiHelpEnabled: { type: 'boolean' },
    },
    additionalProperties: true,
  },
  AdminEditor: GenericBlockAdminEditor,
  StudentRenderer: FirstClassCodeStudentRenderer,
  PreviewRenderer: FirstClassCodeStudentRenderer,
  validate: validateCodePayload,
  completion: { required: false, requiresAnswer: false, manualReview: true },
  certificate: { canRequire: true, defaultRequired: false, label: 'Coding lab completion' },
  feedback: (payload) => typeof payload.explanation === 'string' ? payload.explanation : null,
  aiInstructions: 'Generate a complete coding card with language, instructions, files, tests, hints, solution files, expected output when useful, preview mode, and AI help enabled.',
  difficulty: 'medium',
  bestUsedFor: ['Coding playground', 'Debugging', 'Complete-the-code practice', 'Mini project work'],
  autoMarked: false,
  manualMarked: true,
}));

export const codingBlockDefinitions = [
  ...firstClassCodingDefinitions,
  ...genericCodingDefinitions,
];

function FirstClassCodeStudentRenderer({ payload }: BlockRendererProps) {
  return createElement(CodeCardPlayer, { block: normalizeCodePayload(payload) });
}

function defaultCodePayload(type: CodeCardBlock['type']): LearningBlockPayload {
  return {
    type,
    title: titleCase(type),
    instructions: 'Complete the coding task below.',
    language: 'html',
    files: [
      {
        name: 'index.html',
        content: '<!DOCTYPE html>\n<html>\n<body>\n\n</body>\n</html>',
      },
    ],
    tests: [],
    hints: ['Read the instructions carefully before coding.'],
    solutionFiles: [],
    expectedOutput: '',
    previewMode: 'html',
    aiHelpEnabled: true,
  };
}

function normalizeCodePayload(payload: LearningBlockPayload): CodeCardBlock {
  const language = typeof payload.language === 'string' ? payload.language : 'javascript';
  const fallbackFile = language === 'html' ? 'index.html' : language === 'python' ? 'main.py' : language === 'php' ? 'index.php' : 'main.js';
  const type = firstClassCodingTypes.includes(payload.type as CodeCardBlock['type'])
    ? payload.type as CodeCardBlock['type']
    : 'code_playground';

  return {
    type,
    title: typeof payload.title === 'string' ? payload.title : 'Coding practice',
    instructions: typeof payload.instructions === 'string' ? payload.instructions : String(payload.prompt ?? payload.body ?? 'Complete the coding task.'),
    language,
    files: toCodeFiles(payload.files, [{ name: fallbackFile, content: typeof payload.code === 'string' ? payload.code : '' }]),
    tests: toCodeTests(payload.tests),
    hints: toStringArray(payload.hints),
    solutionFiles: toCodeFiles(payload.solutionFiles, []),
    expectedOutput: typeof payload.expectedOutput === 'string' ? payload.expectedOutput : '',
    previewMode: isPreviewMode(payload.previewMode) ? payload.previewMode : language === 'html' ? 'html' : 'console',
    aiHelpEnabled: typeof payload.aiHelpEnabled === 'boolean' ? payload.aiHelpEnabled : true,
    explanation: typeof payload.explanation === 'string' ? payload.explanation : undefined,
    sourceChunkIds: toStringArray(payload.sourceChunkIds),
    sourceExcerpt: typeof payload.sourceExcerpt === 'string' ? payload.sourceExcerpt : undefined,
  };
}

function validateCodePayload(payload: LearningBlockPayload) {
  const issues: string[] = [];
  if (!payload.title) issues.push('Coding card needs a title.');
  if (typeof payload.instructions !== 'string' && typeof payload.body !== 'string' && typeof payload.prompt !== 'string') issues.push('Coding card needs learner instructions.');
  if (typeof payload.language !== 'string') issues.push('Coding card needs a language.');
  if (!Array.isArray(payload.files) || !payload.files.length) issues.push('Coding card needs at least one editable file.');
  if (payload.certificateRequired === true && (!Array.isArray(payload.tests) || !payload.tests.length)) {
    issues.push('Certificate-required coding cards need at least one visual/structure check.');
  }
  return { valid: issues.length === 0, issues };
}

function toCodeFiles(value: unknown, fallback: CodeCardFile[]): CodeCardFile[] {
  if (!Array.isArray(value)) return fallback;
  const files = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      if (typeof record.name !== 'string') return null;
      return {
        name: record.name,
        content: typeof record.content === 'string' ? record.content : '',
        readonly: typeof record.readonly === 'boolean' ? record.readonly : undefined,
      } satisfies CodeCardFile;
    })
    .filter(Boolean) as CodeCardFile[];
  return files.length ? files : fallback;
}

function toCodeTests(value: unknown): CodeCardTest[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const type = typeof record.type === 'string' ? record.type : 'contains';
      if (!['contains', 'not_contains', 'equals', 'regex', 'stdout_contains', 'unit', 'custom'].includes(type)) return null;
      return {
        type: type as CodeCardTest['type'],
        file: typeof record.file === 'string' ? record.file : undefined,
        value: typeof record.value === 'string' ? record.value : undefined,
        command: typeof record.command === 'string' ? record.command : undefined,
        description: typeof record.description === 'string' ? record.description : undefined,
      } satisfies CodeCardTest;
    })
    .filter(Boolean) as CodeCardTest[];
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function isPreviewMode(value: unknown): value is CodeCardBlock['previewMode'] {
  return value === 'html' || value === 'console' || value === 'terminal' || value === 'none';
}

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
