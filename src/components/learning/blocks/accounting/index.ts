import type { LearningBlockDefinition, LearningBlockPayload } from '../schemas';
import { AccountingCardPreviewRenderer, AccountingCardRenderer } from './AccountingCardRenderer';
import { autoMarkAccounting, validateAccountingPayload } from './engine';
import { AccountingStudioEditor } from './AccountingStudioEditor';
import { accountingCourseLevels, accountingLessonPattern, accountingTemplateKinds } from './course-blueprints';

type AccountingCardSpec = {
  type: string;
  label: string;
  description: string;
  accountingType: string;
  title: string;
  body: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | 'phd';
  data?: Record<string, unknown>;
  expectedAnswer?: Record<string, unknown>;
  markingScheme?: {
    totalMarks: number;
    items: { description: string; marks: number; keywords?: string[] }[];
  };
  completion?: LearningBlockDefinition['completion'];
  certificateRequired?: boolean;
  bestUsedFor?: string[];
};

const baseJournalRows = [
  { account: 'Cash', debit: 10000, credit: 0 },
  { account: 'Capital', debit: 0, credit: 10000 },
];

const baseMarkingScheme = {
  totalMarks: 4,
  items: [
    { description: 'Correct debit account', marks: 1, keywords: ['cash', 'debit'] },
    { description: 'Correct credit account', marks: 1, keywords: ['capital', 'credit'] },
    { description: 'Correct amount on both sides', marks: 1, keywords: ['10000', 'balance'] },
    { description: 'Appropriate narration or reason', marks: 1, keywords: ['capital introduced'] },
  ],
};

const defaultPayload: LearningBlockPayload = {
  type: 'accounting_journal_entry',
  title: 'Prepare the journal entry',
  body: 'Turn a business event into a formal debit and credit journal entry.',
  content: {
    accountingType: 'journal_entry',
    difficulty: 'beginner',
    data: {
      currency: 'ZMW',
      rows: baseJournalRows,
      narration: 'Being capital introduced into the business in cash.',
    },
    expectedAnswer: { rows: baseJournalRows },
    markingScheme: baseMarkingScheme,
  },
  required: false,
  certificateRequired: false,
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
    statementTypes: [
      'income_statement',
      'balance_sheet',
      'statement_of_financial_position',
      'manufacturing_account',
      'cash_flow_statement',
      'bank_reconciliation_statement',
      'vat_account',
      'day_book',
      'cash_book',
      'asset_disposal_account',
      'partnership_appropriation',
      'partner_current_accounts',
      'statement_of_changes_in_equity',
      'ratio_analysis',
    ],
    integrationRule: 'Use generic UnivAI cards for explanations, examples, scenarios, teaching threads, and normal questions. Use accounting cards only when the learner needs an accounting-specific workspace, table, or calculation.',
  },
  additionalProperties: true,
};

