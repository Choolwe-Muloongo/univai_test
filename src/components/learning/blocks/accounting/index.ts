import type { LearningBlockDefinition, LearningBlockPayload } from '../schemas';
import { AccountingCardPreviewRenderer, AccountingCardRenderer } from './AccountingCardRenderer';
import { autoMarkAccounting, validateAccountingPayload } from './engine';
import { AccountingStudioEditor } from './AccountingStudioEditor';
import { accountingCourseLevels, accountingLessonPattern, accountingTemplateKinds } from './course-blueprints';

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

const accountingPayloadSchema = {
  type: 'object',
  required: ['type', 'content'],
  properties: {
    type: { type: 'string' },
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
  metadata: {
    supportedLevels: Object.keys(accountingCourseLevels),
    lessonPattern: accountingLessonPattern,
    templates: accountingTemplateKinds.map((template) => template.kind),
  },
  additionalProperties: true,
};

const accountingStudioDefinition: LearningBlockDefinition = {
  type: 'accounting_studio',
  label: 'Accounting Studio Engine',
  category: 'accounting',
  family: 'accounting-engine',
  description: 'Complete professional accounting workflow block for beginner, intermediate, advanced, professional, and PhD-level courses. Supports scenarios, journals, ledgers, trial balances, statements, bank reconciliation, depreciation, inventory valuation, ratios, errors, IFRS treatment, audit risk, tax, budgeting, variance analysis, research critique, and business simulations.',
  defaultPayload,
  payloadSchema: accountingPayloadSchema,
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
    'Use type accounting_studio for full legacy accounting workflow cards only when a compact all-in-one experience is required.',
    'For normal lessons, prefer the split card types: accounting_intro, accounting_scenario, accounting_workpaper, accounting_journal_entry, accounting_ledger, accounting_trial_balance, accounting_statement, accounting_feedback, accounting_exam_question, and accounting_marking_scheme.',
    'Build from beginner to PhD level using structured accounting cards, never plain notes only.',
    'Store structured content inside content.accountingType, content.difficulty, content.data, content.expectedAnswer, and content.markingScheme.',
    'Every serious lesson should follow scenario, concept, account effect, journal entry, ledger posting, student attempt, instant correction, exam question, and marking scheme.',
    'For beginner cards, use simple ZMW business examples and show account effects.',
    'For intermediate cards, force students to prepare full accounts, reconciliations, adjustments, control accounts, depreciation, inventory, and error corrections.',
    'For advanced cards, include IFRS principles, financial statements, cash flows, consolidation, ratio interpretation, costing, budgeting, and variance analysis.',
    'For professional cards, include long cases, report writing, audit risks, tax computations, ethics, governance, and ACCA-style marking schemes.',
    'For PhD cards, include accounting theory, research critique, literature gaps, methodology, measurement debates, and evidence-based argumentation.',
  ].join(' '),
  difficulty: 'advanced',
  bestUsedFor: [
    'beginner accounting courses',
    'intermediate exam preparation',
    'advanced university accounting',
    'professional ACCA-style accounting',
    'PhD accounting research critique',
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
    'IFRS treatment',
    'audit risk and controls',
    'tax computation',
    'budgeting and variance analysis',
    'business accounting simulations',
  ],
  autoMarked: true,
};

const accountingSectionSpecs = [
  ['accounting_intro', 'Accounting Intro', 'Concept, teacher explanation, hints, and guided accounting reasoning.'],
  ['accounting_scenario', 'Accounting Scenario', 'Business event, transaction facts, amount, date, and accounts to identify.'],
  ['accounting_workpaper', 'Accounting Workpaper', 'Structured accounting table, schedule, reconciliation, or professional working paper.'],
  ['accounting_journal_entry', 'Accounting Journal Entry', 'Debit and credit journal entry card with balancing feedback.'],
  ['accounting_ledger', 'Accounting Ledger', 'Ledger posting card for debit and credit sides of an account.'],
  ['accounting_trial_balance', 'Accounting Trial Balance', 'Trial balance preparation and balancing card.'],
  ['accounting_statement', 'Accounting Statement', 'Financial statement, cash flow, consolidation, or reporting card.'],
  ['accounting_feedback', 'Accounting Feedback', 'Mistake correction, professional reminders, and self-check card.'],
  ['accounting_exam_question', 'Accounting Exam Question', 'Student attempt workspace for accounting practice and exam response.'],
  ['accounting_marking_scheme', 'Accounting Marking Scheme', 'Marks, rubric, professional marking points, and grading criteria.'],
] as const;

const accountingSectionDefinitions: LearningBlockDefinition[] = accountingSectionSpecs.map(([type, label, description]) => ({
  ...accountingStudioDefinition,
  type,
  label,
  description,
  family: 'accounting-section-card',
  defaultPayload: { ...defaultPayload, type, title: label },
  completion: type === 'accounting_exam_question'
    ? { required: true, requiresAnswer: true }
    : { required: false, requiresAnswer: false },
  certificate: {
    canRequire: true,
    defaultRequired: type === 'accounting_exam_question' || type === 'accounting_marking_scheme',
    label,
  },
  aiInstructions: [
    `Use type ${type} when building a normal accounting lesson as separate mobile-friendly lesson cards.`,
    'Do not put the whole accounting studio experience into one card unless it is a legacy/imported block.',
    'Keep each card focused on one learner action: understand, inspect scenario, prepare workpaper, attempt answer, review feedback, or read marking scheme.',
  ].join(' '),
}));

export const accountingBlockDefinitions: LearningBlockDefinition[] = [
  accountingStudioDefinition,
  ...accountingSectionDefinitions,
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

export type { AccountingLearningMode } from './learner-experience';
export type { AccountingTeachingFlow, AccountingTeachingStep } from './teaching-flows';
export { chartOfAccounts } from './engine';
export { accountingCourseLevels, accountingLessonPattern, accountingTemplateKinds } from './course-blueprints';
export { buildAccountingHints } from './hint-engine';
export { buildAccountingMistakeFeedback } from './mistake-feedback';
export { accountingLearningModes, modeInstruction } from './learner-experience';
export { buildAccountingTeachingFlow } from './teaching-flows';
