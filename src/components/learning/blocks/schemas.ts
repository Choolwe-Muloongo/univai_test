import type { ComponentType } from 'react';

export type LearningBlockCategory =
  | 'teaching'
  | 'classroom_board'
  | 'questions'
  | 'math'
  | 'graphing'
  | 'accounting'
  | 'spreadsheet'
  | 'coding'
  | 'web'
  | 'business'
  | 'science'
  | 'cybersecurity'
  | 'ai-data'
  | 'media'
  | 'drag-drop'
  | 'projects'
  | 'gamification'
  | 'certificate'
  | 'simulations'
  | 'writing'
  | 'vocational';

export type LearningBlockPayload = Record<string, unknown> & {
  type: string;
  title?: string;
  body?: string;
  prompt?: string;
  question?: string;
  options?: string[] | string;
  correctAnswer?: string | boolean | number;
  answer?: string | boolean | number;
  explanation?: string;
  required?: boolean;
  certificateRequired?: boolean;
};

export type BlockRuntimeState = {
  answer?: string;
  selected?: string;
  revealed?: boolean;
  completed?: boolean;
};

export type BlockValidationResult = {
  valid: boolean;
  issues: string[];
};

export type BlockCompletionRule = {
  required: boolean;
  requiresAnswer?: boolean;
  requiresReveal?: boolean;
  manualReview?: boolean;
};

export type BlockCertificateSettings = {
  canRequire: boolean;
  defaultRequired: boolean;
  label?: string;
};

export type BlockAutoMarkResult = {
  correct: boolean;
  score?: number;
  feedback?: string;
};

export type BlockRendererProps = {
  payload: LearningBlockPayload;
  definition: LearningBlockDefinition;
  state?: BlockRuntimeState;
  onStateChange?: (state: BlockRuntimeState) => void;
  onComplete?: () => void;
};

export type BlockEditorProps = {
  payload: LearningBlockPayload;
  definition: LearningBlockDefinition;
  onChange: (payload: LearningBlockPayload) => void;
};

export type LearningBlockDefinition = {
  type: string;
  label: string;
  category: LearningBlockCategory;
  family: string;
  description: string;
  defaultPayload: LearningBlockPayload;
  payloadSchema: Record<string, unknown>;
  AdminEditor: ComponentType<BlockEditorProps>;
  StudentRenderer: ComponentType<BlockRendererProps>;
  PreviewRenderer: ComponentType<BlockRendererProps>;
  validate: (payload: LearningBlockPayload) => BlockValidationResult;
  completion: BlockCompletionRule;
  certificate: BlockCertificateSettings;
  autoMark?: (payload: LearningBlockPayload, answer: unknown) => BlockAutoMarkResult;
  feedback?: (payload: LearningBlockPayload, state?: BlockRuntimeState) => string | null;
  aiInstructions?: string;
  difficulty?: 'introductory' | 'easy' | 'medium' | 'hard' | 'advanced';
  bestUsedFor?: string[];
  autoMarked?: boolean;
  manualMarked?: boolean;
};

export type BlockTypeSpec = {
  type: string;
  label?: string;
  category: LearningBlockCategory;
  family: string;
  description?: string;
  defaultPayload?: Partial<LearningBlockPayload>;
  completion?: Partial<BlockCompletionRule>;
  certificate?: Partial<BlockCertificateSettings>;
  aiInstructions?: string;
  difficulty?: LearningBlockDefinition['difficulty'];
  bestUsedFor?: string[];
  autoMarked?: boolean;
  manualMarked?: boolean;
};
