import type { BlockAutoMarkResult, LearningBlockPayload } from '../schemas';

export type AccountingDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'professional' | 'phd';

export type AccountingCardType =
  | 'concept'
  | 'transaction'
  | 'journal_entry'
  | 'ledger'
  | 'trial_balance'
  | 'financial_statement'
  | 'bank_reconciliation'
  | 'depreciation'
  | 'inventory'
  | 'ratio_analysis'
  | 'error_correction'
  | 'case_study'
  | 'exam_practice'
  | 'marking_scheme'
  | 'business_simulation'
  | 'consolidation'
  | 'cash_flow_statement'
  | 'ifrs_treatment'
  | 'audit_risk'
  | 'tax_computation'
  | 'budgeting'
  | 'variance_analysis'
  | 'research_case'
  | 'research_article_critique'
  | 'theory_comparison'
  | 'literature_gap_analysis'
  | 'hypothesis_builder'
  | 'methodology_design'
  | 'empirical_model'
  | 'variable_measurement'
  | 'doctoral_proposal';

export type NormalBalance = 'debit' | 'credit';

export type AccountCategory =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'income'
  | 'expense'
  | 'contra_asset'
  | 'contra_income'
  | 'contra_expense';

export type JournalRow = {
  account: string;
  debit?: number;
  credit?: number;
  narration?: string;
};

export type LedgerEntry = {
  date?: string;
  details: string;
  amount: number;
};

export type TrialBalanceAccount = {
  name: string;
  debit?: number;
  credit?: number;
};

export type StatementSection = {
  title: string;
  items: { name: string; amount: number }[];
};

export type AccountingMarkingScheme = {
  totalMarks: number;
  items: { description: string; marks: number; keywords?: string[] }[];
};

export type AccountingCardContent = {
  accountingType: AccountingCardType;
  difficulty: AccountingDifficulty;
  data: Record<string, unknown>;
  expectedAnswer?: Record<string, unknown>;
  markingScheme?: AccountingMarkingScheme;
};

export type AccountingMistakeType =
  | 'wrong_debit_account'
  | 'wrong_credit_account'
  | 'debit_credit_reversed'
  | 'amount_mismatch'
  | 'unbalanced_entry'
  | 'wrong_account_classification'
  | 'missing_narration'
  | 'wrong_statement_section'
  | 'incorrect_adjustment'
  | 'wrong_formula'
  | 'weak_professional_judgment'
  | 'weak_research_gap'
  | 'weak_methodology'
  | 'formatting_error';

export type AccountingReadinessReview = {
  score: number;
  rating: 'foundation' | 'teaching_ready' | 'professional_ready' | 'phd_ready';
  strengths: string[];
  issues: string[];
  requiredUpgrades: string[];
};

const allowedAccountingTypes: AccountingCardType[] = [
  'concept', 'transaction', 'journal_entry', 'ledger', 'trial_balance', 'financial_statement',
  'bank_reconciliation', 'depreciation', 'inventory', 'ratio_analysis', 'error_correction',
  'case_study', 'exam_practice', 'marking_scheme', 'business_simulation', 'consolidation',
  'cash_flow_statement', 'ifrs_treatment', 'audit_risk', 'tax_computation', 'budgeting',
  'variance_analysis', 'research_case', 'research_article_critique', 'theory_comparison',
  'literature_gap_analysis', 'hypothesis_builder', 'methodology_design', 'empirical_model',
  'variable_measurement', 'doctoral_proposal',
];

const phdAccountingTypes: AccountingCardType[] = [
  'research_case', 'research_article_critique', 'theory_comparison', 'literature_gap_analysis',
  'hypothesis_builder', 'methodology_design', 'empirical_model', 'variable_measurement', 'doctoral_proposal',
];

