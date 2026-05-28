export type AccountingTemplate =
  | 'accounting_intro'
  | 'accounting_equation'
  | 'account_classification'
  | 'transaction_scenario'
  | 'transaction_analysis'
  | 'journal_entry'
  | 'ledger_posting'
  | 'trial_balance'
  | 'financial_statement'
  | 'bank_reconciliation'
  | 'depreciation'
  | 'inventory_valuation'
  | 'ratio_analysis';

export type AccountingVisual = {
  template: AccountingTemplate;
  title: string;
  subtitle?: string;
  explanation?: string;
  teachingThread?: { role: 'teacher' | 'student' | 'system'; text: string }[];
  table?: { title?: string; columns: string[]; rows: unknown[][] };
  metrics?: { label: string; value: string; note?: string }[];
  scenario?: { businessName?: string; date?: string; description?: string; amount?: number; currency?: string };
  journalRows?: { account: string; debit?: number; credit?: number; reason?: string }[];
  notes?: string[];
  commonMistakes?: string[];
  tryThis?: string[];
};
