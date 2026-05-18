import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const accountingTypes = [
  'transaction_board', 'account_identification_step', 'debit_credit_reasoning_step',
  'journal_entry_step', 'ledger_posting_step', 't_account_step', 'trial_balance_step',
  'financial_statement_step', 'accounting_error_step', 'accounting_final_explanation',
  'account_sorting', 'accounting_cycle_simulation', 'income_statement_builder',
  'balance_sheet_builder', 'cash_flow_statement_builder', 'double_entry_check',
  'adjusting_entry_step', 'bank_reconciliation_activity', 'depreciation_activity',
  'inventory_valuation_activity',
];

export const accountingBlockDefinitions = createBlockDefinitions(
  blockSpecs('accounting', 'accounting', accountingTypes, 'Accounting and finance workbook block'),
);
