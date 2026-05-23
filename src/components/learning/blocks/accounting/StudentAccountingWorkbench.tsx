'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, PenLine, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BlockAutoMarkResult } from '../schemas';
import {
  autoMarkAccounting,
  calculateJournalTotals,
  calculateTrialBalanceTotals,
  formatMoney,
  normalizeJournalRows,
  normalizeTrialBalanceAccounts,
  type AccountingCardContent,
  type JournalRow,
  type TrialBalanceAccount,
} from './engine';

export function StudentAccountingWorkbench({ content, currency }: { content: AccountingCardContent; currency: string }) {
  if (content.accountingType === 'journal_entry' || content.accountingType === 'error_correction') {
    return <JournalWorkbench content={content} currency={currency} />;
  }
  if (content.accountingType === 'trial_balance') {
    return <TrialBalanceWorkbench content={content} currency={currency} />;
  }
  if (content.accountingType === 'bank_reconciliation') {
    return <NumericWorkbench content={content} fields={['adjustedCashBookBalance', 'adjustedBankStatementBalance']} />;
  }
  if (content.accountingType === 'depreciation') {
    return <NumericWorkbench content={content} fields={['result']} />;
  }
  if (content.accountingType === 'inventory') {
    return <NumericWorkbench content={content} fields={['cogs', 'closingInventory']} />;
  }
  if (content.accountingType === 'ratio_analysis') {
    return <NumericWorkbench content={content} fields={['current_ratio', 'quick_ratio', 'gross_profit_margin', 'net_profit_margin', 'return_on_assets', 'debt_to_equity']} />;
  }
  return <ProfessionalResponseWorkbench content={content} />;
}

function JournalWorkbench({ content, currency }: { content: AccountingCardContent; currency: string }) {
  const seedRows = normalizeJournalRows(content.expectedAnswer?.rows ?? content.data.rows);
  const [rows, setRows] = useState<JournalRow[]>(seedRows.length ? seedRows.map(() => ({ account: '', debit: 0, credit: 0 })) : [{ account: '', debit: 0, credit: 0 }, { account: '', debit: 0, credit: 0 }]);
  const [result, setResult] = useState<BlockAutoMarkResult | null>(null);
  const totals = useMemo(() => calculateJournalTotals(rows), [rows]);

  const updateRow = (index: number, patch: Partial<JournalRow>) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  const removeRow = (index: number) => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));

  return (
    <div className="space-y-3 rounded-2xl border bg-muted/10 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold"><PenLine className="size-4" /> Student journal workspace</div>
      <div className="overflow-hidden rounded-xl border bg-background">
        <table className="w-full table-fixed text-[11px] sm:text-sm">
          <thead className="bg-muted/50"><tr><th className="px-2 py-2 text-left">Account</th><th className="px-2 py-2 text-left">Debit</th><th className="px-2 py-2 text-left">Credit</th><th className="w-12 px-2 py-2" /></tr></thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t">
                <td className="px-2 py-2"><Input value={row.account} onChange={(event) => updateRow(index, { account: event.target.value })} placeholder="Account" /></td>
                <td className="px-2 py-2"><Input inputMode="decimal" value={row.debit || ''} onChange={(event) => updateRow(index, { debit: Number(event.target.value || 0) })} placeholder="0" /></td>
                <td className="px-2 py-2"><Input inputMode="decimal" value={row.credit || ''} onChange={(event) => updateRow(index, { credit: Number(event.target.value || 0) })} placeholder="0" /></td>
                <td className="px-2 py-2"><Button type="button" size="icon" variant="ghost" onClick={() => removeRow(index)}><Trash2 className="size-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background p-3 text-sm">
        <span>Debit: {formatMoney(totals.debit, currency)} · Credit: {formatMoney(totals.credit, currency)}</span>
        <span className={totals.debit === totals.credit && totals.debit > 0 ? 'text-emerald-600' : 'text-destructive'}>{totals.debit === totals.credit && totals.debit > 0 ? 'Balanced' : 'Not balanced'}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setRows((current) => [...current, { account: '', debit: 0, credit: 0 }])}><Plus className="mr-1 size-4" /> Add row</Button>
        <Button type="button" size="sm" onClick={() => setResult(autoMarkAccounting({ type: 'accounting_studio', content }, { rows }))}>Check answer</Button>
      </div>
      {result ? <Feedback result={result} /> : null}
    </div>
  );
}

