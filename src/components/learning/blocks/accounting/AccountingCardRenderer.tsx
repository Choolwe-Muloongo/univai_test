'use client';

import type { ReactNode } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Landmark,
  ListChecks,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { MathText } from '@/components/learning/math-text';
import type { BlockRendererProps } from '../schemas';
import { AnimatedAccountingTable } from './AnimatedAccountingTable';
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

const accountingSectionLabels: Record<string, string> = {
  accounting_journal_entry: 'Journal entry',
  accounting_t_account: 'T-account',
  accounting_ledger: 'Ledger posting',
  accounting_cashbook: 'Cash book',
  accounting_control_account: 'Control account',
  accounting_trial_balance: 'Trial balance',
  accounting_statement: 'Financial statement',
  accounting_bank_reconciliation: 'Bank reconciliation',
  accounting_inventory: 'Inventory valuation',
  accounting_depreciation: 'Depreciation',
  accounting_ratio_analysis: 'Ratio analysis',
  accounting_exam_question: 'Accounting workspace',
};

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
  const sectionType = String(payload.type ?? 'accounting_journal_entry');
  const sectionLabel = accountingSectionLabels[sectionType] ?? definition.label;
  const title = String(payload.title ?? data.title ?? definition.label);
  const currency = String(data.currency ?? 'ZMW');
  const body = renderAccountingBody(content.accountingType, data, currency);

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-3xl border bg-background shadow-sm">
      <header className="min-w-0 space-y-3 border-b bg-gradient-to-br from-muted/40 via-background to-primary/5 p-4 sm:p-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="secondary" className="max-w-full truncate rounded-full">{sectionLabel}</Badge>
          <Badge variant="outline" className="max-w-full truncate rounded-full capitalize">{content.accountingType.replace(/_/g, ' ')}</Badge>
          <Badge variant="outline" className="rounded-full capitalize">{content.difficulty}</Badge>
          <Badge variant="outline" className="rounded-full">Accounting workspace</Badge>
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="break-words text-xl font-semibold tracking-tight"><MathText text={title} /></h3>
          {payload.body ? <p className="max-w-3xl break-words text-sm leading-6 text-muted-foreground"><MathText text={String(payload.body)} /></p> : null}
        </div>
      </header>

      <div className="min-w-0 max-w-full space-y-4 overflow-hidden p-4 sm:p-5">
        {renderAccountingSection(sectionType, content, body)}
      </div>
    </div>
  );
}

export function AccountingCardPreviewRenderer(props: BlockRendererProps) {
  return (
    <div className="rounded-2xl border bg-muted/20 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <BadgeCheck className="h-4 w-4 shrink-0" />
        Accounting workspace preview
      </div>
      <AccountingCardRenderer {...props} />
    </div>
  );
}

function renderAccountingSection(
  sectionType: string,
  content: ReturnType<typeof getAccountingContent>,
  body: ReactNode,
) {
  if (sectionType === 'accounting_exam_question') {
    return <StudentAccountingWorkbench content={content} currency={String(content.data.currency ?? 'ZMW')} />;
  }
  return <FocusedAccountingPanel title={accountingSectionLabels[sectionType] ?? 'Accounting workspace'}>{body}</FocusedAccountingPanel>;
}

function FocusedAccountingPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border bg-muted/10 p-3 sm:p-4">
      <div className="mb-3 flex min-w-0 items-center gap-2 text-sm font-semibold">
        <ListChecks className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 break-words">{title}</span>
      </div>
      <div className="min-w-0 max-w-full overflow-hidden">{children}</div>
    </section>
  );
}

function renderAccountingBody(type: string, data: Record<string, unknown>, currency: string) {
  if (doctoralResearchTypes.has(type)) return <ProfessionalCase data={data} />;

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
    case 'exam_practice':
    case 'case_study': return <ProfessionalCase data={data} />;
    case 'business_simulation': return <BusinessSimulation data={data} currency={currency} />;
    default: return <ConceptCard data={data} />;
  }
}

function ConceptCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex min-w-0 items-center gap-2 font-semibold">
        <Landmark className="h-4 w-4 shrink-0" />
        <span className="min-w-0 break-words">{String(data.concept ?? 'Accounting concept')}</span>
      </div>
      {data.explanation ? <p className="break-words text-sm leading-6 text-muted-foreground"><MathText text={String(data.explanation)} /></p> : null}
      {data.example ? <p className="break-words rounded-xl bg-background/70 p-3 text-sm"><MathText text={String(data.example)} /></p> : null}
      {Array.isArray(data.teacherNotes) ? <MiniList title="Teacher guide" items={normalizeTextList(data.teacherNotes)} /> : null}
      {Array.isArray(data.commonMistakes) ? <MiniList title="Common mistakes" items={normalizeTextList(data.commonMistakes)} /> : null}
      <GenericWorkpaperTable data={data} />
    </div>
  );
}

