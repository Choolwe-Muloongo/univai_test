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
  'Theory comparison case',
  'Literature gap analysis',
  'Hypothesis builder',
  'Methodology design',
  'Empirical model builder',
  'Variable measurement case',
  'Doctoral proposal defense',
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
      standardFramework: 'IFRS for SMEs',
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
      standardFramework: 'IFRS for SMEs',
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
    next.expectedAnswer = { adjustedCashBookBalance: 9100, adjustedBankStatementBalance: 9100 };
  }

  if (template === 'Depreciation schedule') {
    next.accountingType = 'depreciation';
    next.difficulty = 'intermediate';
    next.data = { currency: 'ZMW', asset: 'Motor Vehicle', cost: 50000, residualValue: 5000, usefulLifeYears: 5, method: 'straight_line' };
    next.expectedAnswer = { result: 9000 };
  }

  if (template === 'Inventory valuation') {
    next.accountingType = 'inventory';
    next.difficulty = 'intermediate';
    next.data = { currency: 'ZMW', method: 'FIFO', transactions: [{ type: 'purchase', units: 100, unitCost: 20 }, { type: 'purchase', units: 50, unitCost: 25 }, { type: 'sale', units: 120 }] };
    next.expectedAnswer = { cogs: 2500, closingInventory: 750 };
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
    next.data = { financialData: { currentAssets: 50000, inventory: 10000, currentLiabilities: 25000, revenue: 120000, grossProfit: 65000, netProfit: 30000, totalAssets: 150000, equity: 80000, totalLiabilities: 70000 }, requiredRatios: ['current_ratio', 'quick_ratio', 'gross_profit_margin', 'net_profit_margin', 'return_on_assets', 'debt_to_equity'] };
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
    next.data = { currency: 'ZMW', standardFramework: 'IFRS', statementType: 'company_accounts', businessName: 'UnivAI Limited', period: 'Year ended 31 December 2026', sections: [{ title: 'Equity', items: [{ name: 'Share capital', amount: 100000 }, { name: 'Retained earnings', amount: 35000 }] }, { title: 'Distributions', items: [{ name: 'Dividends', amount: 10000 }] }] };
  }

  if (template === 'Cash flow statement case') {
    next.accountingType = 'cash_flow_statement';
    next.difficulty = 'advanced';
    next.data = { currency: 'ZMW', standardFramework: 'IFRS', statementType: 'cash_flow_statement', businessName: 'Muloongo Traders', period: 'Year ended 31 December 2026', sections: [{ title: 'Operating activities', items: [{ name: 'Cash generated from operations', amount: 45000 }] }, { title: 'Investing activities', items: [{ name: 'Purchase of equipment', amount: -20000 }] }, { title: 'Financing activities', items: [{ name: 'Loan received', amount: 15000 }] }] };
  }

  if (template === 'Consolidation case') {
    next.accountingType = 'consolidation';
    next.difficulty = 'advanced';
    next.data = { currency: 'ZMW', standardFramework: 'IFRS', statementType: 'group_accounts', businessName: 'Parent Group', period: 'Year ended 31 December 2026', scenario: 'Parent acquired 80% of Subsidiary. Goodwill, non-controlling interest, and intra-group sales must be considered.', sections: [{ title: 'Group assets', items: [{ name: 'Parent assets', amount: 300000 }, { name: 'Subsidiary assets', amount: 120000 }, { name: 'Goodwill', amount: 25000 }] }, { title: 'Group equity and liabilities', items: [{ name: 'Parent equity', amount: 250000 }, { name: 'NCI', amount: 24000 }, { name: 'Liabilities', amount: 171000 }] }] };
  }

  if (template === 'IFRS treatment case') {
    next.accountingType = 'ifrs_treatment';
    next.difficulty = 'professional';
    next.data = { standardFramework: 'IFRS', evidenceStandard: 'Professional judgement supported by recognition, measurement, presentation, and disclosure reasoning.', caseTitle: 'IFRS treatment: lease contract', scenario: 'A company signs a 5-year lease for production equipment. Payments are fixed and ownership does not transfer automatically.', required: ['Identify the relevant IFRS issue', 'Explain recognition and measurement', 'State presentation and disclosure points', 'Give journal entries where necessary'] };
    next.markingScheme = professionalRubric(20);
  }

  if (template === 'Audit risk case') {
    next.accountingType = 'audit_risk';
    next.difficulty = 'professional';
    next.data = { evidenceStandard: 'Professional skepticism with risk, assertion, control, procedure, and evidence linkage.', businessName: 'Muloongo Traders', scenario: 'The business has weak cash controls, missing receipt numbers, and one person recording and banking cash.', required: ['Identify audit risks', 'Link each risk to an assertion', 'Recommend controls', 'Explain governance impact'] };
    next.markingScheme = professionalRubric(20);
  }

  if (template === 'Tax computation case') {
    next.accountingType = 'tax_computation';
    next.difficulty = 'professional';
    next.data = { jurisdiction: 'Zambia', taxYear: '2026', evidenceStandard: 'Computation supported by tax treatment explanation and jurisdiction-specific assumptions.', caseTitle: 'Tax computation case', scenario: 'A business has accounting profit of K180,000, disallowable expenses of K20,000, capital allowances of K35,000, and withholding tax credits of K5,000.', required: ['Compute taxable profit', 'Compute tax payable', 'Explain the treatment of disallowable expenses and capital allowances'] };
    next.markingScheme = professionalRubric(20);
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
    next.data = { evidenceStandard: 'Professional exam answer with issue identification, calculations, judgement, and conclusion.', caseTitle: 'Professional reporting case', scenario: 'A listed company has revenue recognition, lease, impairment, and provision issues in one reporting period.', required: ['Discuss accounting treatment', 'Prepare correcting journals', 'Draft report extracts', 'Apply professional judgment'] };
    next.markingScheme = { totalMarks: 20, items: [{ description: 'Correct issue identification', marks: 4, keywords: ['issue', 'recognition'] }, { description: 'Correct accounting treatment', marks: 6, keywords: ['measurement', 'presentation'] }, { description: 'Journal entries and calculations', marks: 5, keywords: ['journal', 'calculation'] }, { description: 'Professional explanation and presentation', marks: 5, keywords: ['judgement', 'conclusion'] }] };
  }

  if (template === 'Research critique case') applyDoctoralTemplate(next, 'research_case');
  if (template === 'Theory comparison case') applyDoctoralTemplate(next, 'theory_comparison');
  if (template === 'Literature gap analysis') applyDoctoralTemplate(next, 'literature_gap_analysis');
  if (template === 'Hypothesis builder') applyDoctoralTemplate(next, 'hypothesis_builder');
  if (template === 'Methodology design') applyDoctoralTemplate(next, 'methodology_design');
  if (template === 'Empirical model builder') applyDoctoralTemplate(next, 'empirical_model');
  if (template === 'Variable measurement case') applyDoctoralTemplate(next, 'variable_measurement');
  if (template === 'Doctoral proposal defense') applyDoctoralTemplate(next, 'doctoral_proposal');

  return { ...base, accountingStudioDraftJson: undefined, accountingStudioExpectedDraftJson: undefined, accountingStudioMarkingDraftJson: undefined, content: next };
}

