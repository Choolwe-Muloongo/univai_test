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
  | 'research_case';

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

export type AccountingCardContent = {
  accountingType: AccountingCardType;
  difficulty: AccountingDifficulty;
  data: Record<string, unknown>;
  expectedAnswer?: Record<string, unknown>;
  markingScheme?: {
    totalMarks: number;
    items: { description: string; marks: number }[];
  };
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
  | 'formatting_error';

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

  if (content.accountingType === 'journal_entry') {
    const rows = normalizeJournalRows(content.data.rows ?? content.expectedAnswer?.rows);
    if (!rows.length) issues.push('Journal entry cards need debit and credit rows.');
    const totals = calculateJournalTotals(rows);
    if (totals.debit !== totals.credit) issues.push('Journal entry is not balanced: total debit must equal total credit.');
  }

  if (content.accountingType === 'trial_balance') {
    const accounts = normalizeTrialBalanceAccounts(content.data.accounts);
    if (!accounts.length) issues.push('Trial balance cards need account rows.');
  }

  return { valid: issues.length === 0, issues };
}

export function autoMarkAccounting(payload: LearningBlockPayload, answer: unknown): BlockAutoMarkResult {
  const content = getAccountingContent(payload);
  if (content.accountingType === 'journal_entry') return markJournalEntry(content, answer);
  if (content.accountingType === 'trial_balance') {
    const accounts = normalizeTrialBalanceAccounts(isRecord(answer) ? answer.accounts : content.data.accounts);
    const totals = calculateTrialBalanceTotals(accounts);
    const correct = totals.debit === totals.credit && totals.debit > 0;
    return {
      correct,
      score: correct ? 1 : 0,
      feedback: correct
        ? 'Balanced. The trial balance agrees.'
        : 'Your trial balance does not agree. Check whether one transaction was posted on the wrong side, omitted, or entered with the wrong amount.',
    };
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
  if (method === 'reducing_balance') return Math.round(cost * rate * 100) / 100;
  return Math.round(((cost - residualValue) / usefulLifeYears) * 100) / 100;
}

export function calculateInventory(data: Record<string, unknown>) {
  const transactions = Array.isArray(data.transactions) ? data.transactions.filter(isRecord) : [];
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
  return { cogs: Math.round(cogs * 100) / 100, closingInventory: Math.round(closingInventory * 100) / 100 };
}

export function calculateRatios(data: Record<string, unknown>) {
  const currentAssets = money(data.currentAssets);
  const inventory = money(data.inventory);
  const currentLiabilities = money(data.currentLiabilities);
  const revenue = money(data.revenue ?? data.sales);
  const grossProfit = money(data.grossProfit);
  const netProfit = money(data.netProfit);
  return {
    current_ratio: safeRatio(currentAssets, currentLiabilities),
    quick_ratio: safeRatio(currentAssets - inventory, currentLiabilities),
    gross_profit_margin: safeRatio(grossProfit * 100, revenue),
    net_profit_margin: safeRatio(netProfit * 100, revenue),
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

function markJournalEntry(content: AccountingCardContent, answer: unknown): BlockAutoMarkResult {
  const expected = normalizeJournalRows(content.expectedAnswer?.rows ?? content.data.rows);
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

function collectLegacyData(payload: LearningBlockPayload): Record<string, unknown> {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => !['type', 'title', 'body', 'content'].includes(key)));
}

function normalizeAccountingType(value: unknown): AccountingCardType {
  const normalized = String(value ?? 'concept').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const allowed: AccountingCardType[] = ['concept', 'transaction', 'journal_entry', 'ledger', 'trial_balance', 'financial_statement', 'bank_reconciliation', 'depreciation', 'inventory', 'ratio_analysis', 'error_correction', 'case_study', 'exam_practice', 'marking_scheme', 'business_simulation', 'consolidation', 'cash_flow_statement', 'ifrs_treatment', 'audit_risk', 'tax_computation', 'budgeting', 'variance_analysis', 'research_case'];
  return allowed.includes(normalized as AccountingCardType) ? normalized as AccountingCardType : 'concept';
}

function normalizeDifficulty(value: unknown): AccountingDifficulty {
  const normalized = String(value ?? 'beginner');
  return ['beginner', 'intermediate', 'advanced', 'professional', 'phd'].includes(normalized) ? normalized as AccountingDifficulty : 'beginner';
}

function isMarkingScheme(value: unknown): AccountingCardContent['markingScheme'] | undefined {
  if (!isRecord(value)) return undefined;
  const totalMarks = money(value.totalMarks);
  const items = Array.isArray(value.items) ? value.items.filter(isRecord).map((item) => ({ description: String(item.description ?? ''), marks: money(item.marks) })) : [];
  return { totalMarks, items };
}

function sameAccount(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function safeRatio(a: number, b: number) {
  if (!b) return 0;
  return Math.round((a / b) * 100) / 100;
}

function money(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(String(value ?? 0).replace(/,/g, ''));
  return Number.isFinite(numeric) ? Math.round(numeric * 100) / 100 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
