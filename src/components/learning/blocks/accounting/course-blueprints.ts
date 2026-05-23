export type AccountingCourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional' | 'phd';

export type AccountingTemplateKind =
  | 'basic_transaction_practice'
  | 'full_accounting_cycle'
  | 'bank_reconciliation'
  | 'depreciation_schedule'
  | 'inventory_valuation'
  | 'partnership_accounts'
  | 'company_accounts'
  | 'management_accounting'
  | 'financial_analysis'
  | 'audit_case_study'
  | 'ifrs_treatment'
  | 'research_critique'
  | 'theory_comparison'
  | 'literature_gap_analysis'
  | 'hypothesis_builder'
  | 'methodology_design'
  | 'empirical_model'
  | 'variable_measurement'
  | 'doctoral_proposal';

export const accountingCourseLevels: Record<AccountingCourseLevel, { label: string; purpose: string; modules: string[]; cardPattern: string[] }> = {
  beginner: {
    label: 'Beginner Accounting',
    purpose: 'Teach a learner who knows nothing to understand accounting language, the equation, double entry, journals, ledgers, trial balance, and simple statements.',
    modules: [
      'Meaning and purpose of accounting',
      'Users of accounting information',
      'Assets, liabilities, equity, income, and expenses',
      'The accounting equation',
      'Debit and credit rules',
      'Source documents',
      'Books of original entry',
      'Ledger accounts and T-accounts',
      'Trial balance',
      'Simple income statement and statement of financial position',
    ],
    cardPattern: ['concept', 'transaction', 'journal_entry', 'ledger', 'trial_balance', 'financial_statement', 'exam_practice', 'marking_scheme'],
  },
  intermediate: {
    label: 'Intermediate Accounting',
    purpose: 'Build exam strength through full practical accounts, adjustments, controls, reconciliations, and error correction.',
    modules: [
      'Purchases, sales, and returns',
      'Discounts allowed and received',
      'Cash book and petty cash book',
      'Bank reconciliation',
      'Control accounts',
      'Depreciation',
      'Accruals and prepayments',
      'Bad debts and allowances',
      'Inventory valuation',
      'Manufacturing accounts',
      'Partnership accounts',
      'Incomplete records',
      'Suspense accounts and correction of errors',
    ],
    cardPattern: ['case_study', 'journal_entry', 'ledger', 'trial_balance', 'bank_reconciliation', 'depreciation', 'inventory', 'error_correction', 'exam_practice'],
  },
  advanced: {
    label: 'Advanced Accounting',
    purpose: 'Prepare university learners for financial reporting, analysis, corporate reporting, cash flows, groups, tax, audit, and management accounting.',
    modules: [
      'Conceptual framework',
      'IFRS principles',
      'Financial statement preparation',
      'Revenue recognition',
      'Leases',
      'Provisions and contingencies',
      'Financial instruments basics',
      'Group accounts and consolidation',
      'Cash flow statements',
      'Ratio analysis and interpretation',
      'Corporate reporting',
      'Tax basics',
      'Audit basics',
      'Costing, budgeting, and variance analysis',
    ],
    cardPattern: ['ifrs_treatment', 'case_study', 'financial_statement', 'ratio_analysis', 'cash_flow_statement', 'consolidation', 'budgeting', 'variance_analysis', 'exam_practice'],
  },
  professional: {
    label: 'Professional / ACCA-style Accounting',
    purpose: 'Train learners through long cases, professional judgment, report writing, spreadsheet-style calculations, audit reasoning, tax treatment, and strategic reporting.',
    modules: [
      'Financial Accounting',
      'Management Accounting',
      'Financial Reporting',
      'Audit and Assurance',
      'Taxation',
      'Performance Management',
      'Financial Management',
      'Strategic Business Reporting',
      'Advanced Audit',
      'Advanced Tax',
      'Ethics and governance',
    ],
    cardPattern: ['case_study', 'ifrs_treatment', 'audit_risk', 'tax_computation', 'financial_statement', 'ratio_analysis', 'exam_practice', 'marking_scheme'],
  },
  phd: {
    label: 'PhD / Research Accounting',
    purpose: 'Support doctoral-level critique, theory comparison, empirical research design, accounting policy debate, literature review, variable measurement, and proposal defense.',
    modules: [
      'Accounting theory and measurement debates',
      'Positive accounting theory and agency theory',
      'Capital markets accounting research',
      'Earnings management and disclosure quality',
      'Fair value measurement debates',
      'Sustainability and integrated reporting',
      'Public sector accountability',
      'Audit quality research',
      'Forensic and data-driven accounting research',
      'Research methodology and literature critique',
      'Hypothesis construction and empirical model design',
      'Variable measurement, validity, reliability, bias, and endogeneity',
      'Doctoral proposal defense and contribution to knowledge',
    ],
    cardPattern: ['research_article_critique', 'theory_comparison', 'literature_gap_analysis', 'hypothesis_builder', 'methodology_design', 'empirical_model', 'variable_measurement', 'doctoral_proposal', 'marking_scheme'],
  },
};