const accountingCardSpecs: AccountingCardSpec[] = [
  {
    type: 'accounting_journal_entry',
    label: 'Accounting Journal Entry',
    description: 'Debit and credit journal entry card with balancing feedback and narration.',
    accountingType: 'journal_entry',
    title: 'Prepare the journal entry',
    body: 'Turn the business event into a formal journal entry.',
    data: { currency: 'ZMW', rows: baseJournalRows, narration: 'Being capital introduced into the business in cash.' },
    expectedAnswer: { rows: baseJournalRows },
    markingScheme: baseMarkingScheme,
    bestUsedFor: ['journal entries', 'double entry', 'auto-marked practice'],
  },
  {
    type: 'accounting_t_account',
    label: 'T-Account',
    description: 'Ledger-style T-account display for one account with debit and credit sides.',
    accountingType: 'ledger',
    title: 'Post to the T-account',
    body: 'Show how journal entries move into ledger accounts.',
    data: {
      currency: 'ZMW',
      accountName: 'Cash Account',
      debitEntries: [{ date: '2026-01-05', details: 'Capital', amount: 10000 }],
      creditEntries: [],
    },
    bestUsedFor: ['ledger posting', 'T-accounts', 'journal-to-ledger flow'],
  },
  {
    type: 'accounting_ledger',
    label: 'Accounting Ledger',
    description: 'Ledger posting card for debit and credit sides of an account.',
    accountingType: 'ledger',
    title: 'Ledger posting',
    body: 'Post journal entries into ledger accounts and show account movement clearly.',
    data: {
      currency: 'ZMW',
      accountName: 'Capital Account',
      debitEntries: [],
      creditEntries: [{ date: '2026-01-05', details: 'Cash', amount: 10000 }],
    },
    bestUsedFor: ['ledger accounts', 'posting', 'account balances'],
  },
  {
    type: 'accounting_cashbook',
    label: 'Cash Book',
    description: 'Cash book card for receipts, payments, bank/cash columns, and balancing.',
    accountingType: 'financial_statement',
    title: 'Cash book',
    body: 'Display cash and bank movement in a proper cash book format.',
    data: {
      currency: 'ZMW',
      statementType: 'cash_book',
      businessName: 'Muloongo Traders',
      period: 'Month ended 31 January 2026',
      receipts: [{ date: 'Jan 1', details: 'Capital', cash: 5000, bank: 20000 }, { date: 'Jan 8', details: 'Cash sales', cash: 1500 }],
      payments: [{ date: 'Jan 10', details: 'Purchases', cash: 2000 }, { date: 'Jan 15', details: 'Rent', bank: 3000 }],
    },
    bestUsedFor: ['cash book', 'receipts and payments', 'bookkeeping practice'],
  },
  {
    type: 'accounting_control_account',
    label: 'Control Account',
    description: 'Control account card for receivables, payables, sales ledger, and purchases ledger control.',
    accountingType: 'ledger',
    title: 'Control account',
    body: 'Summarise many individual customer or supplier accounts in one control account.',
    difficulty: 'intermediate',
    data: {
      currency: 'ZMW',
      accountName: 'Sales Ledger Control Account',
      debitEntries: [{ details: 'Opening balance', amount: 4500 }, { details: 'Credit sales', amount: 12000 }],
      creditEntries: [{ details: 'Cash received', amount: 9000 }, { details: 'Discount allowed', amount: 300 }],
    },
    bestUsedFor: ['control accounts', 'receivables', 'payables'],
  },
  {
    type: 'accounting_trial_balance',
    label: 'Accounting Trial Balance',
    description: 'Trial balance preparation and balancing card.',
    accountingType: 'trial_balance',
    title: 'Prepare the trial balance',
    body: 'Bring ledger balances together and check whether debit totals equal credit totals.',
    data: {
      currency: 'ZMW',
      businessName: 'Muloongo Traders',
      period: 'as at 31 January 2026',
      accounts: [
        { name: 'Cash', debit: 10000, credit: 0 },
        { name: 'Purchases', debit: 8000, credit: 0 },
        { name: 'Rent Expense', debit: 2000, credit: 0 },
        { name: 'Capital', debit: 0, credit: 15000 },
        { name: 'Sales Revenue', debit: 0, credit: 5000 },
      ],
    },
    expectedAnswer: {
      accounts: [
        { name: 'Cash', debit: 10000, credit: 0 },
        { name: 'Purchases', debit: 8000, credit: 0 },
        { name: 'Rent Expense', debit: 2000, credit: 0 },
        { name: 'Capital', debit: 0, credit: 15000 },
        { name: 'Sales Revenue', debit: 0, credit: 5000 },
      ],
    },
    bestUsedFor: ['trial balance', 'balancing', 'ledger checks'],
  },
  {
    type: 'accounting_statement',
    label: 'Accounting Statement',
    description: 'Professional statement/workpaper renderer for ZICA-style final accounts and accounting tables.',
    accountingType: 'financial_statement',
    title: 'Prepare the statement of financial position',
    body: 'Render a professional accounting statement using statementType. Change statementType to income_statement, balance_sheet, manufacturing_account, cash_flow_statement, vat_account, day_book, cash_book, partnership_appropriation, or statement_of_changes_in_equity as needed.',
    difficulty: 'intermediate',
    data: {
      currency: 'ZMW',
      businessName: 'Muloongo Traders',
      statementType: 'statement_of_financial_position',
      period: 'as at 31 January 2026',
      assetSchedule: [
        { name: 'Motor vehicles', cost: 25000, depreciation: 5000 },
        { name: 'Equipment', cost: 15000, depreciation: 3000 },
      ],
      nonCurrentAssets: [
        { name: 'Motor vehicles', amount: 20000 },
        { name: 'Equipment', amount: 12000 },
      ],
      currentAssets: [
        { name: 'Inventory', amount: 8000 },
        { name: 'Trade receivables', amount: 6000 },
        { name: 'Bank', amount: 4000 },
      ],
      equity: [
        { name: 'Capital', amount: 35000 },
        { name: 'Add: Net profit', amount: 8000 },
        { name: 'Less: Drawings', amount: -3000 },
      ],
      currentLiabilities: [
        { name: 'Trade payables', amount: 9000 },
        { name: 'Accruals', amount: 5000 },
      ],
    },
    bestUsedFor: ['financial statements', 'final accounts', 'ZICA workpapers', 'balance sheet', 'income statement', 'manufacturing accounts'],
  },
  {
    type: 'accounting_bank_reconciliation',
    label: 'Bank Reconciliation',
    description: 'Bank reconciliation card for cash book balance, bank statement balance, unpresented cheques, and deposits.',
    accountingType: 'bank_reconciliation',
    title: 'Bank reconciliation',
    body: 'Reconcile cash book and bank statement balances.',
    difficulty: 'intermediate',
    data: {
      currency: 'ZMW',
      businessName: 'Muloongo Traders',
      period: 'as at 31 January 2026',
      cashBookBalance: 8400,
      bankStatementBalance: 9000,
      additions: [{ label: 'Interest received', amount: 200 }],
      deductions: [{ label: 'Bank charges', amount: 100 }],
      uncreditedDeposits: [{ label: 'Deposit not yet credited', amount: 500 }],
      unpresentedCheques: [{ label: 'Cheque not yet presented', amount: 1000 }],
    },
    bestUsedFor: ['bank reconciliation', 'cash book', 'exam calculations'],
  },
  {
    type: 'accounting_inventory',
    label: 'Inventory Valuation',
    description: 'Inventory card for FIFO, weighted average, COGS, and closing inventory.',
    accountingType: 'inventory',
    title: 'Inventory valuation',
    body: 'Show how stock movement affects cost of sales and closing inventory.',
    difficulty: 'intermediate',
    data: {
      currency: 'ZMW',
      method: 'FIFO',
      transactions: [
        { type: 'purchase', units: 100, unitCost: 20 },
        { type: 'purchase', units: 50, unitCost: 24 },
        { type: 'sale', units: 120 },
      ],
    },
    bestUsedFor: ['inventory', 'FIFO', 'weighted average'],
  },
  {
    type: 'accounting_depreciation',
    label: 'Depreciation Schedule',
    description: 'Depreciation card for straight-line, reducing balance, and units of production calculations.',
    accountingType: 'depreciation',
    title: 'Depreciation schedule',
    body: 'Calculate depreciation using a structured accounting method.',
    difficulty: 'intermediate',
    data: {
      currency: 'ZMW',
      assets: [
        { name: 'Delivery motorbike', cost: 18000, residualValue: 3000, usefulLifeYears: 5, method: 'straight_line' },
        { name: 'Office equipment', cost: 12000, residualValue: 0, usefulLifeYears: 4, method: 'straight_line' },
      ],
    },
    bestUsedFor: ['depreciation', 'non-current assets', 'adjustments'],
  },
  {
    type: 'accounting_ratio_analysis',
    label: 'Ratio Analysis',
    description: 'Ratio card for liquidity, profitability, gearing, efficiency, and interpretation.',
    accountingType: 'ratio_analysis',
    title: 'Ratio analysis and interpretation',
    body: 'Calculate key accounting ratios from financial statement data.',
    difficulty: 'advanced',
    data: {
      currentAssets: 30000,
      inventory: 8000,
      currentLiabilities: 15000,
      revenue: 90000,
      grossProfit: 27000,
      netProfit: 12000,
      totalAssets: 70000,
      totalLiabilities: 25000,
      equity: 45000,
    },
    bestUsedFor: ['ratio analysis', 'business interpretation', 'financial analysis'],
  },
  {
    type: 'accounting_exam_question',
    label: 'Accounting Exam Workspace',
    description: 'Student attempt workspace for accounting practice that needs journals, trial balances, calculations, or structured professional responses.',
    accountingType: 'journal_entry',
    title: 'Attempt the accounting task',
    body: 'Students work inside an accounting-specific answer area when a normal quiz card is not enough.',
    data: { currency: 'ZMW', question: 'Record the journal entry for capital introduced in cash.', rows: baseJournalRows },
    expectedAnswer: { rows: baseJournalRows },
    markingScheme: baseMarkingScheme,
    completion: { required: true, requiresAnswer: true },
    certificateRequired: true,
    bestUsedFor: ['exam practice', 'student attempt', 'assessment'],
  },
];