export const chartOfAccounts = [
  { name: 'Cash', category: 'asset', normalBalance: 'debit' },
  { name: 'Bank', category: 'asset', normalBalance: 'debit' },
  { name: 'Inventory', category: 'asset', normalBalance: 'debit' },
  { name: 'Accounts Receivable', category: 'asset', normalBalance: 'debit' },
  { name: 'Equipment', category: 'asset', normalBalance: 'debit' },
  { name: 'Motor Vehicle', category: 'asset', normalBalance: 'debit' },
  { name: 'Accumulated Depreciation', category: 'contra_asset', normalBalance: 'credit' },
  { name: 'Accounts Payable', category: 'liability', normalBalance: 'credit' },
  { name: 'Loan Payable', category: 'liability', normalBalance: 'credit' },
  { name: 'Capital', category: 'equity', normalBalance: 'credit' },
  { name: 'Drawings', category: 'equity', normalBalance: 'debit' },
  { name: 'Sales Revenue', category: 'income', normalBalance: 'credit' },
  { name: 'Sales Returns', category: 'contra_income', normalBalance: 'debit' },
  { name: 'Purchases', category: 'expense', normalBalance: 'debit' },
  { name: 'Rent Expense', category: 'expense', normalBalance: 'debit' },
  { name: 'Wages Expense', category: 'expense', normalBalance: 'debit' },
  { name: 'Depreciation Expense', category: 'expense', normalBalance: 'debit' },
] as const satisfies { name: string; category: AccountCategory; normalBalance: NormalBalance }[];

export const phdReadinessChecklist = [
  'Clear research problem and accounting context',
  'Explicit theory or theoretical lens',
  'Literature gap and contribution claim',
  'Research questions or hypotheses',
  'Methodology and data strategy',
  'Construct/variable measurement logic',
  'Validity, reliability, endogeneity, or bias threats',
  'Evidence-based critique or expected findings',
  'Limitations and ethical considerations',
  'Doctoral marking rubric',
] as const;

export function getAccountingContent(payload: LearningBlockPayload): AccountingCardContent {
  const content = isRecord(payload.content) ? payload.content : {};
  return {
    accountingType: normalizeAccountingType(content.accountingType ?? payload.accountingType),
    difficulty: normalizeDifficulty(content.difficulty ?? payload.difficulty),
    data: isRecord(content.data) ? content.data : collectLegacyData(payload),
    expectedAnswer: isRecord(content.expectedAnswer) ? content.expectedAnswer : isRecord(payload.expectedAnswer) ? payload.expectedAnswer : undefined,
    markingScheme: isMarkingScheme(content.markingScheme) ? content.markingScheme : isMarkingScheme(payload.markingScheme) ? payload.markingScheme : undefined,
  };
}

export function validateAccountingPayload(payload: LearningBlockPayload) {
  const issues: string[] = [];
  const content = getAccountingContent(payload);
  if (!content.accountingType) issues.push('Accounting card type is required.');
  if (!content.data || Object.keys(content.data).length === 0) issues.push('Accounting card data is required.');

  validateRenderableStructure(content, issues);
  validateAcademicDepth(content, issues);
  validateProfessionalMetadata(content, issues);

  return { valid: issues.length === 0, issues };
}

export function reviewAccountingPhdReadiness(payloads: LearningBlockPayload[]): AccountingReadinessReview {
  const strengths: string[] = [];
  const issues: string[] = [];
  const requiredUpgrades: string[] = [];
  const contents = payloads.map(getAccountingContent);
  const phdCards = contents.filter((content) => content.difficulty === 'phd' || phdAccountingTypes.includes(content.accountingType));
  const covered = new Set<string>();

  for (const content of phdCards) {
    const text = searchableText(content);
    for (const item of phdReadinessChecklist) {
      if (matchesChecklist(text, item)) covered.add(item);
    }
  }

  if (!phdCards.length) issues.push('No PhD-level accounting research cards found.');
  if (phdCards.length >= 5) strengths.push('Multiple PhD-level accounting research cards are present.');
  if (contents.some((content) => content.markingScheme && content.markingScheme.totalMarks >= 20)) strengths.push('Doctoral/professional marking schemes are present.');
  if (contents.some((content) => content.accountingType === 'methodology_design' || content.accountingType === 'empirical_model')) strengths.push('Research methodology and empirical model work is represented.');

  phdReadinessChecklist.forEach((item) => {
    if (!covered.has(item)) requiredUpgrades.push(`Add PhD evidence for: ${item}.`);
  });

  const score = Math.round((covered.size / phdReadinessChecklist.length) * 100);
  const rating = score >= 95 && requiredUpgrades.length === 0 ? 'phd_ready' : score >= 75 ? 'professional_ready' : score >= 45 ? 'teaching_ready' : 'foundation';
  return { score, rating, strengths, issues, requiredUpgrades };
}

