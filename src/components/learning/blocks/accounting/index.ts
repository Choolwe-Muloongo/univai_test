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

type BlockDifficulty = LearningBlockDefinition['difficulty'];

function mapAccountingDifficulty(difficulty?: AccountingCardSpec['difficulty']): BlockDifficulty {
  switch (difficulty) {
    case 'beginner':
      return 'introductory';
    case 'intermediate':
      return 'medium';
    case 'advanced':
      return 'hard';
    case 'professional':
    case 'phd':
      return 'advanced';
    default:
      return 'introductory';
  }
}

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
  type: 'accounting_intro',
  title: 'Accounting intro',
  body: 'Learn the accounting idea, see it in a business event, then practise it through proper accounting workpapers.',
  content: {
    accountingType: 'concept',
    difficulty: 'beginner',
    data: {
      currency: 'ZMW',
      concept: 'Double-entry accounting',
      explanation: 'Every business event affects at least two accounts. One side is debited and another side is credited so the records stay balanced.',
      example: 'Owner starts a business with K10,000 cash: debit Cash and credit Capital.',
      rows: baseJournalRows,
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
    integrationRule: 'Accounting cards are normal learning blocks. They can be mixed with notes, quizzes, teaching threads, media, examples, and other subject cards in the same lesson.',
  },
  additionalProperties: true,
};