function buildDefaultPayload(spec: AccountingCardSpec): LearningBlockPayload {
  return {
    ...defaultPayload,
    type: spec.type,
    title: spec.title,
    body: spec.body,
    required: spec.completion?.required ?? false,
    certificateRequired: spec.certificateRequired ?? false,
    content: {
      accountingType: spec.accountingType,
      difficulty: spec.difficulty ?? 'beginner',
      data: {
        currency: 'ZMW',
        ...(spec.data ?? {}),
      },
      expectedAnswer: spec.expectedAnswer,
      markingScheme: spec.markingScheme,
    },
  };
}

const accountingSectionDefinitions: LearningBlockDefinition[] = accountingCardSpecs.map((spec) => ({
  type: spec.type,
  label: spec.label,
  category: 'accounting',
  family: 'accounting-workspace-card',
  description: spec.description,
  defaultPayload: buildDefaultPayload(spec),
  payloadSchema: accountingPayloadSchema,
  AdminEditor: AccountingStudioEditor,
  StudentRenderer: AccountingCardRenderer,
  PreviewRenderer: AccountingCardPreviewRenderer,
  validate: validateAccountingPayload,
  completion: spec.completion ?? { required: false, requiresAnswer: false },
  certificate: {
    canRequire: true,
    defaultRequired: Boolean(spec.certificateRequired),
    label: spec.label,
  },
  autoMark: autoMarkAccounting,
  feedback: (payload) => {
    const result = validateAccountingPayload(payload);
    return result.valid ? 'Accounting workspace is ready for the normal lesson flow.' : result.issues.join(' ');
  },
  aiInstructions: [
    `Use type ${spec.type} for ${spec.label}.`,
    'Do not use accounting cards for ordinary explanations, scenarios, examples, teaching threads, flashcards, or simple questions. Use the generic UnivAI cards for those parts, just like mathematics lessons do.',
    'Use accounting cards only when the learner needs an accounting-specific workspace, professional statement/table format, balancing check, journal, ledger, statement, reconciliation, valuation, depreciation, ratio calculation, or structured accounting exam attempt.',
    'For long ZICA-style practical questions, break the task into teaching-thread cards first, then use accounting workspaces for professional outputs.',
    'For final accounts and workpapers, prefer accounting_statement with data.statementType rather than creating separate duplicate cards.',
    'Use ZMW examples for local beginner lessons unless another currency is requested.',
  ].join(' '),
  difficulty: spec.difficulty === 'professional' || spec.difficulty === 'phd' ? 'advanced' : 'intermediate',
  bestUsedFor: spec.bestUsedFor ?? [spec.label.toLowerCase(), 'accounting practice', 'structured accounting learning'],
  autoMarked: spec.type === 'accounting_exam_question',
}));

export const accountingBlockDefinitions: LearningBlockDefinition[] = accountingSectionDefinitions;

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