export function autoMarkAccounting(payload: LearningBlockPayload, answer: unknown): BlockAutoMarkResult {
  const content = getAccountingContent(payload);
  if (content.accountingType === 'journal_entry' || content.accountingType === 'error_correction') return markJournalEntry(content, answer);
  if (content.accountingType === 'trial_balance') return markTrialBalance(content, answer);
  if (content.accountingType === 'bank_reconciliation') return markNumericAnswer(content, answer, expectedBankReconciliation(content.data), ['adjustedCashBookBalance', 'adjustedBankStatementBalance']);
  if (content.accountingType === 'depreciation') return markNumericAnswer(content, answer, { result: calculateDepreciation(content.data) }, ['result']);
  if (content.accountingType === 'inventory') return markNumericAnswer(content, answer, calculateInventory(content.data), ['cogs', 'closingInventory']);
  if (content.accountingType === 'ratio_analysis') return markNumericAnswer(content, answer, calculateRatios(sourceFinancialData(content.data)), ['current_ratio', 'quick_ratio', 'gross_profit_margin', 'net_profit_margin']);
  if (['ifrs_treatment', 'audit_risk', 'tax_computation', 'budgeting', 'variance_analysis', 'research_case', 'research_article_critique', 'theory_comparison', 'literature_gap_analysis', 'hypothesis_builder', 'methodology_design', 'empirical_model', 'variable_measurement', 'doctoral_proposal', 'exam_practice', 'case_study'].includes(content.accountingType)) {
    return markProfessionalResponse(content, answer);
  }
  return { correct: true, score: 1, feedback: 'Accounting activity recorded. Review the professional format and continue.' };
}

export function calculateJournalTotals(rows: JournalRow[]) {
  return rows.reduce(
    (total, row) => ({ debit: total.debit + money(row.debit), credit: total.credit + money(row.credit) }),
    { debit: 0, credit: 0 },
  );
}

export function calculateTrialBalanceTotals(accounts: TrialBalanceAccount[]) {
  return accounts.reduce(
    (total, account) => ({ debit: total.debit + money(account.debit), credit: total.credit + money(account.credit) }),
    { debit: 0, credit: 0 },
  );
}

export function calculateStatementTotal(sections: StatementSection[]) {
  return sections.map((section) => ({
    title: section.title,
    amount: section.items.reduce((sum, item) => sum + money(item.amount), 0),
  }));
}

export function calculateDepreciation(data: Record<string, unknown>) {
  const cost = money(data.cost);
  const residualValue = money(data.residualValue);
  const usefulLifeYears = Math.max(1, money(data.usefulLifeYears));
  const rate = money(data.rate) / 100;
  const method = String(data.method ?? 'straight_line');
  if (method === 'reducing_balance') return round2(cost * rate);
  if (method === 'units_of_production') {
    const depreciable = cost - residualValue;
    return round2((depreciable / Math.max(1, money(data.totalUnits))) * money(data.unitsProduced));
  }
  return round2((cost - residualValue) / usefulLifeYears);
}

export function calculateInventory(data: Record<string, unknown>) {
  const method = String(data.method ?? 'FIFO').toLowerCase();
  const transactions = Array.isArray(data.transactions) ? data.transactions.filter(isRecord) : [];
  if (method.includes('weighted')) return calculateWeightedAverageInventory(transactions);
  return calculateFifoInventory(transactions);
}