const accountingCardSpecs: AccountingCardSpec[] = [
  {
    type: 'accounting_intro',
    label: 'Accounting Intro',
    description: 'Teacher-style explanation card for concepts, rules, hints, common mistakes, and guided accounting reasoning.',
    accountingType: 'concept',
    title: 'Understand the accounting idea',
    body: 'Teach the concept clearly before asking the student to post anything.',
    data: {
      concept: 'Double-entry principle',
      explanation: 'Every transaction has equal debit and credit effects. The accounting equation must remain balanced after each event.',
      example: 'Buying equipment for cash increases Equipment and decreases Cash. Both are assets, but one goes up and one goes down.',
      teacherNotes: ['Start with the business event.', 'Name the affected accounts.', 'Decide whether each account increases or decreases.', 'Apply the normal balance rule.'],
      commonMistakes: ['Treating debit as always plus', 'Forgetting the second account', 'Posting the amount on both sides of the same account'],
    },
    bestUsedFor: ['concept explanation', 'lesson opening', 'teacher guidance'],
  },
  {
    type: 'accounting_equation',
    label: 'Accounting Equation',
    description: 'Visual equation card for assets, liabilities, equity, income, expenses, and equation movement.',
    accountingType: 'concept',
    title: 'Accounting equation movement',
    body: 'Help students see how business events move the equation before journalising.',
    data: {
      concept: 'Assets = Liabilities + Equity',
      equation: 'Assets = Liabilities + Equity',
      explanation: 'The equation is the skeleton of accounting. Every transaction must leave it standing.',
      movements: [
        { label: 'Owner invests cash', assets: '+ Cash', liabilities: 'No change', equity: '+ Capital' },
        { label: 'Buy goods on credit', assets: '+ Inventory', liabilities: '+ Payables', equity: 'No change' },
        { label: 'Pay rent', assets: '- Cash', liabilities: 'No change', equity: '- Profit through expense' },
      ],
    },
    bestUsedFor: ['accounting equation', 'transaction effects', 'beginner foundation'],
  },
  {
    type: 'accounting_account_classification',
    label: 'Account Classification',
    description: 'Classification card for assets, liabilities, equity, income, expenses, and normal balances.',
    accountingType: 'concept',
    title: 'Classify accounts before posting',
    body: 'Students first learn what kind of account they are dealing with. Then debit and credit becomes easier.',
    data: {
      concept: 'Account classes and normal balances',
      accounts: [
        { name: 'Cash', category: 'Asset', normalBalance: 'Debit' },
        { name: 'Capital', category: 'Equity', normalBalance: 'Credit' },
        { name: 'Sales Revenue', category: 'Income', normalBalance: 'Credit' },
        { name: 'Rent Expense', category: 'Expense', normalBalance: 'Debit' },
        { name: 'Accounts Payable', category: 'Liability', normalBalance: 'Credit' },
      ],
      rule: 'Assets and expenses usually increase on the debit side. Liabilities, equity, and income usually increase on the credit side.',
    },
    bestUsedFor: ['debit and credit basics', 'normal balances', 'account sorting'],
  },
  {
    type: 'accounting_scenario',
    label: 'Accounting Scenario',
    description: 'Business event card that gives transaction facts, dates, amounts, and accounts to identify.',
    accountingType: 'transaction',
    title: 'Read the business event',
    body: 'Train students to extract accounting facts from a real business situation.',
    data: {
      currency: 'ZMW',
      businessName: 'Muloongo Traders',
      transactionDate: '2026-01-05',
      amount: 10000,
      description: 'The owner started the business by depositing K10,000 cash into the business bank account.',
      expectedAccounts: ['Cash', 'Capital'],
      required: ['Identify the accounts affected.', 'State whether each account increases or decreases.', 'Prepare the journal entry.'],
    },
    bestUsedFor: ['transaction reading', 'business cases', 'pre-journal practice'],
  },
  {
    type: 'accounting_transaction_analysis',
    label: 'Transaction Analysis',
    description: 'Step-by-step card for account effect, increase/decrease, debit/credit decision, and reason.',
    accountingType: 'transaction',
    title: 'Analyse the transaction',
    body: 'Break the transaction into accounting logic before the journal entry appears.',
    data: {
      currency: 'ZMW',
      description: 'Owner introduces K10,000 cash into the business.',
      analysisSteps: [
        { step: 'Affected asset', answer: 'Cash increases', side: 'Debit' },
        { step: 'Affected equity', answer: 'Capital increases', side: 'Credit' },
        { step: 'Balance check', answer: 'Debit K10,000 equals Credit K10,000', side: 'Balanced' },
      ],
    },
    bestUsedFor: ['guided reasoning', 'debit-credit decision', 'slow practice'],
  },
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
    accountingType: 'ledger',
    title: 'Cash book',
    body: 'Display cash and bank movement in a format students recognise from class and exams.',
    data: {
      currency: 'ZMW',
      accountName: 'Cash Book',
      debitEntries: [{ date: '2026-01-05', details: 'Capital', amount: 10000 }],
      creditEntries: [{ date: '2026-01-08', details: 'Rent', amount: 1200 }],
      tableKind: 'Two-column cash book',
    },
    bestUsedFor: ['cash book', 'receipts and payments', 'bookkeeping practice'],
  },
  {
    type: 'accounting_control_account',
    label: 'Control Account',
    description: 'Control account card for receivables, payables, sales ledger, and purchases ledger control.',
    accountingType: 'ledger',
    title: 'Control account',
    body: 'Teach students how control accounts summarise many individual customer or supplier accounts.',
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
      title: 'Trial Balance as at 31 January 2026',
      accounts: [
        { name: 'Cash', debit: 10000, credit: 0 },
        { name: 'Capital', debit: 0, credit: 10000 },
      ],
    },
    expectedAnswer: {
      accounts: [
        { name: 'Cash', debit: 10000, credit: 0 },
        { name: 'Capital', debit: 0, credit: 10000 },
      ],
    },
    bestUsedFor: ['trial balance', 'balancing', 'ledger checks'],
  },
  {
    type: 'accounting_adjustment',
    label: 'Accounting Adjustment',
    description: 'Adjustment card for accruals, prepayments, depreciation, inventory, bad debts, and correction entries.',
    accountingType: 'journal_entry',
    title: 'Year-end adjustment',
    body: 'Teach students how financial statements are corrected before reporting.',
    difficulty: 'intermediate',
    data: {
      currency: 'ZMW',
      scenario: 'Rent prepaid at year-end is K600.',
      rows: [
        { account: 'Prepaid Rent', debit: 600, credit: 0 },
        { account: 'Rent Expense', debit: 0, credit: 600 },
      ],
      narration: 'Being prepaid rent recognised at year-end.',
    },
    bestUsedFor: ['adjustments', 'accruals and prepayments', 'final accounts'],
  },
  {
    type: 'accounting_workpaper',
    label: 'Accounting Workpaper',
    description: 'Structured accounting table, schedule, reconciliation, or professional working paper.',
    accountingType: 'case_study',
    title: 'Accounting workpaper',
    body: 'Use a clear working table before the final answer. This is where students stop guessing and start proving.',
    data: {
      tableKind: 'Adjustment schedule',
      columns: ['Item', 'Working', 'Amount'],
      rows: [
        ['Prepaid rent', 'Rent paid less period used', 'ZMW 600'],
        ['Depreciation', 'Cost × rate', 'ZMW 1,200'],
      ],
    },
    bestUsedFor: ['workings', 'schedules', 'exam preparation'],
  },
  {
    type: 'accounting_statement',
    label: 'Accounting Statement',
    description: 'Financial statement, profit or loss, financial position, cash flow, consolidation, or reporting card.',
    accountingType: 'financial_statement',
    title: 'Prepare the financial statement',
    body: 'Convert ledger and adjustment data into a clean professional statement.',
    difficulty: 'intermediate',
    data: {
      currency: 'ZMW',
      standardFramework: 'IFRS-style classroom format',
      businessName: 'Muloongo Traders',
      statementType: 'Statement of profit or loss',
      period: 'Month ended 31 January 2026',
      sections: [
        { title: 'Revenue', items: [{ name: 'Sales', amount: 25000 }] },
        { title: 'Expenses', items: [{ name: 'Rent', amount: 1200 }, { name: 'Wages', amount: 3000 }] },
      ],
    },
    bestUsedFor: ['financial statements', 'final accounts', 'reporting'],
  },
  {
    type: 'accounting_bank_reconciliation',
    label: 'Bank Reconciliation',
    description: 'Bank reconciliation card for cash book balance, bank statement balance, unpresented cheques, and deposits.',
    accountingType: 'bank_reconciliation',
    title: 'Bank reconciliation',
    body: 'Teach students why cash book and bank statement balances differ and how to reconcile them.',
    difficulty: 'intermediate',
    data: {
      currency: 'ZMW',
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
    body: 'Let students see how stock movement affects cost of sales and closing inventory.',
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
    title: 'Depreciation calculation',
    body: 'Show depreciation as a systematic allocation, not random loss of value.',
    difficulty: 'intermediate',
    data: { currency: 'ZMW', asset: 'Delivery motorbike', cost: 18000, residualValue: 3000, usefulLifeYears: 5, method: 'straight_line' },
    bestUsedFor: ['depreciation', 'non-current assets', 'adjustments'],
  },
  {
    type: 'accounting_ratio_analysis',
    label: 'Ratio Analysis',
    description: 'Ratio card for liquidity, profitability, gearing, efficiency, and interpretation.',
    accountingType: 'ratio_analysis',
    title: 'Ratio analysis and interpretation',
    body: 'Move students beyond calculation into business meaning.',
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
    type: 'accounting_budgeting',
    label: 'Budgeting Card',
    description: 'Budgeting card for sales budgets, cash budgets, flexible budgets, and planning assumptions.',
    accountingType: 'budgeting',
    title: 'Prepare a budget',
    body: 'Students practise planning future business activity using assumptions and working schedules.',
    difficulty: 'advanced',
    data: {
      caseTitle: 'Cash budget planning',
      scenario: 'A business expects sales of K20,000 in June, K25,000 in July, and K30,000 in August. 60% is received in the month of sale and 40% the following month.',
      required: ['Prepare the cash receipts schedule.', 'Explain one risk in the assumptions.', 'State one management action.'],
      expectedKeywords: ['cash receipts', 'credit sales', 'assumption', 'liquidity', 'management'],
      evidenceStandard: 'Show workings and explain business judgement.',
    },
    markingScheme: { totalMarks: 10, items: [{ description: 'Correct receipts schedule', marks: 5 }, { description: 'Assumption risk explained', marks: 3 }, { description: 'Useful management action', marks: 2 }] },
    bestUsedFor: ['budgeting', 'cash budgets', 'management accounting'],
  },
  {
    type: 'accounting_variance_analysis',
    label: 'Variance Analysis',
    description: 'Variance card for budget versus actual, favourable/adverse labels, and management interpretation.',
    accountingType: 'variance_analysis',
    title: 'Variance analysis',
    body: 'Teach students to compare actual performance with budget and explain the story behind the numbers.',
    difficulty: 'advanced',
    data: {
      caseTitle: 'Materials variance review',
      scenario: 'Actual material cost was K18,600 against a budget of K16,000. Output was higher than expected.',
      required: ['Calculate the variance.', 'Label it as favourable or adverse.', 'Explain two possible causes.'],
      expectedKeywords: ['adverse', 'cost', 'price', 'usage', 'output'],
      evidenceStandard: 'Calculation plus management explanation.',
    },
    markingScheme: { totalMarks: 8, items: [{ description: 'Correct variance', marks: 3 }, { description: 'Correct label', marks: 2 }, { description: 'Plausible causes', marks: 3 }] },
    bestUsedFor: ['variance analysis', 'management accounting', 'performance control'],
  },
  {
    type: 'accounting_tax_working',
    label: 'Tax Working',
    description: 'Tax computation card for jurisdiction, taxable income, allowances, disallowables, and final tax payable.',
    accountingType: 'tax_computation',
    title: 'Tax computation working',
    body: 'Keep tax learning structured: identify taxable base, adjustments, allowance, rate, and final liability.',
    difficulty: 'professional',
    data: {
      jurisdiction: 'Zambia classroom example',
      caseTitle: 'Taxable profit computation',
      scenario: 'A business reports accounting profit before tax and several adjustments. Prepare a taxable profit computation.',
      required: ['Identify disallowable expenses.', 'Apply capital allowances where relevant.', 'Compute taxable profit.', 'Explain one compliance risk.'],
      expectedKeywords: ['taxable profit', 'disallowable', 'allowance', 'compliance', 'jurisdiction'],
      evidenceStandard: 'Professional tax computation with clear assumptions.',
    },
    markingScheme: { totalMarks: 15, items: [{ description: 'Correct tax adjustments', marks: 6 }, { description: 'Correct computation structure', marks: 5 }, { description: 'Compliance risk', marks: 4 }] },
    bestUsedFor: ['tax', 'professional accounting', 'computation questions'],
  },
  {
    type: 'accounting_audit_case',
    label: 'Audit Case',
    description: 'Audit case card for risks, controls, assertions, evidence, and audit response.',
    accountingType: 'audit_risk',
    title: 'Audit risk and response',
    body: 'Students learn to think like auditors: risk, assertion, evidence, control, response.',
    difficulty: 'professional',
    data: {
      caseTitle: 'Inventory audit risk',
      scenario: 'A client holds high-value inventory in multiple warehouses and uses manual stock sheets.',
      required: ['Identify audit risks.', 'Link each risk to an assertion.', 'Recommend audit procedures.', 'State expected evidence.'],
      expectedKeywords: ['existence', 'valuation', 'cut-off', 'evidence', 'procedure', 'control'],
      evidenceStandard: 'Professional audit response with assertion linkage.',
    },
    markingScheme: { totalMarks: 20, items: [{ description: 'Relevant audit risks', marks: 6 }, { description: 'Assertion linkage', marks: 5 }, { description: 'Audit procedures', marks: 6 }, { description: 'Evidence quality', marks: 3 }] },
    bestUsedFor: ['audit', 'professional exams', 'case analysis'],
  },
  {
    type: 'accounting_ethics_case',
    label: 'Ethics Case',
    description: 'Ethics card for professional judgement, threats, safeguards, governance, and reporting decisions.',
    accountingType: 'case_study',
    title: 'Ethics and professional judgement',
    body: 'Make accounting moral and practical: students must decide what the accountant should do.',
    difficulty: 'professional',
    data: {
      caseTitle: 'Pressure to change figures',
      scenario: 'A manager asks the accountant to delay recording expenses so the business can appear profitable before a loan application.',
      required: ['Identify the ethical threat.', 'Explain the accounting issue.', 'Recommend safeguards.', 'Write a professional response.'],
      expectedKeywords: ['integrity', 'objectivity', 'misstatement', 'safeguard', 'professional'],
      evidenceStandard: 'Ethical reasoning plus accounting consequence.',
    },
    markingScheme: { totalMarks: 12, items: [{ description: 'Ethical threat identified', marks: 3 }, { description: 'Accounting issue explained', marks: 3 }, { description: 'Safeguards recommended', marks: 3 }, { description: 'Professional response', marks: 3 }] },
    bestUsedFor: ['ethics', 'professional judgement', 'governance'],
  },
  {
    type: 'accounting_exam_question',
    label: 'Accounting Exam Question',
    description: 'Student attempt workspace for accounting practice and exam response.',
    accountingType: 'journal_entry',
    title: 'Attempt the exam-style question',
    body: 'Students must now work without being spoon-fed. This card supports answer checking where possible.',
    data: { currency: 'ZMW', question: 'Record the journal entry for capital introduced in cash.', rows: baseJournalRows },
    expectedAnswer: { rows: baseJournalRows },
    markingScheme: baseMarkingScheme,
    completion: { required: true, requiresAnswer: true },
    certificateRequired: true,
    bestUsedFor: ['exam practice', 'student attempt', 'assessment'],
  },
  {
    type: 'accounting_marking_scheme',
    label: 'Accounting Marking Scheme',
    description: 'Marks, rubric, professional marking points, and grading criteria.',
    accountingType: 'marking_scheme',
    title: 'Marking scheme',
    body: 'Show students how marks are earned so they stop writing vague answers.',
    data: { tableKind: 'Marking guide' },
    markingScheme: baseMarkingScheme,
    certificateRequired: true,
    bestUsedFor: ['rubrics', 'exam marking', 'teacher feedback'],
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
  family: 'accounting-section-card',
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
    return result.valid ? 'Accounting card is ready for the normal lesson flow.' : result.issues.join(' ');
  },
  aiInstructions: [
    `Use type ${spec.type} for ${spec.label}.`,
    'Accounting is not a separate studio. Use these accounting cards inside the normal lesson builder alongside text cards, examples, teaching threads, quizzes, media, and assessments.',
    'Keep one learner action per card. Build the learning path with concept, scenario, analysis, journal, ledger, trial balance, adjustment, statement, interpretation, practice, and marking scheme cards.',
    'For accounting courses, prefer multiple focused accounting cards instead of one huge card.',
    'Use ZMW examples for local beginner lessons unless another currency is requested.',
  ].join(' '),
  difficulty: mapAccountingDifficulty(spec.difficulty),
  bestUsedFor: spec.bestUsedFor ?? [spec.label.toLowerCase(), 'accounting course design', 'structured accounting learning'],
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