function professionalRubric(totalMarks: number) {
  return {
    totalMarks,
    items: [
      { description: 'Correct issue identification', marks: 4, keywords: ['issue', 'risk', 'standard'] },
      { description: 'Correct technical treatment', marks: 6, keywords: ['recognition', 'measurement', 'calculation'] },
      { description: 'Evidence and professional judgement', marks: 5, keywords: ['evidence', 'judgement', 'assumption'] },
      { description: 'Clear conclusion and presentation', marks: 5, keywords: ['conclusion', 'recommendation', 'presentation'] },
    ],
  };
}

function doctoralRubric() {
  return {
    totalMarks: 30,
    items: [
      { description: 'Research problem and accounting context', marks: 3, keywords: ['problem', 'context'] },
      { description: 'Theory and theoretical lens', marks: 4, keywords: ['theory', 'theoretical', 'agency', 'stakeholder'] },
      { description: 'Literature gap and contribution', marks: 4, keywords: ['literature', 'gap', 'contribution'] },
      { description: 'Research questions or hypotheses', marks: 3, keywords: ['research question', 'hypothesis'] },
      { description: 'Methodology and data strategy', marks: 4, keywords: ['methodology', 'sample', 'data'] },
      { description: 'Variable measurement and construct validity', marks: 4, keywords: ['variable', 'measurement', 'construct', 'validity'] },
      { description: 'Threats, limitations, ethics, and robustness', marks: 4, keywords: ['endogeneity', 'bias', 'limitations', 'ethics', 'robustness'] },
      { description: 'Evidence-based argument and doctoral conclusion', marks: 4, keywords: ['evidence', 'argument', 'conclusion'] },
    ],
  };
}