function TransactionScenario({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const accounts = Array.isArray(data.expectedAccounts) ? data.expectedAccounts.map(String) : [];
  const required = normalizeTextList(data.required);
  return (
    <div className="grid gap-3 md:grid-cols-[1.3fr_.7fr]">
      <div className="rounded-2xl border p-4">
        <div className="mb-2 text-sm font-semibold">Business event</div>
        <p className="break-words text-sm leading-6 text-muted-foreground"><MathText text={String(data.description ?? data.scenario ?? data.question ?? 'Add a realistic transaction scenario.')} /></p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Info label="Business" value={String(data.businessName ?? 'Business')} />
          <Info label="Date" value={String(data.transactionDate ?? 'Date')} />
          <Info label="Amount" value={formatMoney(data.amount, currency)} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="rounded-2xl border bg-muted/20 p-4">
          <div className="mb-2 text-sm font-semibold">Accounts to identify</div>
          <div className="flex flex-wrap gap-2">{accounts.length ? accounts.map((account) => <Badge key={account} variant="outline">{account}</Badge>) : <span className="text-sm text-muted-foreground">Use the business event to identify affected accounts.</span>}</div>
        </div>
        {required.length ? <MiniList title="Required" items={required} /> : null}
      </div>
    </div>
  );
}

function JournalEntryTable({ rows, currency }: { rows: ReturnType<typeof normalizeJournalRows>; currency: string }) {
  const totals = calculateJournalTotals(rows);
  const balanced = totals.debit === totals.credit && totals.debit > 0;
  return (
    <div className="space-y-3">
      <AccountingTable title="Journal entry" columns={['Professional account', 'Debit', 'Credit']} rows={rows.map((row) => [row.account, row.debit ? formatMoney(row.debit, currency) : '', row.credit ? formatMoney(row.credit, currency) : ''])} />
      <BalanceBanner balanced={balanced} debit={totals.debit} credit={totals.credit} currency={currency} />
    </div>
  );
}

function LedgerAccount({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const debitEntries = normalizeLedgerEntries(data.debitEntries);
  const creditEntries = normalizeLedgerEntries(data.creditEntries);
  const rows = Array.from({ length: Math.max(debitEntries.length, creditEntries.length, 1) }).map((_, index) => [
    debitEntries[index]?.details ?? '',
    debitEntries[index]?.amount ? formatMoney(debitEntries[index]?.amount, currency) : '',
    creditEntries[index]?.details ?? '',
    creditEntries[index]?.amount ? formatMoney(creditEntries[index]?.amount, currency) : '',
  ]);
  return <div className="rounded-2xl border p-4"><div className="mb-3 text-center font-semibold">{String(data.accountName ?? 'Ledger Account')}</div><AccountingTable title={String(data.accountName ?? 'Ledger Account')} columns={['Debit details', 'Debit amount', 'Credit details', 'Credit amount']} rows={rows} /></div>;
}

function TrialBalance({ accounts, currency, title }: { accounts: ReturnType<typeof normalizeTrialBalanceAccounts>; currency: string; title: string }) {
  const totals = calculateTrialBalanceTotals(accounts);
  return (
    <div className="space-y-3">
      <AccountingTable title={title} columns={['Account', 'Debit', 'Credit']} rows={accounts.map((account) => [account.name, account.debit ? formatMoney(account.debit, currency) : '', account.credit ? formatMoney(account.credit, currency) : '']).concat([[`${title} totals`, formatMoney(totals.debit, currency), formatMoney(totals.credit, currency)]])} />
      <BalanceBanner balanced={totals.debit === totals.credit && totals.debit > 0} debit={totals.debit} credit={totals.credit} currency={currency} />
    </div>
  );
}

function FinancialStatement({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const sections = normalizeStatementSections(data.sections);
  const totals = calculateStatementTotal(sections);
  const revenue = totals.find((section) => /revenue|sales/i.test(section.title))?.amount ?? 0;
  const expenses = totals.filter((section) => /expense|cost/i.test(section.title)).reduce((sum, section) => sum + section.amount, 0);
  return (
    <div className="space-y-4 rounded-2xl border p-4">
      <div className="text-center"><div className="font-semibold">{String(data.businessName ?? 'Business')}</div><div className="text-sm text-muted-foreground">{String(data.statementType ?? 'Financial statement').replace(/_/g, ' ')}</div><div className="text-xs text-muted-foreground">{String(data.period ?? '')}</div></div>
      {sections.map((section) => <div key={section.title}><div className="mb-2 font-semibold">{section.title}</div><AccountingTable title={section.title} columns={['Item', 'Amount']} rows={section.items.map((item) => [item.name, formatMoney(item.amount, currency)])} /></div>)}
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

function ProfessionalCase({ data }: { data: Record<string, unknown> }) {
  const prompts = normalizeTextList(data.required ?? data.prompts ?? data.tasks);
  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div className="font-semibold">{String(data.caseTitle ?? data.businessName ?? 'Professional accounting case')}</div>
      {data.scenario ? <p className="break-words text-sm leading-6 text-muted-foreground"><MathText text={String(data.scenario)} /></p> : null}
      <GenericWorkpaperTable data={data} />
      {prompts.length ? <ol className="space-y-2 text-sm text-muted-foreground">{prompts.slice(0, 4).map((prompt, index) => <li key={prompt} className="rounded-xl bg-muted/30 p-3">{index + 1}. <MathText text={prompt} /></li>)}</ol> : null}
      {data.evidenceStandard ? <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground"><strong>Evidence standard:</strong> <MathText text={String(data.evidenceStandard)} /></div> : null}
    </div>
  );
}

function BusinessSimulation({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const transactions = Array.isArray(data.transactions) ? data.transactions.map(String) : [];
  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div className="flex min-w-0 items-center gap-2 font-semibold"><BriefcaseBusiness className="h-4 w-4 shrink-0" /> <span className="min-w-0 break-words">{String(data.businessName ?? 'Accounting business simulator')}</span></div>
      <GenericWorkpaperTable data={data} />
      {transactions.length ? <ol className="space-y-2 text-sm text-muted-foreground">{transactions.slice(0, 4).map((transaction, index) => <li key={transaction} className="rounded-xl bg-muted/30 p-3">{index + 1}. <MathText text={transaction.replace(/K([0-9,]+)/g, `${currency} $1`)} /></li>)}</ol> : null}
    </div>
  );
}

function GenericWorkpaperTable({ data }: { data: Record<string, unknown> }) {
  if (!Array.isArray(data.columns) || !Array.isArray(data.rows)) return null;
  return <AccountingTable title={String(data.tableKind ?? 'Accounting workpaper')} columns={data.columns.map(String)} rows={(data.rows as unknown[]).map((row) => Array.isArray(row) ? row : [row])} />;
}

function Depreciation({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  return <FormulaResult title={`${String(data.asset ?? 'Asset')} depreciation`} formula={String(data.method ?? 'straight_line').replace(/_/g, ' ')} result={formatMoney(calculateDepreciation(data), currency)} />;
}

function InventoryValuation({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const result = calculateInventory(data);
  return <AccountingTable title="Inventory valuation" columns={['Measure', 'Amount']} rows={[[`Cost of goods sold (${String(data.method ?? 'FIFO')})`, formatMoney(result.cogs, currency)], ['Closing inventory', formatMoney(result.closingInventory, currency)]]} />;
}

function RatioAnalysis({ data }: { data: Record<string, unknown> }) {
  const ratios = calculateRatios(data.financialData && typeof data.financialData === 'object' ? data.financialData as Record<string, unknown> : data);
  return <AccountingTable title="Ratio analysis" columns={['Ratio', 'Result', 'Interpretation']} rows={Object.entries(ratios).filter(([, value]) => value > 0).map(([key, value]) => [key.replace(/_/g, ' '), String(value), key.includes('margin') ? `${value}%` : `${value}:1`])} />;
}

function ErrorCorrection({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const rows = normalizeJournalRows(data.correctionRows ?? data.rows);
  return <div className="space-y-3"><div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm"><AlertTriangle className="mb-2 h-4 w-4" />{String(data.errorDescription ?? 'Describe the accounting error.')}</div><JournalEntryTable rows={rows} currency={currency} /></div>;
}

function BalanceBanner({ balanced, debit, credit, currency }: { balanced: boolean; debit: number; credit: number; currency: string }) {
  return <div className={`rounded-xl border p-3 text-sm ${balanced ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-destructive/30 bg-destructive/10'}`}><div className="flex items-center gap-2 font-medium">{balanced ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />} {balanced ? 'Balanced' : 'Not balanced'}</div><p className="mt-1 text-muted-foreground">Debit: {formatMoney(debit, currency)} · Credit: {formatMoney(credit, currency)}</p></div>;
}

function FormulaResult({ title, formula, result }: { title: string; formula: string; result: string }) {
  return <div className="rounded-2xl border p-4"><div className="font-semibold">{title}</div><div className="mt-2 rounded-xl bg-muted/30 p-3 text-sm">{formula}</div><div className="mt-3 text-lg font-semibold">{result}</div></div>;
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <div className="rounded-2xl border bg-muted/10 p-4"><div className="mb-2 text-sm font-semibold text-primary">{title}</div><ul className="space-y-2 text-sm text-muted-foreground">{items.slice(0, 8).map((item) => <li key={item} className="break-words rounded-xl bg-background/70 p-2"><MathText text={item} /></li>)}</ul></div>;
}

function AccountingTable({ columns, rows, title = 'Accounting table' }: { columns: string[]; rows: unknown[][]; title?: string }) {
  return <AnimatedAccountingTable title={title} columns={columns} rows={rows} />;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted/30 p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div><div className="break-words font-medium">{value}</div></div>;
}

function sumAmounts(value: unknown) {
  if (!Array.isArray(value)) return 0;
  return value.reduce((sum, item) => sum + Number((typeof item === 'object' && item !== null ? (item as Record<string, unknown>).amount : item) ?? 0), 0);
}