export function calculateRatios(data: Record<string, unknown>) {
  const currentAssets = money(data.currentAssets);
  const inventory = money(data.inventory);
  const currentLiabilities = money(data.currentLiabilities);
  const revenue = money(data.revenue ?? data.sales);
  const grossProfit = money(data.grossProfit);
  const netProfit = money(data.netProfit);
  const totalAssets = money(data.totalAssets);
  const equity = money(data.equity);
  const liabilities = money(data.totalLiabilities ?? data.liabilities);
  return {
    current_ratio: safeRatio(currentAssets, currentLiabilities),
    quick_ratio: safeRatio(currentAssets - inventory, currentLiabilities),
    gross_profit_margin: safeRatio(grossProfit * 100, revenue),
    net_profit_margin: safeRatio(netProfit * 100, revenue),
    return_on_assets: safeRatio(netProfit * 100, totalAssets),
    debt_to_equity: safeRatio(liabilities, equity),
  };
}

export function normalizeJournalRows(value: unknown): JournalRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((row) => ({
    account: String(row.account ?? ''),
    debit: money(row.debit),
    credit: money(row.credit),
    narration: typeof row.narration === 'string' ? row.narration : undefined,
  }));
}

export function normalizeLedgerEntries(value: unknown): LedgerEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((entry) => ({
    date: typeof entry.date === 'string' ? entry.date : undefined,
    details: String(entry.details ?? ''),
    amount: money(entry.amount),
  }));
}

export function normalizeTrialBalanceAccounts(value: unknown): TrialBalanceAccount[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((account) => ({ name: String(account.name ?? ''), debit: money(account.debit), credit: money(account.credit) }));
}

export function normalizeStatementSections(value: unknown): StatementSection[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((section) => ({
    title: String(section.title ?? ''),
    items: Array.isArray(section.items)
      ? section.items.filter(isRecord).map((item) => ({ name: String(item.name ?? ''), amount: money(item.amount) }))
      : [],
  }));
}

export function normalizeTextList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') return value.split('\n').map((line) => line.trim()).filter(Boolean);
  return [];
}