export const accountingTemplateKinds: { kind: AccountingTemplateKind; label: string; level: AccountingCourseLevel; accountingType: string; description: string }[] = [
  { kind: 'basic_transaction_practice', label: 'Basic transaction practice', level: 'beginner', accountingType: 'journal_entry', description: 'Debit and credit practice from simple business events.' },
  { kind: 'full_accounting_cycle', label: 'Full accounting cycle', level: 'intermediate', accountingType: 'business_simulation', description: 'Transactions through journals, ledgers, trial balance, adjustments, statements, and analysis.' },
  { kind: 'bank_reconciliation', label: 'Bank reconciliation', level: 'intermediate', accountingType: 'bank_reconciliation', description: 'Cash book and bank statement reconciliation workflow.' },
  { kind: 'depreciation_schedule', label: 'Depreciation schedule', level: 'intermediate', accountingType: 'depreciation', description: 'Straight-line, reducing balance, and units-of-production depreciation.' },
  { kind: 'inventory_valuation', label: 'Inventory valuation', level: 'advanced', accountingType: 'inventory', description: 'FIFO and weighted average inventory valuation.' },
  { kind: 'partnership_accounts', label: 'Partnership accounts', level: 'intermediate', accountingType: 'case_study', description: 'Profit sharing, capital accounts, current accounts, and appropriations.' },
  { kind: 'company_accounts', label: 'Company accounts', level: 'advanced', accountingType: 'financial_statement', description: 'Share capital, dividends, retained earnings, and corporate reporting.' },
  { kind: 'management_accounting', label: 'Management accounting', level: 'advanced', accountingType: 'variance_analysis', description: 'Cost cards, budgets, standard costing, and variance analysis.' },
  { kind: 'financial_analysis', label: 'Financial analysis', level: 'advanced', accountingType: 'ratio_analysis', description: 'Ratio calculation, interpretation, and business recommendations.' },
  { kind: 'audit_case_study', label: 'Audit case study', level: 'professional', accountingType: 'audit_risk', description: 'Audit risks, controls, recommendations, and professional skepticism.' },
  { kind: 'ifrs_treatment', label: 'IFRS treatment', level: 'professional', accountingType: 'ifrs_treatment', description: 'Recognition, measurement, presentation, disclosure, and judgment.' },
  { kind: 'research_critique', label: 'Research critique', level: 'phd', accountingType: 'research_case', description: 'Theory, literature gaps, methodology, variables, and contribution critique.' },
  { kind: 'theory_comparison', label: 'Theory comparison', level: 'phd', accountingType: 'theory_comparison', description: 'Compare agency, stakeholder, legitimacy, institutional, and decision-usefulness theories.' },
  { kind: 'literature_gap_analysis', label: 'Literature gap analysis', level: 'phd', accountingType: 'literature_gap_analysis', description: 'Identify literature gaps, unresolved debates, and contribution claims.' },
  { kind: 'hypothesis_builder', label: 'Hypothesis builder', level: 'phd', accountingType: 'hypothesis_builder', description: 'Convert theory and gap into research questions and testable hypotheses.' },
  { kind: 'methodology_design', label: 'Methodology design', level: 'phd', accountingType: 'methodology_design', description: 'Design sample, data, model, method, robustness, and validity strategy.' },
  { kind: 'empirical_model', label: 'Empirical model', level: 'phd', accountingType: 'empirical_model', description: 'Define dependent variables, independent variables, controls, model, and interpretation.' },
  { kind: 'variable_measurement', label: 'Variable measurement', level: 'phd', accountingType: 'variable_measurement', description: 'Define constructs, proxies, measurement quality, validity, and reliability.' },
  { kind: 'doctoral_proposal', label: 'Doctoral proposal defense', level: 'phd', accountingType: 'doctoral_proposal', description: 'Prepare a doctoral proposal with theory, gap, method, evidence, limitations, ethics, and contribution.' },
];

export const accountingLessonPattern = [
  'business scenario',
  'concept explanation',
  'account effect',
  'journal entry',
  'ledger posting',
  'student attempt',
  'instant correction',
  'exam question',
  'marking scheme',
];

export const phdAccountingLessonPattern = [
  'research problem and accounting context',
  'theoretical lens',
  'literature gap',
  'research questions or hypotheses',
  'methodology and data strategy',
  'variable measurement',
  'validity and bias critique',
  'evidence-based argument',
  'limitations and ethics',
  'doctoral marking rubric',
];
