'use client';

import { BadgeCheck } from 'lucide-react';
import type { LearningBlockPayload } from '../schemas';
import type { BlockRendererProps } from '../schemas';
import { getAccountingContent, normalizeJournalRows } from './engine';
import { AccountingVisualRenderer } from './AccountingVisualRenderer';
import type { AccountingTemplate, AccountingVisual } from './types';

function templateFromAccountingBlockType(type: string): AccountingTemplate {
  switch (type) {
    case 'accounting_intro': return 'accounting_intro';
    case 'accounting_equation': return 'accounting_equation';
    case 'accounting_account_classification': return 'account_classification';
    case 'accounting_scenario': return 'transaction_scenario';
    case 'accounting_transaction_analysis': return 'transaction_analysis';
    case 'accounting_journal_entry': return 'journal_entry';
    case 'accounting_t_account':
    case 'accounting_ledger':
    case 'accounting_cashbook':
    case 'accounting_control_account':
    case 'accounting_adjustment': return 'ledger_posting';
    case 'accounting_trial_balance': return 'trial_balance';
    case 'accounting_statement': return 'financial_statement';
    case 'accounting_bank_reconciliation': return 'bank_reconciliation';
    case 'accounting_depreciation': return 'depreciation';
    case 'accounting_inventory': return 'inventory_valuation';
    case 'accounting_ratio_analysis': return 'ratio_analysis';
    default: return 'accounting_intro';
  }
}

export function buildAccountingVisualFromPayload(payload: LearningBlockPayload, content: ReturnType<typeof getAccountingContent>, definition: BlockRendererProps['definition']): AccountingVisual {
  const data = content.data;
  const title = String(payload.title ?? data.title ?? definition.label);
  const table = Array.isArray(data.rows) ? { columns: ['Account', 'Debit', 'Credit'], rows: normalizeJournalRows(data.rows).map((r) => [r.account, r.debit ?? '', r.credit ?? '']) } : undefined;
  return {
    template: templateFromAccountingBlockType(String(payload.type ?? 'accounting_intro')),
    title,
    subtitle: payload.body ? String(payload.body) : undefined,
    explanation: String(data.explanation ?? data.description ?? data.concept ?? ''),
    table,
    metrics: [{ label: 'Card type', value: String(payload.type ?? 'accounting_intro') }],
    notes: Array.isArray(data.teacherNotes) ? data.teacherNotes.map(String) : undefined,
    commonMistakes: Array.isArray(data.commonMistakes) ? data.commonMistakes.map(String) : undefined,
    tryThis: Array.isArray(data.required) ? data.required.map(String) : undefined,
  };
}

export function AccountingCardRenderer({ payload, definition }: BlockRendererProps) {
  const content = getAccountingContent(payload);
  const visual = buildAccountingVisualFromPayload(payload, content, definition);
  return <AccountingVisualRenderer visual={visual} />;
}

export function AccountingCardPreviewRenderer(props: BlockRendererProps) {
  return <div className="rounded-2xl border bg-muted/20 p-3"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><BadgeCheck className="h-4 w-4 shrink-0" />Accounting card preview</div><AccountingCardRenderer {...props} /></div>;
}