function TrialBalanceWorkbench({ content, currency }: { content: AccountingCardContent; currency: string }) {
  const seedAccounts = normalizeTrialBalanceAccounts(content.data.accounts);
  const [accounts, setAccounts] = useState<TrialBalanceAccount[]>(seedAccounts.length ? seedAccounts.map((account) => ({ name: account.name, debit: 0, credit: 0 })) : [{ name: '', debit: 0, credit: 0 }]);
  const [result, setResult] = useState<BlockAutoMarkResult | null>(null);
  const totals = useMemo(() => calculateTrialBalanceTotals(accounts), [accounts]);
  const updateAccount = (index: number, patch: Partial<TrialBalanceAccount>) => setAccounts((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));

  return (
    <div className="space-y-3 rounded-2xl border bg-muted/10 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold"><FileSpreadsheet className="size-4" /> Student trial balance workspace</div>
      <div className="overflow-hidden rounded-xl border bg-background">
        <table className="w-full table-fixed text-[11px] sm:text-sm">
          <thead className="bg-muted/50"><tr><th className="px-2 py-2 text-left">Account</th><th className="px-2 py-2 text-left">Debit</th><th className="px-2 py-2 text-left">Credit</th></tr></thead>
          <tbody>{accounts.map((account, index) => <tr key={index} className="border-t"><td className="px-2 py-2"><Input value={account.name} onChange={(event) => updateAccount(index, { name: event.target.value })} /></td><td className="px-2 py-2"><Input value={account.debit || ''} onChange={(event) => updateAccount(index, { debit: Number(event.target.value || 0) })} /></td><td className="px-2 py-2"><Input value={account.credit || ''} onChange={(event) => updateAccount(index, { credit: Number(event.target.value || 0) })} /></td></tr>)}</tbody>
        </table>
      </div>
      <div className="rounded-xl bg-background p-3 text-sm">Debit: {formatMoney(totals.debit, currency)} · Credit: {formatMoney(totals.credit, currency)}</div>
      <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setAccounts((current) => [...current, { name: '', debit: 0, credit: 0 }])}>Add account</Button><Button type="button" size="sm" onClick={() => setResult(autoMarkAccounting({ type: 'accounting_studio', content }, { accounts }))}>Check trial balance</Button></div>
      {result ? <Feedback result={result} /> : null}
    </div>
  );
}

function NumericWorkbench({ content, fields }: { content: AccountingCardContent; fields: string[] }) {
  const [answer, setAnswer] = useState<Record<string, number>>({});
  const [result, setResult] = useState<BlockAutoMarkResult | null>(null);
  return (
    <div className="space-y-3 rounded-2xl border bg-muted/10 p-4">
      <div className="text-sm font-semibold">Student calculation workspace</div>
      <div className="grid gap-3 md:grid-cols-2">{fields.map((field) => <label key={field} className="space-y-2 text-sm font-medium"><span className="capitalize">{field.replace(/_/g, ' ')}</span><Input inputMode="decimal" value={answer[field] || ''} onChange={(event) => setAnswer((current) => ({ ...current, [field]: Number(event.target.value || 0) }))} /></label>)}</div>
      <Button type="button" size="sm" onClick={() => setResult(autoMarkAccounting({ type: 'accounting_studio', content }, answer))}>Check calculation</Button>
      {result ? <Feedback result={result} /> : null}
    </div>
  );
}

function ProfessionalResponseWorkbench({ content }: { content: AccountingCardContent }) {
  const [response, setResponse] = useState('');
  const [result, setResult] = useState<BlockAutoMarkResult | null>(null);
  const isPhd = content.difficulty === 'phd' || String(content.accountingType).includes('research') || ['theory_comparison', 'literature_gap_analysis', 'hypothesis_builder', 'methodology_design', 'empirical_model', 'variable_measurement', 'doctoral_proposal'].includes(content.accountingType);
  return (
    <div className="space-y-3 rounded-2xl border bg-muted/10 p-4">
      <div className="text-sm font-semibold">{isPhd ? 'Doctoral research response workspace' : 'Professional response workspace'}</div>
      <textarea value={response} onChange={(event) => setResponse(event.target.value)} className="min-h-40 w-full rounded-xl border bg-background p-3 text-sm" placeholder={isPhd ? 'Write a doctoral response using theory, literature gap, methodology, variables, validity, evidence, contribution, limitations, and conclusion.' : 'Write the treatment, recommendation, report paragraph, or research critique here.'} />
      <div className="rounded-xl bg-background p-3 text-xs text-muted-foreground">
        {isPhd ? 'Your response is assessed against doctoral keywords and the PhD rubric. Strong answers connect theory, method, evidence, and contribution.' : 'Your response is assessed against the professional marking scheme and expected keywords.'}
      </div>
      {content.markingScheme ? <div className="text-xs text-muted-foreground">Total marks available: {content.markingScheme.totalMarks}</div> : null}
      <Button type="button" size="sm" onClick={() => setResult(autoMarkAccounting({ type: 'accounting_studio', content }, { response }))}>Check response</Button>
      {result ? <Feedback result={result} /> : null}
    </div>
  );
}

function Feedback({ result }: { result: BlockAutoMarkResult }) {
  return (
    <div className={`rounded-xl border p-3 text-sm ${result.correct ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-destructive/30 bg-destructive/10'}`}>
      <div className="flex items-center gap-2 font-medium">{result.correct ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />} {result.correct ? 'Correct' : 'Review needed'} {typeof result.score === 'number' ? `· ${Math.round(result.score * 100)}%` : ''}</div>
      {result.feedback ? <p className="mt-1 text-muted-foreground">{result.feedback}</p> : null}
    </div>
  );
}