export function formatMoney(amount: unknown, currency = 'ZMW') {
  const value = money(amount);
  return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function validateRenderableStructure(content: AccountingCardContent, issues: string[]) {
  if (content.accountingType === 'journal_entry' || content.accountingType === 'error_correction') {
    const rows = normalizeJournalRows(content.data.rows ?? content.data.correctionRows ?? content.expectedAnswer?.rows);
    if (!rows.length) issues.push('Journal/error cards need debit and credit rows.');
    const totals = calculateJournalTotals(rows);
    if (totals.debit !== totals.credit) issues.push('Journal entry is not balanced: total debit must equal total credit.');
  }

  if (content.accountingType === 'trial_balance') {
    const accounts = normalizeTrialBalanceAccounts(content.data.accounts);
    if (!accounts.length) issues.push('Trial balance cards need account rows.');
    const totals = calculateTrialBalanceTotals(accounts);
    if (totals.debit !== totals.credit) issues.push('Trial balance data should balance before publishing.');
  }

  if (['financial_statement', 'cash_flow_statement', 'consolidation'].includes(content.accountingType)) {
    const sections = normalizeStatementSections(content.data.sections);
    if (!sections.length) issues.push('Financial statement cards need sections with line items.');
  }

  if (content.accountingType === 'depreciation' && (!content.data.cost || !content.data.method)) issues.push('Depreciation cards need cost and method.');
  if (content.accountingType === 'inventory' && !Array.isArray(content.data.transactions)) issues.push('Inventory cards need transaction layers.');
  if (content.accountingType === 'ratio_analysis' && Object.keys(sourceFinancialData(content.data)).length < 3) issues.push('Ratio analysis cards need financial data.');
}

function validateAcademicDepth(content: AccountingCardContent, issues: string[]) {
  const data = content.data;
  const required = normalizeTextList(data.required ?? data.prompts ?? data.tasks);
  const hasMarking = Boolean(content.markingScheme?.items.length && content.markingScheme.totalMarks > 0);

  if (content.difficulty === 'beginner') {
    if (!searchableText(content).match(/example|transaction|debit|credit|asset|liability|equity/i)) issues.push('Beginner cards need concrete examples and basic accounting language.');
  }

  if (content.difficulty === 'professional') {
    if (!hasMarking) issues.push('Professional cards need a marking scheme.');
    if (required.length < 3) issues.push('Professional cards need at least three required tasks.');
  }

  if (content.difficulty === 'phd' || phdAccountingTypes.includes(content.accountingType)) {
    const text = searchableText(content);
    const missing = phdReadinessChecklist.filter((item) => !matchesChecklist(text, item));
    if (missing.length) issues.push(`PhD card missing doctoral elements: ${missing.join('; ')}.`);
    if (!hasMarking || (content.markingScheme?.totalMarks ?? 0) < 20) issues.push('PhD cards need a doctoral marking rubric of at least 20 marks.');
  }
}

function validateProfessionalMetadata(content: AccountingCardContent, issues: string[]) {
  const data = content.data;
  if (['ifrs_treatment', 'consolidation', 'financial_statement', 'cash_flow_statement'].includes(content.accountingType)) {
    if (!data.standardFramework) issues.push('Advanced reporting cards should specify standardFramework, for example IFRS.');
  }
  if (content.accountingType === 'tax_computation' && !data.jurisdiction) issues.push('Tax computation cards must specify jurisdiction.');
  if (['professional', 'phd'].includes(content.difficulty) && !data.evidenceStandard) issues.push('Professional/PhD cards should specify evidenceStandard or expected evidence quality.');
}

function markJournalEntry(content: AccountingCardContent, answer: unknown): BlockAutoMarkResult {
  const expected = normalizeJournalRows(content.expectedAnswer?.rows ?? content.data.rows ?? content.data.correctionRows);
  const actual = normalizeJournalRows(isRecord(answer) ? answer.rows : answer);
  const actualTotals = calculateJournalTotals(actual.length ? actual : expected);

  if (actualTotals.debit !== actualTotals.credit) {
    return { correct: false, score: 0, feedback: 'Your journal entry is not balanced. In double entry, total debit must equal total credit.' };
  }

  if (!expected.length) return { correct: true, score: 1, feedback: 'Balanced journal entry recorded.' };

  const missingDebit = expected.find((row) => money(row.debit) > 0 && !actual.some((actualRow) => sameAccount(actualRow.account, row.account) && money(actualRow.debit) === money(row.debit)));
  const missingCredit = expected.find((row) => money(row.credit) > 0 && !actual.some((actualRow) => sameAccount(actualRow.account, row.account) && money(actualRow.credit) === money(row.credit)));
  const reversed = expected.every((row) => actual.some((actualRow) => sameAccount(actualRow.account, row.account) && money(actualRow.debit) === money(row.credit) && money(actualRow.credit) === money(row.debit)));

  if (reversed) return { correct: false, score: 0.25, feedback: 'The accounts are right, but the debit and credit sides are reversed. Check the normal balance rules.' };
  if (missingDebit) return { correct: false, score: 0.5, feedback: `Your debit side needs attention. ${missingDebit.account} should be debited with ${formatMoney(missingDebit.debit)}.` };
  if (missingCredit) return { correct: false, score: 0.5, feedback: `Your credit side needs attention. ${missingCredit.account} should be credited with ${formatMoney(missingCredit.credit)}.` };

  return { correct: true, score: 1, feedback: 'Correct. The journal entry is balanced and uses the correct debit and credit accounts.' };
}

function markTrialBalance(content: AccountingCardContent, answer: unknown): BlockAutoMarkResult {
  const expected = normalizeTrialBalanceAccounts(content.expectedAnswer?.accounts ?? content.data.accounts);
  const actual = normalizeTrialBalanceAccounts(isRecord(answer) ? answer.accounts : answer);
  const rows = actual.length ? actual : expected;
  const totals = calculateTrialBalanceTotals(rows);
  if (totals.debit !== totals.credit || totals.debit <= 0) {
    return { correct: false, score: 0, feedback: 'Your trial balance does not agree. Check side placement, omissions, and amounts.' };
  }
  if (!expected.length) return { correct: true, score: 1, feedback: 'Balanced. The trial balance agrees.' };
  const matched = expected.filter((row) => rows.some((actualRow) => sameAccount(actualRow.name, row.name) && money(actualRow.debit) === money(row.debit) && money(actualRow.credit) === money(row.credit))).length;
  const score = round2(matched / expected.length);
  return { correct: score >= 0.95, score, feedback: score >= 0.95 ? 'Excellent. The trial balance is balanced and accounts are correctly placed.' : `The trial balance balances, but only ${matched}/${expected.length} accounts match the professional answer.` };
}

function markNumericAnswer(content: AccountingCardContent, answer: unknown, expected: Record<string, number>, fields: string[]): BlockAutoMarkResult {
  const actual = isRecord(answer) ? answer : {};
  const activeFields = fields.filter((field) => Number.isFinite(expected[field]));
  if (!activeFields.length) return { correct: true, score: 1, feedback: 'Calculation submitted. Review the professional answer.' };
  const tolerance = money(content.data.tolerance ?? 0.01);
  const correctFields = activeFields.filter((field) => Math.abs(money(actual[field]) - expected[field]) <= tolerance);
  const score = round2(correctFields.length / activeFields.length);
  return {
    correct: score >= 0.99,
    score,
    feedback: score >= 0.99 ? 'Correct. Your calculation agrees with the professional answer.' : `Check ${activeFields.filter((field) => !correctFields.includes(field)).map((field) => field.replace(/_/g, ' ')).join(', ')}.`,
  };
}

function markProfessionalResponse(content: AccountingCardContent, answer: unknown): BlockAutoMarkResult {
  const response = typeof answer === 'string' ? answer : isRecord(answer) ? String(answer.response ?? answer.text ?? '') : '';
  const text = response.toLowerCase();
  const required = expectedKeywords(content);
  const found = required.filter((keyword) => text.includes(keyword.toLowerCase()));
  const score = required.length ? round2(found.length / required.length) : response.trim().length >= 250 ? 1 : 0.4;
  const phd = content.difficulty === 'phd' || phdAccountingTypes.includes(content.accountingType);
  return {
    correct: phd ? score >= 0.85 : score >= 0.7,
    score,
    feedback: score >= (phd ? 0.85 : 0.7)
      ? 'Strong response. It covers the expected professional/research judgement points.'
      : `Strengthen your response with: ${required.filter((keyword) => !found.includes(keyword)).slice(0, 6).join(', ') || 'more evidence, clearer judgement, and a fuller conclusion'}.`,
  };
}

function expectedKeywords(content: AccountingCardContent) {
  const rubricKeywords = content.markingScheme?.items.flatMap((item) => item.keywords ?? item.description.split(/\W+/).filter((word) => word.length > 4)) ?? [];
  const dataKeywords = normalizeTextList(content.data.expectedKeywords ?? content.data.keywords);
  const required = normalizeTextList(content.data.required ?? content.data.prompts ?? content.data.tasks).flatMap((item) => item.split(/\W+/).filter((word) => word.length > 5));
  const phdKeywords = content.difficulty === 'phd' || phdAccountingTypes.includes(content.accountingType)
    ? ['theory', 'literature', 'gap', 'methodology', 'validity', 'measurement', 'contribution', 'limitations']
    : [];
  return unique([...rubricKeywords, ...dataKeywords, ...required, ...phdKeywords]).slice(0, 24);
}

function expectedBankReconciliation(data: Record<string, unknown>) {
  const cashBookBalance = money(data.cashBookBalance);
  const bankStatementBalance = money(data.bankStatementBalance);
  const adjustedCashBookBalance = cashBookBalance + sumAmounts(data.additions) - sumAmounts(data.deductions);
  const adjustedBankStatementBalance = bankStatementBalance + sumAmounts(data.uncreditedDeposits) - sumAmounts(data.unpresentedCheques);
  return { adjustedCashBookBalance: round2(adjustedCashBookBalance), adjustedBankStatementBalance: round2(adjustedBankStatementBalance) };
}

function calculateFifoInventory(transactions: Record<string, unknown>[]) {
  const layers: { units: number; unitCost: number }[] = [];
  let cogs = 0;
  for (const tx of transactions) {
    const type = String(tx.type ?? '').toLowerCase();
    if (type === 'purchase') layers.push({ units: money(tx.units), unitCost: money(tx.unitCost) });
    if (type === 'sale') {
      let remaining = money(tx.units);
      while (remaining > 0 && layers.length) {
        const layer = layers[0];
        const used = Math.min(remaining, layer.units);
        cogs += used * layer.unitCost;
        layer.units -= used;
        remaining -= used;
        if (layer.units <= 0) layers.shift();
      }
    }
  }
  const closingInventory = layers.reduce((sum, layer) => sum + layer.units * layer.unitCost, 0);
  return { cogs: round2(cogs), closingInventory: round2(closingInventory) };
}

function calculateWeightedAverageInventory(transactions: Record<string, unknown>[]) {
  let units = 0;
  let cost = 0;
  let cogs = 0;
  for (const tx of transactions) {
    const type = String(tx.type ?? '').toLowerCase();
    if (type === 'purchase') {
      units += money(tx.units);
      cost += money(tx.units) * money(tx.unitCost);
    }
    if (type === 'sale') {
      const average = units ? cost / units : 0;
      const sold = money(tx.units);
      cogs += sold * average;
      units -= sold;
      cost -= sold * average;
    }
  }
  return { cogs: round2(cogs), closingInventory: round2(cost) };
}

function sourceFinancialData(data: Record<string, unknown>) {
  return data.financialData && isRecord(data.financialData) ? data.financialData : data;
}

function searchableText(content: AccountingCardContent) {
  return JSON.stringify({ type: content.accountingType, difficulty: content.difficulty, data: content.data, markingScheme: content.markingScheme, expectedAnswer: content.expectedAnswer }).toLowerCase();
}

function matchesChecklist(text: string, item: string) {
  const lower = item.toLowerCase();
  if (lower.includes('research problem')) return /problem|context|issue|phenomenon/.test(text);
  if (lower.includes('theory')) return /theory|theoretical|positive accounting|agency|institutional|stakeholder|legitimacy/.test(text);
  if (lower.includes('gap')) return /gap|contribution|novel|underexplored|limitation/.test(text);
  if (lower.includes('questions')) return /research question|hypothesis|hypotheses|rq\d|h\d/.test(text);
  if (lower.includes('methodology')) return /methodology|method|sample|data|regression|interview|case study|panel/.test(text);
  if (lower.includes('measurement')) return /measure|variable|construct|proxy|operational/.test(text);
  if (lower.includes('validity')) return /validity|reliability|endogeneity|bias|robustness|threat/.test(text);
  if (lower.includes('evidence')) return /evidence|finding|argument|analysis|interpretation/.test(text);
  if (lower.includes('limitations')) return /limitation|ethic|ethical|scope|constraint/.test(text);
  if (lower.includes('rubric')) return /marks|rubric|criteria|totalmarks/.test(text);
  return text.includes(lower);
}

function collectLegacyData(payload: LearningBlockPayload): Record<string, unknown> {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => !['type', 'title', 'body', 'content'].includes(key)));
}

