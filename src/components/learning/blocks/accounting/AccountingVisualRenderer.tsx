'use client';

import { AccountingShell } from './AccountingShell';
import type { AccountingVisual } from './types';
import {
  AccountClassificationScene,
  AccountingEquationScene,
  AccountingIntroScene,
  BankReconciliationScene,
  DepreciationScene,
  FinancialStatementScene,
  InventoryValuationScene,
  JournalEntryScene,
  LedgerPostingScene,
  RatioAnalysisScene,
  TransactionAnalysisScene,
  TransactionScenarioScene,
  TrialBalanceScene,
} from './scenes';

export function AccountingVisualRenderer({ visual }: { visual: AccountingVisual }) {
  const template = visual.template;

  if (template === 'accounting_intro') return <AccountingIntroScene visual={visual} />;
  if (template === 'accounting_equation') return <AccountingEquationScene visual={visual} />;
  if (template === 'account_classification') return <AccountClassificationScene visual={visual} />;
  if (template === 'transaction_scenario') return <TransactionScenarioScene visual={visual} />;
  if (template === 'transaction_analysis') return <TransactionAnalysisScene visual={visual} />;
  if (template === 'journal_entry') return <JournalEntryScene visual={visual} />;
  if (template === 'ledger_posting') return <LedgerPostingScene visual={visual} />;
  if (template === 'trial_balance') return <TrialBalanceScene visual={visual} />;
  if (template === 'financial_statement') return <FinancialStatementScene visual={visual} />;
  if (template === 'bank_reconciliation') return <BankReconciliationScene visual={visual} />;
  if (template === 'depreciation') return <DepreciationScene visual={visual} />;
  if (template === 'inventory_valuation') return <InventoryValuationScene visual={visual} />;
  if (template === 'ratio_analysis') return <RatioAnalysisScene visual={visual} />;

  return <AccountingShell visual={visual} title={visual.title}><AccountingIntroScene visual={visual} /></AccountingShell>;
}
