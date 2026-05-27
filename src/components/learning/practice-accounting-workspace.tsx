'use client';

import { useMemo } from 'react';

import { AccountingCardRenderer } from '@/components/learning/blocks/accounting/AccountingCardRenderer';
import type { LearningBlockDefinition, LearningBlockPayload } from '@/components/learning/blocks/schemas';
import type { ShortCourseQuestion } from '@/lib/api/short-courses';

type PracticeAccountingWorkspaceProps = {
  question: ShortCourseQuestion;
};

const EmptyEditor = () => null;

const fallbackDefinition: LearningBlockDefinition = {
  type: 'accounting_exam_question',
  label: 'Accounting Workspace',
  category: 'accounting',
  family: 'practice-accounting-workspace',
  description: 'Structured accounting practice workspace for journals, ledgers, trial balances, statements, and reconciliations.',
  defaultPayload: {
    type: 'accounting_exam_question',
    title: 'Accounting workspace',
    body: 'Prepare the required accounting workpaper.',
    content: {
      accountingType: 'journal_entry',
      difficulty: 'beginner',
      data: {
        currency: 'ZMW',
        question: 'Prepare the accounting response.',
        rows: [],
      },
      expectedAnswer: {
        rows: [],
      },
    },
  },
  payloadSchema: {
    type: 'object',
    additionalProperties: true,
  },
  AdminEditor: EmptyEditor,
  StudentRenderer: AccountingCardRenderer,
  PreviewRenderer: AccountingCardRenderer,
  validate: () => ({ valid: true, issues: [] }),
  completion: {
    required: true,
    requiresAnswer: true,
  },
  certificate: {
    canRequire: true,
    defaultRequired: true,
    label: 'Accounting Workspace',
  },
  autoMarked: true,
  difficulty: 'medium',
  bestUsedFor: ['accounting practice', 'workpaper questions', 'ZICA-style revision'],
};

export function PracticeAccountingWorkspace({ question }: PracticeAccountingWorkspaceProps) {
  const payload = useMemo<LearningBlockPayload>(() => {
    const workspace = question.accountingWorkspace ?? {};
    const workspaceContent = workspace.content ?? {};

    return {
      type: workspace.type ?? 'accounting_exam_question',
      title: workspace.title ?? question.question ?? 'Accounting workspace',
      body: workspace.body ?? 'Use the structured workspace to prepare your answer.',
      content: {
        accountingType: workspaceContent.accountingType ?? 'journal_entry',
        difficulty: workspaceContent.difficulty ?? question.difficulty ?? 'beginner',
        data: {
          currency: 'ZMW',
          question: question.question,
          ...(workspaceContent.data ?? {}),
        },
        expectedAnswer: workspaceContent.expectedAnswer ?? question.expectedAnswer ?? {},
        markingScheme: workspaceContent.markingScheme ?? question.markingScheme ?? undefined,
      },
      required: true,
      certificateRequired: true,
    };
  }, [question]);

  return (
    <div className="min-w-0 max-w-full overflow-x-auto rounded-2xl border bg-muted/20 p-3">
      <AccountingCardRenderer payload={payload} definition={fallbackDefinition} state={{}} />
    </div>
  );
}