function normalizeAccountingType(value: unknown): AccountingCardType {
  const normalized = String(value ?? 'concept').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return allowedAccountingTypes.includes(normalized as AccountingCardType) ? normalized as AccountingCardType : 'concept';
}

function normalizeDifficulty(value: unknown): AccountingDifficulty {
  const normalized = String(value ?? 'beginner');
  return ['beginner', 'intermediate', 'advanced', 'professional', 'phd'].includes(normalized) ? normalized as AccountingDifficulty : 'beginner';
}

function isMarkingScheme(value: unknown): AccountingMarkingScheme | undefined {
  if (!isRecord(value)) return undefined;
  const totalMarks = money(value.totalMarks);
  const items = Array.isArray(value.items) ? value.items.filter(isRecord).map((item) => ({
    description: String(item.description ?? ''),
    marks: money(item.marks),
    keywords: normalizeTextList(item.keywords),
  })) : [];
  return { totalMarks, items };
}

function sameAccount(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function safeRatio(a: number, b: number) {
  if (!b) return 0;
  return round2(a / b);
}

function sumAmounts(value: unknown) {
  if (!Array.isArray(value)) return 0;
  return value.reduce((sum, item) => sum + money(typeof item === 'object' && item !== null ? (item as Record<string, unknown>).amount : item), 0);
}

function unique(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function money(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(String(value ?? 0).replace(/,/g, ''));
  return Number.isFinite(numeric) ? round2(numeric) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
