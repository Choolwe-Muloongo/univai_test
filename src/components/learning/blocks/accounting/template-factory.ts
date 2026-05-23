import type { LearningBlockPayload } from '../schemas';
import { getAccountingContent } from './engine';

export const accountingRenderableTemplates = [
  'Accounting equation concept',
  'Transaction scenario',
  'Journal entry practice',
  'Ledger posting practice',
  'Trial balance builder',
  'Income statement builder',
  'Statement of financial position builder',
  'Bank reconciliation',
  'Depreciation schedule',
  'Inventory valuation',
  'Error correction',
  'Ratio analysis',
  'Full accounting cycle simulation',
  'Partnership accounts case',
  'Company accounts case',
  'Cash flow statement case',
  'Consolidation case',
  'IFRS treatment case',
  'Audit risk case',
  'Tax computation case',
  'Budgeting case',
  'Variance analysis case',
  'Professional exam case',
  'Research critique case',
];

export function applyAccountingTemplate(template: string, payload: LearningBlockPayload): LearningBlockPayload {
  const base = { ...payload };
  const content = getAccountingContent(base);
  const next = { ...content };

  if (template === 'Accounting equation concept') {
    next.accountingType = 'concept';
    next.difficulty = 'beginner';
    next.data = {
      concept: 'Assets = Liabilities + Equity',
      explanation: 'Every transaction affects at least two accounts and keeps the accounting equation balanced.',
      example: 'If Choolwe starts a business with K5,000 cash, Cash increases and Capital increases by the same amount.',
    };
  }

  if (template === 'Transaction scenario') {
    next.accountingType = 'transaction';
    next.difficulty = 'beginner';
    next.data = {
      currency: 'ZMW',
      businessName: 'Muloongo Traders',
      transactionDate: '2026-01-05',
      description: 'Started business with K10,000 cash.',
      amount: 10000,
      expectedAccounts: ['Cash', 'Capital'],
    };
  }

  if (template === 'Journal entry practice') {
    next.accountingType = 'journal_entry';
    next.difficulty = 'beginner';
    next.data = {
      currency: 'ZMW',
      question: 'Record the purchase of goods for cash, K2,000.',
      rows: [
        { account: 'Purchases', debit: 2000, credit: 0 },
        { account: 'Cash', debit: 0, credit: 2000 },
      ],
      narration: 'Being goods purchased for cash.',
    };
    next.expectedAnswer = { rows: next.data.rows };
  }

  if (template === 'Ledger posting practice') {
    next.accountingType = 'ledger';
    next.difficulty = 'beginner';
    next.data = {
      currency: 'ZMW',
      accountName: 'Cash Account',
      debitEntries: [{ date: '2026-01-05', details: 'Capital', amount: 10000 }],
      creditEntries: [{ date: '2026-01-08', details: 'Purchases', amount: 2000 }],
    };
  }

  if (template === 'Trial balance builder') {
    next.accountingType = 'trial_balance';
    next.difficulty = 'beginner';
    next.data = {
      currency: 'ZMW',
      title: 'Trial Balance as at 31 January 2026',
      accounts: [
        { name: 'Cash', debit: 8000, credit: 0 },
        { name: 'Purchases', debit: 2000, credit: 0 },
        { name: 'Capital', debit: 0, credit: 10000 },
      ],
    };
  }

  if (template === 'Income statement builder') {
    next.accountingType = 'financial_statement';
    next.difficulty = 'intermediate';
    next.data = {
      currency: 'ZMW',
      statementType: 'income_statement',
      businessName: 'Muloongo Traders',
      period: 'Month ended 31 January 2026',
      sections: [
        { title: 'Revenue', items: [{ name: 'Sales', amount: 25000 }] },
        { title: 'Expenses', items: [{ name: 'Rent', amount: 3000 }, { name: 'Wages', amount: 5000 }] },
      ],
    };
  }

  if (template === 'Statement of financial position builder') {
    next.accountingType = 'financial_statement';
    next.difficulty = 'intermediate';
    next.data = {
      currency: 'ZMW',
      statementType: 'statement_of_financial_position',
      businessName: 'Muloongo Traders',
      period: 'As at 31 January 2026',
      sections: [
        { title: 'Assets', items: [{ name: 'Cash', amount: 8000 }, { name: 'Inventory', amount: 3000 }] },
        { title: 'Equity and Liabilities', items: [{ name: 'Capital', amount: 10000 }, { name: 'Profit', amount: 1000 }] },
      ],
    };
  }

  if (template === 'Bank reconciliation') {
    next.accountingType = 'bank_reconciliation';
    next.difficulty = 'intermediate';
    next.data = { currency: 'ZMW', cashBookBalance: 8200, bankStatementBalance: 9500, additions: [{ label: 'Direct deposit', amount: 1200 }], deductions: [{ label: 'Bank charges', amount: 300 }], uncreditedDeposits: [{ amount: 1000 }], unpresentedCheques: [{ amount: 1400 }] };
  }

  if (template === 'Depreciation schedule') {
    next.accountingType = 'depreciation';
    next.difficulty = 'intermediate';
    next.data = { currency: 'ZMW', asset: 'Motor Vehicle', cost: 50000, residualValue: 5000, usefulLifeYears: 5, method: 'straight_line' };
  }

  if (template === 'Inventory valuation') {
    next.accountingType = 'inventory';
    next.difficulty = 'intermediate';
    next.data = { currency: 'ZMW', method: 'FIFO', transactions: [{ type: 'purchase', units: 100, unitCost: 20 }, { type: 'purchase', units: 50, unitCost: 25 }, { type: 'sale', units: 120 }] };
  }

  if (template === 'Error correction') {
    next.accountingType = 'error_correction';
    next.difficulty = 'intermediate';
    next.data = { currency: 'ZMW', errorDescription: 'Rent paid K2,000 was recorded as debit Repairs account.', correctionRows: [{ account: 'Rent Expense', debit: 2000, credit: 0 }, { account: 'Repairs', debit: 0, credit: 2000 }] };
    next.expectedAnswer = { rows: next.data.correctionRows };
  }

  if (template === 'Ratio analysis') {
    next.accountingType = 'ratio_analysis';
    next.difficulty = 'advanced';
    next.data = { financialData: { currentAssets: 50000, inventory: 10000, currentLiabilities: 25000, revenue: 120000, grossProfit: 65000, netProfit: 30000 }, requiredRatios: ['current_ratio', 'quick_ratio'] };
  }

  if (template === 'Full accounting cycle simulation') {
    next.accountingType = 'business_simulation';
    next.difficulty = 'intermediate';
    next.data = {
      currency: 'ZMW',
      businessName: 'Copperbelt Stationery Supplies',
      transactions: ['1 Jan: Started business with K20,000 cash.', '2 Jan: Bought goods for resale, K5,000 cash.', '3 Jan: Sold goods for K3,000 cash. Cost of goods sold was K1,800.', '4 Jan: Paid rent K1,000.', '5 Jan: Bought office furniture on credit, K4,000.'],
      stages: ['Record journals', 'Post ledgers', 'Prepare trial balance', 'Make adjustments', 'Prepare income statement', 'Prepare statement of financial position', 'Interpret profit and cash position'],
    };
  }

  if (template === 'Partnership accounts case') {
    next.accountingType = 'case_study';
    next.difficulty = 'intermediate';
    next.data = { businessName: 'Muloongo & Banda Partners', scenario: 'Partners share profits 3:2. Net profit is K50,000. Interest on capital and drawings must be adjusted before appropriation.', required: ['Prepare profit appropriation account', 'Prepare partner current accounts', 'Explain the profit-sharing treatment'] };
  }

  if (template === 'Company accounts case') {
    next.accountingType = 'financial_statement';
    next.difficulty = 'advanced';
    next.data = { currency: 'ZMW', statementType: 'company_accounts', businessName: 'UnivAI Limited', period: 'Year ended 31 December 2026', sections: [{ title: 'Equity', items: [{ name: 'Share capital', amount: 100000 }, { name: 'Retained earnings', amount: 35000 }] }, { title: 'Distributions', items: [{ name: 'Dividends', amount: 10000 }] }] };
  }

  if (template === 'Cash flow statement case') {
    next.accountingType = 'cash_flow_statement';
    next.difficulty = 'advanced';
    next.data = { currency: 'ZMW', statementType: 'cash_flow_statement', businessName: 'Muloongo Traders', period: 'Year ended 31 December 2026', sections: [{ title: 'Operating activities', items: [{ name: 'Cash generated from operations', amount: 45000 }] }, { title: 'Investing activities', items: [{ name: 'Purchase of equipment', amount: -20000 }] }, { title: 'Financing activities', items: [{ name: 'Loan received', amount: 15000 }] }] };
  }

  if (template === 'Consolidation case') {
    next.accountingType = 'consolidation';
    next.difficulty = 'advanced';
    next.data = { currency: 'ZMW', statementType: 'group_accounts', businessName: 'Parent Group', period: 'Year ended 31 December 2026', scenario: 'Parent acquired 80% of Subsidiary. Goodwill, non-controlling interest, and intra-group sales must be considered.', sections: [{ title: 'Group assets', items: [{ name: 'Parent assets', amount: 300000 }, { name: 'Subsidiary assets', amount: 120000 }, { name: 'Goodwill', amount: 25000 }] }, { title: 'Group equity and liabilities', items: [{ name: 'Parent equity', amount: 250000 }, { name: 'NCI', amount: 24000 }, { name: 'Liabilities', amount: 171000 }] }] };
  }

  if (template === 'IFRS treatment case') {
    next.accountingType = 'ifrs_treatment';
    next.difficulty = 'professional';
    next.data = { caseTitle: 'IFRS treatment: lease contract', scenario: 'A company signs a 5-year lease for production equipment. Payments are fixed and ownership does not transfer automatically.', required: ['Identify the relevant IFRS issue', 'Explain recognition and measurement', 'State presentation and disclosure points', 'Give journal entries where necessary'] };
  }

  if (template === 'Audit risk case') {
    next.accountingType = 'audit_risk';
    next.difficulty = 'professional';
    next.data = { businessName: 'Muloongo Traders', scenario: 'The business has weak cash controls, missing receipt numbers, and one person recording and banking cash.', required: ['Identify audit risks', 'Recommend controls', 'Explain governance impact'] };
  }

  if (template === 'Tax computation case') {
    next.accountingType = 'tax_computation';
    next.difficulty = 'professional';
    next.data = { caseTitle: 'Tax computation case', scenario: 'A business has accounting profit of K180,000, disallowable expenses of K20,000, capital allowances of K35,000, and withholding tax credits of K5,000.', required: ['Compute taxable profit', 'Compute tax payable', 'Explain the treatment of disallowable expenses and capital allowances'] };
  }

  if (template === 'Budgeting case') {
    next.accountingType = 'budgeting';
    next.difficulty = 'advanced';
    next.data = { caseTitle: 'Cash budget preparation', scenario: 'Prepare a three-month cash budget using expected receipts, purchases, rent, salaries, and loan repayment.', required: ['Prepare monthly cash budget', 'Identify cash deficit months', 'Recommend financing action'] };
  }

  if (template === 'Variance analysis case') {
    next.accountingType = 'variance_analysis';
    next.difficulty = 'advanced';
    next.data = { caseTitle: 'Variance analysis', scenario: 'Actual material cost and labour cost differ from standard cost. Management wants performance interpretation.', required: ['Calculate material price variance', 'Calculate labour rate variance', 'Explain whether each variance is favourable or adverse'] };
  }

  if (template === 'Professional exam case') {
    next.accountingType = 'exam_practice';
    next.difficulty = 'professional';
    next.data = { caseTitle: 'Professional reporting case', scenario: 'A listed company has revenue recognition, lease, impairment, and provision issues in one reporting period.', required: ['Discuss accounting treatment', 'Prepare correcting journals', 'Draft report extracts', 'Apply professional judgment'] };
    next.markingScheme = { totalMarks: 20, items: [{ description: 'Correct issue identification', marks: 4 }, { description: 'Correct accounting treatment', marks: 6 }, { description: 'Journal entries and calculations', marks: 5 }, { description: 'Professional explanation and presentation', marks: 5 }] };
  }

  if (template === 'Research critique case') {
    next.accountingType = 'research_case';
    next.difficulty = 'phd';
    next.data = { caseTitle: 'Accounting research critique', scenario: 'A paper claims fair value accounting improves decision usefulness in emerging markets, but the sample excludes illiquid firms.', required: ['Identify the accounting theory position', 'Critique the research design', 'Discuss measurement validity', 'Suggest a stronger methodology', 'State the contribution and limitations'] };
  }

  return { ...base, accountingStudioDraftJson: undefined, accountingStudioExpectedDraftJson: undefined, accountingStudioMarkingDraftJson: undefined, content: next };
}
