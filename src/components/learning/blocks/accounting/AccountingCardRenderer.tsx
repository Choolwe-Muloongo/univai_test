'use client';

import { AlertTriangle, BadgeCheck, BriefcaseBusiness, CheckCircle2, Landmark } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { MathText } from '@/components/learning/math-text';
import type { BlockRendererProps } from '../schemas';
import { StudentAccountingWorkbench } from './StudentAccountingWorkbench';
import {
  calculateDepreciation,
  calculateInventory,
  calculateJournalTotals,
  calculateRatios,
  calculateStatementTotal,
  calculateTrialBalanceTotals,
  formatMoney,
  getAccountingContent,
  normalizeJournalRows,
  normalizeLedgerEntries,
  normalizeStatementSections,
  normalizeTextList,
  normalizeTrialBalanceAccounts,
} from './engine';

const doctoralResearchTypes = new Set([
  'research_case',
  'research_article_critique',
  'theory_comparison',
  'literature_gap_analysis',
  'hypothesis_builder',
  'methodology_design',
  'empirical_model',
  'variable_measurement',
  'doctoral_proposal',
]);

export function AccountingCardRenderer({ payload, definition }: BlockRendererProps) {
  const content = getAccountingContent(payload);
  const data = content.data;
  const title = String(payload.title ?? data.title ?? definition.label);
  const currency = String(data.currency ?? 'ZMW');

  return (
    <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="rounded-full">Accounting Studio</Badge>
        <Badge variant="outline" className="rounded-full capitalize">{content.accountingType.replace(/_/g, ' ')}</Badge>
        <Badge variant="outline" className="rounded-full capitalize">{content.difficulty}</Badge>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight"><MathText text={title} /></h3>
        {payload.body ? <p className="text-sm leading-6 text-muted-foreground"><MathText text={String(payload.body)} /></p> : null}
      </div>

      {renderAccountingBody(content.accountingType, data, currency)}
      <StudentAccountingWorkbench content={content} currency={currency} />

      {content.markingScheme ? <MarkingScheme totalMarks={content.markingScheme.totalMarks} items={content.markingScheme.items} /> : null}

      <div className="rounded-2xl border border-dashed bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
        Formula helper, professional format, and retry flows are handled by the card data, workspace feedback, and marking scheme. Use the attempt area above for active practice.
      </div>
    </div>
  );
}

export function AccountingCardPreviewRenderer(props: BlockRendererProps) {
  return (
    <div className="rounded-2xl border bg-muted/20 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><BadgeCheck className="size-4" /> Accounting student preview</div>
      <AccountingCardRenderer {...props} />
    </div>
  );
}

function renderAccountingBody(type: string, data: Record<string, unknown>, currency: string) {
  if (doctoralResearchTypes.has(type)) return <DoctoralResearchCase data={data} type={type} />;

  switch (type) {
    case 'transaction': return <TransactionScenario data={data} currency={currency} />;
    case 'journal_entry': return <JournalEntryTable rows={normalizeJournalRows(data.rows)} currency={currency} />;
    case 'ledger': return <LedgerAccount data={data} currency={currency} />;
    case 'trial_balance': return <TrialBalance accounts={normalizeTrialBalanceAccounts(data.accounts)} currency={currency} title={String(data.title ?? 'Trial Balance')} />;
    case 'financial_statement':
    case 'cash_flow_statement':
    case 'consolidation': return <FinancialStatement data={data} currency={currency} />;
    case 'bank_reconciliation': return <BankReconciliation data={data} currency={currency} />;
    case 'depreciation': return <Depreciation data={data} currency={currency} />;
    case 'inventory': return <InventoryValuation data={data} currency={currency} />;
    case 'ratio_analysis': return <RatioAnalysis data={data} />;
    case 'error_correction': return <ErrorCorrection data={data} currency={currency} />;
    case 'ifrs_treatment':
    case 'audit_risk':
    case 'tax_computation':
    case 'budgeting':
    case 'variance_analysis':
    case 'exam_practice': return <ProfessionalCase data={data} />;
    case 'case_study': return <ProfessionalCase data={data} />;
    case 'business_simulation': return <BusinessSimulation data={data} currency={currency} />;
    default: return <ConceptCard data={data} />;
  }
}

function GenericWorkpaperTable({ data }: { data: Record<string, unknown> }) {
  if (!Array.isArray(data.columns) || !Array.isArray(data.rows)) return null;
  return (
    <div className="space-y-2">
      {data.tableKind ? <div className="text-xs font-semibold uppercase tracking-wide text-primary">{String(data.tableKind).replace(/_/g, ' ')}</div> : null}
      <AccountingTable columns={data.columns.map(String)} rows={(data.rows as unknown[]).map((row) => Array.isArray(row) ? row : [row])} />
    </div>
  );
}

function ConceptCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2 font-semibold"><Landmark className="size-4" /> {String(data.concept ?? 'Accounting concept')}</div>
      {data.explanation ? <p className="text-sm leading-6 text-muted-foreground"><MathText text={String(data.explanation)} /></p> : null}
      {data.example ? <p className="rounded-xl bg-background/70 p-3 text-sm"><MathText text={String(data.example)} /></p> : null}
      <GenericWorkpaperTable data={data} />
    </div>
  );
}

function TransactionScenario({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const accounts = Array.isArray(data.expectedAccounts) ? data.expectedAccounts.map(String) : [];
  return (
    <div className="grid gap-3 md:grid-cols-[1.3fr_.7fr]">
      <div className="rounded-2xl border p-4">
        <div className="mb-2 text-sm font-semibold">Business event</div>
        <p className="text-sm leading-6 text-muted-foreground"><MathText text={String(data.description ?? 'Add a realistic transaction scenario.')} /></p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Info label="Business" value={String(data.businessName ?? 'Business')} />
          <Info label="Date" value={String(data.transactionDate ?? 'Date')} />
          <Info label="Amount" value={formatMoney(data.amount, currency)} />
        </div>
      </div>
      <div className="rounded-2xl border bg-muted/20 p-4">
        <div className="mb-2 text-sm font-semibold">Accounts to identify</div>
        <div className="flex flex-wrap gap-2">{accounts.map((account) => <Badge key={account} variant="outline">{account}</Badge>)}</div>
      </div>
    </div>
  );
}

function JournalEntryTable({ rows, currency }: { rows: ReturnType<typeof normalizeJournalRows>; currency: string }) {
  const totals = calculateJournalTotals(rows);
  const balanced = totals.debit === totals.credit && totals.debit > 0;
  return <div className="space-y-3"><AccountingTable columns={['Professional account', 'Debit', 'Credit']} rows={rows.map((row) => [row.account, row.debit ? formatMoney(row.debit, currency) : '', row.credit ? formatMoney(row.credit, currency) : ''])} /><BalanceBanner balanced={balanced} debit={totals.debit} credit={totals.credit} currency={currency} /></div>;
}

function LedgerAccount({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const debitEntries = normalizeLedgerEntries(data.debitEntries);
  const creditEntries = normalizeLedgerEntries(data.creditEntries);
  const rows = Array.from({ length: Math.max(debitEntries.length, creditEntries.length, 1) }).map((_, index) => [debitEntries[index]?.details ?? '', debitEntries[index]?.amount ? formatMoney(debitEntries[index]?.amount, currency) : '', creditEntries[index]?.details ?? '', creditEntries[index]?.amount ? formatMoney(creditEntries[index]?.amount, currency) : '']);
  return <div className="rounded-2xl border p-4"><div className="mb-3 text-center font-semibold">{String(data.accountName ?? 'Ledger Account')}</div><AccountingTable columns={['Debit details', 'Debit amount', 'Credit details', 'Credit amount']} rows={rows} /></div>;
}

function TrialBalance({ accounts, currency, title }: { accounts: ReturnType<typeof normalizeTrialBalanceAccounts>; currency: string; title: string }) {
  const totals = calculateTrialBalanceTotals(accounts);
  return <div className="space-y-3"><AccountingTable columns={['Account', 'Debit', 'Credit']} rows={accounts.map((account) => [account.name, account.debit ? formatMoney(account.debit, currency) : '', account.credit ? formatMoney(account.credit, currency) : '']).concat([[`${title} totals`, formatMoney(totals.debit, currency), formatMoney(totals.credit, currency)]])} /><BalanceBanner balanced={totals.debit === totals.credit && totals.debit > 0} debit={totals.debit} credit={totals.credit} currency={currency} /></div>;
}

function FinancialStatement({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const sections = normalizeStatementSections(data.sections);
  const totals = calculateStatementTotal(sections);
  const revenue = totals.find((section) => /revenue|sales/i.test(section.title))?.amount ?? 0;
  const expenses = totals.filter((section) => /expense|cost/i.test(section.title)).reduce((sum, section) => sum + section.amount, 0);
  return (
    <div className="space-y-4 rounded-2xl border p-4">
      <div className="text-center"><div className="font-semibold">{String(data.businessName ?? 'Business')}</div><div className="text-sm text-muted-foreground">{String(data.statementType ?? 'Financial statement').replace(/_/g, ' ')}</div><div className="text-xs text-muted-foreground">{String(data.period ?? '')}</div></div>
      {sections.map((section) => <div key={section.title}><div className="mb-2 font-semibold">{section.title}</div><AccountingTable columns={['Item', 'Amount']} rows={section.items.map((item) => [item.name, formatMoney(item.amount, currency)])} /></div>)}
      <GenericWorkpaperTable data={data} />
      <div className="rounded-xl bg-muted/30 p-3 text-sm font-semibold">Estimated result: {formatMoney(revenue - expenses, currency)}</div>
    </div>
  );
}

function BankReconciliation({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const cashBookBalance = Number(data.cashBookBalance ?? 0);
  const bankStatementBalance = Number(data.bankStatementBalance ?? 0);
  const adjustedCash = cashBookBalance + sumAmounts(data.additions) - sumAmounts(data.deductions);
  const adjustedBank = bankStatementBalance + sumAmounts(data.uncreditedDeposits) - sumAmounts(data.unpresentedCheques);
  return <TrialBalance accounts={[{ name: 'Adjusted cash book balance', debit: adjustedCash, credit: 0 }, { name: 'Adjusted bank statement balance', debit: 0, credit: adjustedBank }]} currency={currency} title="Bank reconciliation" />;
}

function Depreciation({ data, currency }: { data: Record<string, unknown>; currency: string }) { return <FormulaResult title={`${String(data.asset ?? 'Asset')} depreciation`} formula={String(data.method ?? 'straight_line').replace(/_/g, ' ')} result={formatMoney(calculateDepreciation(data), currency)} />; }
function InventoryValuation({ data, currency }: { data: Record<string, unknown>; currency: string }) { const result = calculateInventory(data); return <AccountingTable columns={['Measure', 'Amount']} rows={[[`Cost of goods sold (${String(data.method ?? 'FIFO')})`, formatMoney(result.cogs, currency)], ['Closing inventory', formatMoney(result.closingInventory, currency)]]} />; }
function RatioAnalysis({ data }: { data: Record<string, unknown> }) { const ratios = calculateRatios(data.financialData && typeof data.financialData === 'object' ? data.financialData as Record<string, unknown> : data); return <AccountingTable columns={['Ratio', 'Result', 'Interpretation']} rows={Object.entries(ratios).filter(([, value]) => value > 0).map(([key, value]) => [key.replace(/_/g, ' '), String(value), key.includes('margin') ? `${value}%` : `${value}:1`])} />; }

function ErrorCorrection({ data, currency }: { data: Record<string, unknown>; currency: string }) { const rows = normalizeJournalRows(data.correctionRows ?? data.rows); return <div className="space-y-3"><div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm"><AlertTriangle className="mb-2 size-4" />{String(data.errorDescription ?? 'Describe the accounting error.')}</div><JournalEntryTable rows={rows} currency={currency} /></div>; }

function ProfessionalCase({ data }: { data: Record<string, unknown> }) { const prompts = normalizeTextList(data.required ?? data.prompts ?? data.tasks); return <div className="space-y-3 rounded-2xl border p-4"><div className="font-semibold">{String(data.caseTitle ?? data.businessName ?? 'Professional accounting case')}</div>{data.scenario ? <p className="text-sm leading-6 text-muted-foreground"><MathText text={String(data.scenario)} /></p> : null}<GenericWorkpaperTable data={data} />{prompts.length ? <ol className="space-y-2 text-sm text-muted-foreground">{prompts.map((prompt, index) => <li key={prompt} className="rounded-xl bg-muted/30 p-3">{index + 1}. <MathText text={prompt} /></li>)}</ol> : null}</div>; }

function DoctoralResearchCase({ data, type }: { data: Record<string, unknown>; type: string }) {
  const prompts = normalizeTextList(data.required ?? data.prompts ?? data.tasks);
  const lenses = normalizeTextList(data.theoreticalLens ?? data.theories);
  const variables = normalizeTextList(data.variables ?? data.constructs);
  const validity = normalizeTextList(data.validityThreats ?? data.biasThreats ?? data.limitations);
  return <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4"><div><div className="text-xs font-semibold uppercase tracking-wide text-primary">Doctoral accounting research studio · {type.replace(/_/g, ' ')}</div><h4 className="mt-1 text-base font-semibold"><MathText text={String(data.caseTitle ?? data.researchProblem ?? 'Doctoral research case')} /></h4></div>{data.scenario ? <p className="text-sm leading-6 text-muted-foreground"><MathText text={String(data.scenario)} /></p> : null}<GenericWorkpaperTable data={data} /><div className="grid gap-3 md:grid-cols-2"><ResearchPanel title="Theory / lens" items={lenses} fallback={String(data.theory ?? 'State the theory or theoretical lens.')} /><ResearchPanel title="Variables / constructs" items={variables} fallback={String(data.measurement ?? 'Define constructs, proxies, and measurement logic.')} /><ResearchPanel title="Methodology" items={normalizeTextList(data.methodology ?? data.methods)} fallback={String(data.methodology ?? 'Explain research design, sample, data, and analysis method.')} /><ResearchPanel title="Validity and limitations" items={validity} fallback={String(data.limitations ?? 'Discuss validity, reliability, bias, endogeneity, ethics, and limitations.')} /></div>{prompts.length ? <ol className="space-y-2 text-sm text-muted-foreground">{prompts.map((prompt, index) => <li key={prompt} className="rounded-xl bg-background/70 p-3">{index + 1}. <MathText text={prompt} /></li>)}</ol> : null}</div>;
}

function ResearchPanel({ title, items, fallback }: { title: string; items: string[]; fallback: string }) { return <div className="rounded-xl border bg-background/70 p-3"><div className="mb-2 text-sm font-semibold">{title}</div>{items.length ? <ul className="space-y-1 text-xs leading-5 text-muted-foreground">{items.map((item) => <li key={item}>• <MathText text={item} /></li>)}</ul> : <p className="text-xs leading-5 text-muted-foreground"><MathText text={fallback} /></p>}</div>; }

function BusinessSimulation({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const transactions = Array.isArray(data.transactions) ? data.transactions.map(String) : [];
  const stages = normalizeTextList(data.stages).length ? normalizeTextList(data.stages) : ['Record journals', 'Post ledgers', 'Prepare trial balance', 'Make adjustments', 'Prepare statements', 'Interpret performance'];
  return <div className="space-y-3 rounded-2xl border p-4"><div className="flex items-center gap-2 font-semibold"><BriefcaseBusiness className="size-4" /> {String(data.businessName ?? 'Accounting business simulator')}</div><GenericWorkpaperTable data={data} /><div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]"><ol className="space-y-2 text-sm text-muted-foreground">{transactions.map((transaction, index) => <li key={transaction} className="rounded-xl bg-muted/30 p-3">{index + 1}. <MathText text={transaction.replace(/K([0-9,]+)/g, `${currency} $1`)} /></li>)}</ol><div className="rounded-xl border bg-background p-3"><div className="mb-2 text-sm font-semibold">Simulation stages</div><ol className="space-y-2 text-xs text-muted-foreground">{stages.map((stage, index) => <li key={stage}>{index + 1}. {stage}</li>)}</ol></div></div></div>;
}

function MarkingScheme({ totalMarks, items }: { totalMarks: number; items: { description: string; marks: number }[] }) { return <AccountingTable columns={['Marking point', 'Marks']} rows={items.map((item) => [item.description, String(item.marks)]).concat([['Total', String(totalMarks)]])} />; }
function BalanceBanner({ balanced, debit, credit, currency }: { balanced: boolean; debit: number; credit: number; currency: string }) { return <div className={`rounded-xl border p-3 text-sm ${balanced ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-destructive/30 bg-destructive/10'}`}><div className="flex items-center gap-2 font-medium">{balanced ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />} {balanced ? 'Balanced' : 'Not balanced'}</div><p className="mt-1 text-muted-foreground">Debit: {formatMoney(debit, currency)} · Credit: {formatMoney(credit, currency)}</p></div>; }
function FormulaResult({ title, formula, result }: { title: string; formula: string; result: string }) { return <div className="rounded-2xl border p-4"><div className="font-semibold">{title}</div><div className="mt-2 rounded-xl bg-muted/30 p-3 text-sm">{formula}</div><div className="mt-3 text-lg font-semibold">{result}</div></div>; }
function AccountingTable({ columns, rows }: { columns: string[]; rows: unknown[][] }) { return <div className="min-w-0 overflow-hidden rounded-2xl border"><table className="w-full table-fixed text-[11px] sm:text-sm"><thead className="bg-muted/50"><tr>{columns.map((column) => <th key={column} className="break-words px-2 py-2 text-left align-top font-semibold sm:px-3">{column}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-t">{row.map((cell, cellIndex) => <td key={cellIndex} className="break-words px-2 py-2 align-top text-muted-foreground sm:px-3">{String(cell ?? '')}</td>)}</tr>)}</tbody></table></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-muted/30 p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div><div className="font-medium">{value}</div></div>; }
function sumAmounts(value: unknown) { if (!Array.isArray(value)) return 0; return value.reduce((sum, item) => sum + Number((typeof item === 'object' && item !== null ? (item as Record<string, unknown>).amount : item) ?? 0), 0); }
