import type { LearningBlockDefinition, LearningBlockPayload } from '../schemas';
import { AccountingCardPreviewRenderer, AccountingCardRenderer } from './AccountingCardRenderer';
import { autoMarkAccounting, validateAccountingPayload } from './engine';
import { AccountingStudioEditor } from './AccountingStudioEditor';

const defaultPayload: LearningBlockPayload = {
  type: 'accounting_studio',
  title: 'Double-entry accounting practice',
  body: 'Work through the business event, identify the accounts affected, record the journal entry, and check whether the accounting treatment balances.',
  content: {
    accountingType: 'journal_entry',
    difficulty: 'beginner',
    data: {
      currency: 'ZMW',
      question: 'Record the journal entry for starting a business with K10,000 cash.',
      rows: [
        { account: 'Cash', debit: 10000, credit: 0 },
        { account: 'Capital', debit: 0, credit: 10000 },
      ],
      narration: 'Being capital introduced into the business in cash.',
    },
    expectedAnswer: {
      rows: [
        { account: 'Cash', debit: 10000, credit: 0 },
        { account: 'Capital', debit: 0, credit: 10000 },
      ],
    },
    markingScheme: {
      totalMarks: 4,
      items: [
        { description: 'Correct debit account', marks: 1 },
        { description: 'Correct credit account', marks: 1 },
        { description: 'Correct amount on both sides', marks: 1 },
        { description: 'Appropriate narration or reason', marks: 1 },
      ],
    },
  },
  required: true,
  certificateRequired: true,
};

export const accountingBlockDefinitions: LearningBlockDefinition[] = [
  {
    type: 'accounting_studio',
    label: 'Accounting Studio Engine',
    category: 'accounting',
    family: 'accounting-engine',
    description: 'Professional accounting workflow block for scenarios, journals, ledgers, trial balances, statements, bank reconciliation, depreciation, inventory valuation, ratios, errors, case studies, and business simulations.',
    defaultPayload,
    payloadSchema: {
      type: 'object',
      required: ['type', 'content'],
      properties: {
        type: { const: 'accounting_studio' },
        title: { type: 'string' },
        body: { type: 'string' },
        content: {
          type: 'object',
          required: ['accountingType', 'difficulty', 'data'],
          properties: {
            accountingType: { type: 'string' },
            difficulty: { type: 'string' },
            data: { type: 'object' },
            expectedAnswer: { type: 'object' },
            markingScheme: { type: 'object' },
          },
        },
      },
      additionalProperties: true,
    },
    AdminEditor: AccountingStudioEditor,
    StudentRenderer: AccountingCardRenderer,
    PreviewRenderer: AccountingCardPreviewRenderer,
    validate: validateAccountingPayload,
    completion: { required: true, requiresAnswer: true },
    certificate: { canRequire: true, defaultRequired: true, label: 'Complete accounting workflow practice' },
    autoMark: autoMarkAccounting,
    feedback: (payload) => {
      const result = validateAccountingPayload(payload);
      return result.valid ? 'Accounting workflow is ready for learner practice.' : result.issues.join(' ');
    },
    aiInstructions: [
      'Use type accounting_studio for all accounting lessons.',
      'Store structured content inside content.accountingType, content.difficulty, content.data, content.expectedAnswer, and content.markingScheme.',
      'Do not generate plain accounting paragraphs when a workflow card is better.',
      'Prefer scenario → transaction → journal entry → ledger → trial balance → statements → analysis → exam practice.',
      'For beginner cards, use simple ZMW examples. For professional cards, include IFRS treatment, report writing, marking schemes, and scenario-based judgment.',
    ].join(' '),
    difficulty: 'advanced',
    bestUsedFor: [
      'double-entry practice',
      'transaction analysis',
      'journal entry building',
      'ledger posting',
      'trial balance preparation',
      'financial statement preparation',
      'bank reconciliation',
      'depreciation schedules',
      'inventory valuation',
      'suspense accounts and error correction',
      'ratio analysis',
      'ACCA-style case studies',
      'business accounting simulations',
    ],
    autoMarked: true,
  },
];

export type {
  AccountCategory,
  AccountingCardContent,
  AccountingCardType,
  AccountingDifficulty,
  AccountingMistakeType,
  JournalRow,
  LedgerEntry,
  NormalBalance,
  StatementSection,
  TrialBalanceAccount,
} from './engine';

export { chartOfAccounts } from './engine';