function applyDoctoralTemplate(next: ReturnType<typeof getAccountingContent>, type: typeof next.accountingType) {
  next.accountingType = type;
  next.difficulty = 'phd';
  next.data = {
    caseTitle: 'Doctoral accounting research studio: fair value reporting in emerging markets',
    researchProblem: 'Whether fair value accounting improves decision usefulness in emerging markets where active markets are thin and measurement uncertainty is high.',
    scenario: 'A doctoral candidate is reviewing a paper claiming that fair value measurement improves investor decision usefulness. The sample excludes illiquid firms, uses one-year returns only, and does not address endogeneity between disclosure quality and market liquidity.',
    theory: 'Agency theory, measurement theory, and decision-usefulness theory provide competing explanations for why fair value information may or may not improve reporting quality.',
    theoreticalLens: ['Agency theory', 'Decision-usefulness theory', 'Measurement uncertainty', 'Institutional theory for emerging markets'],
    literatureGap: 'Prior literature often studies liquid markets, but the gap is how fair value reliability changes when markets are thin, enforcement is uneven, and valuation inputs are unobservable.',
    contribution: 'The proposed study contributes by connecting fair value hierarchy reliability, emerging-market institutional quality, and investor response.',
    researchQuestions: ['RQ1: How does fair value hierarchy level affect value relevance in emerging markets?', 'RQ2: Does audit quality moderate the association between fair value estimates and market response?'],
    hypotheses: ['H1: Level 1 fair value estimates are more value relevant than Level 3 estimates.', 'H2: Audit quality strengthens the value relevance of fair value estimates.'],
    methodology: ['Panel regression using listed firms over five years', 'Firm and year fixed effects', 'Robustness checks for alternative fair value proxies', 'Sensitivity analysis excluding financial institutions'],
    variables: ['Dependent variable: share price or market-adjusted return', 'Independent variable: fair value exposure by hierarchy level', 'Moderator: audit quality proxy', 'Controls: size, leverage, profitability, growth, industry, year'],
    validityThreats: ['Endogeneity between reporting quality and liquidity', 'Measurement error in fair value proxies', 'Sample selection bias from excluding illiquid firms', 'Omitted institutional enforcement variables'],
    limitations: ['Limited data availability', 'Proxy measurement constraints', 'Generalizability beyond sampled markets', 'Ethical handling of firm-level financial data'],
    evidenceStandard: 'Doctoral response must use theory, literature gap, methodology, variable measurement, validity threats, evidence-based argument, limitations, and contribution.',
    required: ['State the research problem and accounting context', 'Compare the theoretical lens options', 'Identify the literature gap and contribution', 'Write research questions or hypotheses', 'Design the methodology and data strategy', 'Define variables and measurement proxies', 'Critique validity, reliability, endogeneity, bias, limitations, and ethics', 'Conclude with an evidence-based doctoral argument'],
    expectedKeywords: ['theory', 'literature', 'gap', 'methodology', 'variable', 'measurement', 'validity', 'endogeneity', 'bias', 'evidence', 'contribution', 'limitations', 'ethics'],
  };
  next.expectedAnswer = { keywords: next.data.expectedKeywords };
  next.markingScheme = doctoralRubric();
}
