import { createElement } from 'react';

import { CodeCardPlayer } from '@/components/learning/code-card-player';

import { blockSpecs, createBlockDefinitions } from '../shared/factory';
import { GenericBlockAdminEditor, GenericBlockPreviewRenderer } from '../shared/generic-components';
import type { BlockRendererProps, LearningBlockDefinition, LearningBlockPayload } from '../schemas';

const codingTypes = [
  'code_snippet', 'code_activity', 'code_output_prediction', 'debug_code', 'fix_the_bug',
  'fill_missing_code', 'complete_function', 'complete_class', 'complete_loop',
  'complete_condition', 'reorder_code', 'code_multiple_choice', 'code_trace',
  'code_explanation', 'code_review', 'unit_test_activity', 'function_test',
  'input_output_test', 'algorithm_challenge', 'pseudocode_activity', 'flowchart_to_code',
  'code_to_flowchart', 'terminal_command_activity', 'regex_activity', 'json_editor',
  'yaml_editor', 'markdown_editor', 'api_request_builder', 'sql_query_activity',
  'database_table_activity', 'database_schema_builder', 'crud_activity',
  'auth_logic_activity', 'error_message_interpretation', 'refactor_code',
  'optimize_code', 'security_code_review', 'code_explanation_step', 'code_trace_step',
  'output_prediction_step', 'bug_fix_step', 'test_case_step', 'code_reveal_step',
];

const firstClassCodingTypes = [
  'code_playground',
  'complete_code',
  'predict_output',
  'code_mini_project',
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

function defaultCodePayload(type: string): LearningBlockPayload {
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

function normalizeCodePayload(payload: LearningBlockPayload) {
  const language = typeof payload.language === 'string' ? payload.language : 'javascript';
  const fallbackFile = language === 'html' ? 'index.html' : language === 'python' ? 'main.py' : language === 'php' ? 'index.php' : 'main.js';
  return {
    ...payload,
    type: String(payload.type || 'code_playground') as never,
    title: typeof payload.title === 'string' ? payload.title : 'Coding practice',
    instructions: typeof payload.instructions === 'string' ? payload.instructions : String(payload.prompt ?? payload.body ?? 'Complete the coding task.'),
    language,
    files: Array.isArray(payload.files) && payload.files.length ? payload.files as never : [{ name: fallbackFile, content: typeof payload.code === 'string' ? payload.code : '' }],
    tests: Array.isArray(payload.tests) ? payload.tests as never : [],
    hints: Array.isArray(payload.hints) ? payload.hints as string[] : [],
    solutionFiles: Array.isArray(payload.solutionFiles) ? payload.solutionFiles as never : [],
    expectedOutput: typeof payload.expectedOutput === 'string' ? payload.expectedOutput : '',
    previewMode: typeof payload.previewMode === 'string' ? payload.previewMode as never : language === 'html' ? 'html' : 'console',
    aiHelpEnabled: typeof payload.aiHelpEnabled === 'boolean' ? payload.aiHelpEnabled : true,
  };
}

function validateCodePayload(payload: LearningBlockPayload) {
  const issues: string[] = [];
  if (!payload.title) issues.push('Coding card needs a title.');
  if (typeof payload.instructions !== 'string' && typeof payload.body !== 'string' && typeof payload.prompt !== 'string') issues.push('Coding card needs learner instructions.');
  if (typeof payload.language !== 'string') issues.push('Coding card needs a language.');
  if (!Array.isArray(payload.files) || !payload.files.length) issues.push('Coding card needs at least one editable file.');
  return { valid: issues.length === 0, issues };
}

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
