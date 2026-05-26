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
  calculateTrialBalanceTotals,
  formatMoney,
  getAccountingContent,
  normalizeJournalRows,
  normalizeLedgerEntries,
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
  accounting_statement: 'Professional statement',
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

type AmountItem = { name: string; amount: number; note?: string };
type StatementSection = { title: string; items: AmountItem[]; subtotalLabel?: string };
type TableRow = Array<ReactNode>;

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
    case 'trial_balance': return <ProfessionalTrialBalance data={data} currency={currency} />;
    case 'financial_statement':
    case 'cash_flow_statement':
    case 'consolidation': return <ProfessionalStatementRouter data={data} currency={currency} />;
    case 'bank_reconciliation': return <BankReconciliation data={data} currency={currency} />;
    case 'depreciation': return <DepreciationSchedule data={data} currency={currency} />;
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

function ProfessionalStatementRouter({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const statementType = normalizeKey(data.statementType ?? data.tableKind ?? data.format ?? 'income_statement');
  if (statementType.includes('balance') || statementType.includes('financial_position')) return <StatementOfFinancialPosition data={data} currency={currency} />;
  if (statementType.includes('manufacturing')) return <ManufacturingAccount data={data} currency={currency} />;
  if (statementType.includes('cash_flow')) return <CashFlowStatement data={data} currency={currency} />;
  if (statementType.includes('bank_reconciliation')) return <BankReconciliation data={data} currency={currency} />;
  if (statementType.includes('vat')) return <VatAccount data={data} currency={currency} />;
  if (statementType.includes('day_book') || statementType.includes('sales_day') || statementType.includes('purchase_day')) return <DayBook data={data} currency={currency} />;
  if (statementType.includes('cash_book')) return <CashBook data={data} currency={currency} />;
  if (statementType.includes('disposal')) return <AssetDisposalAccount data={data} currency={currency} />;
  if (statementType.includes('partnership') || statementType.includes('appropriation')) return <PartnershipAccount data={data} currency={currency} />;
  if (statementType.includes('current_account')) return <PartnerCurrentAccounts data={data} currency={currency} />;
  if (statementType.includes('equity') || statementType.includes('reserve')) return <CompanyEquityStatement data={data} currency={currency} />;
  if (statementType.includes('ratio')) return <RatioAnalysis data={data} />;
  return <IncomeStatement data={data} currency={currency} />;
}

function StatementHeader({ data, defaultTitle }: { data: Record<string, unknown>; defaultTitle: string }) {
  const businessName = text(data.businessName ?? data.entityName ?? data.name, 'Business Name');
  const title = text(data.statementTitle ?? data.title ?? data.statementType, defaultTitle).replace(/_/g, ' ');
  const period = text(data.period ?? data.periodLabel ?? data.date ?? data.asAt, '');
  return (
    <div className="mb-4 text-center leading-tight">
      <div className="break-words text-base font-bold uppercase tracking-wide"><MathText text={businessName} /></div>
      <div className="mt-1 break-words text-sm font-semibold capitalize"><MathText text={title} /></div>
      {period ? <div className="mt-1 break-words text-xs text-muted-foreground"><MathText text={period} /></div> : null}
    </div>
  );
}

function ProfessionalTable({ columns, rows, footRows = [] }: { columns: ReactNode[]; rows: TableRow[]; footRows?: TableRow[] }) {
  return (
    <div className="max-w-full overflow-x-auto rounded-2xl border bg-background">
      <table className="min-w-[680px] w-full border-collapse text-sm">
        <thead className="bg-muted/50">
          <tr>{columns.map((column, index) => <th key={index} className="border-b px-3 py-2 text-left font-semibold">{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b last:border-b-0">{row.map((cell, cellIndex) => <td key={cellIndex} className={`px-3 py-2 align-top ${cellIndex > 0 ? 'text-right tabular-nums' : ''}`}>{cell}</td>)}</tr>)}
        </tbody>
        {footRows.length ? <tfoot className="bg-muted/40 font-semibold">{footRows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className={`border-t px-3 py-2 ${cellIndex > 0 ? 'text-right tabular-nums' : ''}`}>{cell}</td>)}</tr>)}</tfoot> : null}
      </table>
    </div>
  );
}

function SectionedStatement({ sections, currency }: { sections: StatementSection[]; currency: string }) {
  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const total = section.items.reduce((sum, item) => sum + item.amount, 0);
        return (
          <div key={section.title} className="space-y-2">
            <p className="font-semibold"><MathText text={section.title} /></p>
            <ProfessionalTable
              columns={['Item', currency]}
              rows={section.items.map((item) => [<MathText key={item.name} text={item.name} />, money(item.amount, currency)])}
              footRows={[[section.subtotalLabel ?? `Total ${section.title}`, money(total, currency)]]}
            />
          </div>
        );
      })}
    </div>
  );
}

function ProfessionalTrialBalance({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const accounts = normalizeTrialBalanceAccounts(data.accounts);
  const totals = calculateTrialBalanceTotals(accounts);
  return (
    <div className="rounded-2xl border bg-background p-4">
      <StatementHeader data={{ ...data, statementTitle: data.statementTitle ?? 'Trial Balance' }} defaultTitle="Trial Balance" />
      <ProfessionalTable
        columns={['Account Name', `Dr (${currency})`, `Cr (${currency})`]}
        rows={accounts.map((account) => [account.name, account.debit ? money(account.debit, currency) : '', account.credit ? money(account.credit, currency) : ''])}
        footRows={[[text(data.totalLabel, 'Total'), money(totals.debit, currency), money(totals.credit, currency)]]}
      />
      <div className="mt-3"><BalanceBanner balanced={totals.debit === totals.credit && totals.debit > 0} debit={totals.debit} credit={totals.credit} currency={currency} /></div>
    </div>
  );
}

function IncomeStatement({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const sections = statementSections(data, [
    { title: 'Revenue', items: recordsToAmountItems(data.revenue ?? data.sales ?? []) },
    { title: 'Cost of sales', items: recordsToAmountItems(data.costOfSales ?? []) },
    { title: 'Expenses', items: recordsToAmountItems(data.expenses ?? []) },
  ]).filter((section) => section.items.length);
  const revenue = sectionTotal(sections.find((section) => /revenue|sales/i.test(section.title)));
  const costOfSales = sectionTotal(sections.find((section) => /cost/i.test(section.title)));
  const expenses = sections.filter((section) => /expense/i.test(section.title)).reduce((sum, section) => sum + sectionTotal(section), 0);
  return (
    <div className="rounded-2xl border bg-background p-4">
      <StatementHeader data={{ ...data, statementTitle: data.statementTitle ?? 'Income Statement' }} defaultTitle="Income Statement" />
      <SectionedStatement sections={sections} currency={currency} />
      <ProfessionalTable
        columns={['Summary', currency]}
        rows={[
          ['Gross profit', money(revenue - costOfSales, currency)],
          ['Net profit', money(revenue - costOfSales - expenses, currency)],
        ]}
      />
    </div>
  );
}

function StatementOfFinancialPosition({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const sections = statementSections(data, [
    { title: 'Non-current assets', items: recordsToAmountItems(data.nonCurrentAssets ?? data.fixedAssets ?? []) },
    { title: 'Current assets', items: recordsToAmountItems(data.currentAssets ?? []) },
    { title: 'Capital / Equity', items: recordsToAmountItems(data.equity ?? data.capital ?? []) },
    { title: 'Non-current liabilities', items: recordsToAmountItems(data.nonCurrentLiabilities ?? []) },
    { title: 'Current liabilities', items: recordsToAmountItems(data.currentLiabilities ?? data.liabilities ?? []) },
  ]).filter((section) => section.items.length);
  const assetTotal = sections.filter((section) => /asset/i.test(section.title)).reduce((sum, section) => sum + sectionTotal(section), 0);
  const capitalLiabilityTotal = sections.filter((section) => !/asset/i.test(section.title)).reduce((sum, section) => sum + sectionTotal(section), 0);
  return (
    <div className="rounded-2xl border bg-background p-4">
      <StatementHeader data={{ ...data, statementTitle: data.statementTitle ?? 'Statement of Financial Position' }} defaultTitle="Statement of Financial Position" />
      {assetScheduleRows(data).length ? <AssetSchedule data={data} currency={currency} /> : null}
      <SectionedStatement sections={sections} currency={currency} />
      <ProfessionalTable columns={['Check', currency]} rows={[[text(data.totalAssetsLabel, 'Total assets'), money(assetTotal, currency)], [text(data.totalEquityLiabilitiesLabel, 'Total capital and liabilities'), money(capitalLiabilityTotal, currency)]]} />
    </div>
  );
}

function AssetSchedule({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  return (
    <div className="mb-4 space-y-2">
      <p className="font-semibold">Non-current assets schedule</p>
      <ProfessionalTable
        columns={['Asset', `Cost (${currency})`, `Depreciation (${currency})`, `Net book value (${currency})`]}
        rows={assetScheduleRows(data).map((asset) => [asset.name, money(asset.cost, currency), money(asset.depreciation, currency), money(asset.cost - asset.depreciation, currency)])}
      />
    </div>
  );
}

function ManufacturingAccount({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const sections = statementSections(data, [
    { title: 'Raw materials', items: recordsToAmountItems(data.rawMaterials ?? []) },
    { title: 'Direct labour', items: recordsToAmountItems(data.directLabour ?? data.directLabor ?? []) },
    { title: 'Direct expenses', items: recordsToAmountItems(data.directExpenses ?? []) },
    { title: 'Production overheads', items: recordsToAmountItems(data.productionOverheads ?? data.factoryOverheads ?? []) },
    { title: 'Work in progress', items: recordsToAmountItems(data.workInProgress ?? []) },
  ]).filter((section) => section.items.length);
  const productionCost = sections.reduce((sum, section) => sum + sectionTotal(section), 0);
  return (
    <div className="rounded-2xl border bg-background p-4">
      <StatementHeader data={{ ...data, statementTitle: data.statementTitle ?? 'Manufacturing Account' }} defaultTitle="Manufacturing Account" />
      <SectionedStatement sections={sections} currency={currency} />
      <ProfessionalTable columns={['Summary', currency]} rows={[[text(data.productionCostLabel, 'Production cost of goods completed'), money(productionCost, currency)]]} />
    </div>
  );
}

function CashFlowStatement({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const sections = statementSections(data, [
    { title: 'Cash flows from operating activities', items: recordsToAmountItems(data.operatingActivities ?? []) },
    { title: 'Cash flows from investing activities', items: recordsToAmountItems(data.investingActivities ?? []) },
    { title: 'Cash flows from financing activities', items: recordsToAmountItems(data.financingActivities ?? []) },
  ]).filter((section) => section.items.length);
  const netChange = sections.reduce((sum, section) => sum + sectionTotal(section), 0);
  return (
    <div className="rounded-2xl border bg-background p-4">
      <StatementHeader data={{ ...data, statementTitle: data.statementTitle ?? 'Cash Flow Statement' }} defaultTitle="Cash Flow Statement" />
      <SectionedStatement sections={sections} currency={currency} />
      <ProfessionalTable columns={['Cash movement', currency]} rows={[[text(data.netChangeLabel, 'Net increase / decrease in cash'), money(netChange, currency)], ['Opening cash and cash equivalents', money(num(data.openingCash), currency)], ['Closing cash and cash equivalents', money(num(data.openingCash) + netChange, currency)]]} />
    </div>
  );
}

function BankReconciliation({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const cashBookBalance = num(data.cashBookBalance);
  const bankStatementBalance = num(data.bankStatementBalance);
  const adjustedCash = cashBookBalance + sumAmounts(data.additions) - sumAmounts(data.deductions);
  const adjustedBank = bankStatementBalance + sumAmounts(data.uncreditedDeposits) - sumAmounts(data.unpresentedCheques);
  return (
    <div className="rounded-2xl border bg-background p-4">
      <StatementHeader data={{ ...data, statementTitle: data.statementTitle ?? 'Bank Reconciliation Statement' }} defaultTitle="Bank Reconciliation Statement" />
      <ProfessionalTable columns={['Cash book reconciliation', currency]} rows={[
        ['Balance as per cash book', money(cashBookBalance, currency)],
        ['Add: direct credits / interest received', money(sumAmounts(data.additions), currency)],
        ['Less: bank charges / direct debits', money(-sumAmounts(data.deductions), currency)],
        ['Adjusted cash book balance', money(adjustedCash, currency)],
      ]} />
      <div className="mt-4" />
      <ProfessionalTable columns={['Bank statement reconciliation', currency]} rows={[
        ['Balance as per bank statement', money(bankStatementBalance, currency)],
        ['Add: uncredited deposits', money(sumAmounts(data.uncreditedDeposits), currency)],
        ['Less: unpresented cheques', money(-sumAmounts(data.unpresentedCheques), currency)],
        ['Adjusted bank statement balance', money(adjustedBank, currency)],
      ]} />
      <div className="mt-3"><BalanceBanner balanced={adjustedCash === adjustedBank} debit={adjustedCash} credit={adjustedBank} currency={currency} /></div>
    </div>
  );
}

function VatAccount({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  return <LedgerLikeAccount title="Value Added Tax Account" data={data} currency={currency} debitLabel="Input VAT / VAT recoverable" creditLabel="Output VAT / VAT payable" />;
}

function CashBook({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const debitEntries = ledgerEntries(data.debitEntries ?? data.receipts);
  const creditEntries = ledgerEntries(data.creditEntries ?? data.payments);
  const rows = Array.from({ length: Math.max(debitEntries.length, creditEntries.length, 1) }).map((_, index) => [
    debitEntries[index]?.date ?? '', debitEntries[index]?.details ?? '', money(debitEntries[index]?.cash, currency), money(debitEntries[index]?.bank ?? debitEntries[index]?.amount, currency),
    creditEntries[index]?.date ?? '', creditEntries[index]?.details ?? '', money(creditEntries[index]?.cash, currency), money(creditEntries[index]?.bank ?? creditEntries[index]?.amount, currency),
  ]);
  return (
    <div className="rounded-2xl border bg-background p-4">
      <StatementHeader data={{ ...data, statementTitle: data.statementTitle ?? 'Cash Book' }} defaultTitle="Cash Book" />
      <ProfessionalTable columns={['Dr Date', 'Details', `Cash (${currency})`, `Bank (${currency})`, 'Cr Date', 'Details', `Cash (${currency})`, `Bank (${currency})`]} rows={rows} />
    </div>
  );
}

function DayBook({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const entries = records(data.entries ?? data.rows ?? data.transactions);
  return (
    <div className="rounded-2xl border bg-background p-4">
      <StatementHeader data={{ ...data, statementTitle: data.statementTitle ?? data.tableKind ?? 'Day Book' }} defaultTitle="Day Book" />
      <ProfessionalTable columns={['Date', 'Name', 'Invoice / Note No.', `Net (${currency})`, `VAT (${currency})`, `Gross (${currency})`]} rows={entries.map((entry) => [text(entry.date), text(entry.name ?? entry.customer ?? entry.supplier), text(entry.invoiceNo ?? entry.noteNo ?? entry.reference), money(num(entry.net), currency), money(num(entry.vat), currency), money(num(entry.gross ?? num(entry.net) + num(entry.vat)), currency)])} />
    </div>
  );
}

function AssetDisposalAccount({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  return <LedgerLikeAccount title="Asset Disposal Account" data={data} currency={currency} debitLabel="Debit" creditLabel="Credit" />;
}

function LedgerLikeAccount({ title, data, currency, debitLabel, creditLabel }: { title: string; data: Record<string, unknown>; currency: string; debitLabel: string; creditLabel: string }) {
  const debitEntries = ledgerEntries(data.debitEntries);
  const creditEntries = ledgerEntries(data.creditEntries);
  const rows = Array.from({ length: Math.max(debitEntries.length, creditEntries.length, 1) }).map((_, index) => [
    debitEntries[index]?.date ?? '', debitEntries[index]?.details ?? debitLabel, money(debitEntries[index]?.amount, currency),
    creditEntries[index]?.date ?? '', creditEntries[index]?.details ?? creditLabel, money(creditEntries[index]?.amount, currency),
  ]);
  return (
    <div className="rounded-2xl border bg-background p-4">
      <StatementHeader data={{ ...data, statementTitle: data.statementTitle ?? title }} defaultTitle={title} />
      <ProfessionalTable columns={['Dr Date', 'Details', currency, 'Cr Date', 'Details', currency]} rows={rows} />
    </div>
  );
}

function PartnershipAccount({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const sections = statementSections(data, [
    { title: 'Profit appropriation', items: recordsToAmountItems(data.appropriation ?? data.items ?? []) },
    { title: 'Profit sharing', items: recordsToAmountItems(data.profitSharing ?? []) },
  ]).filter((section) => section.items.length);
  return <div className="rounded-2xl border bg-background p-4"><StatementHeader data={{ ...data, statementTitle: data.statementTitle ?? 'Partnership Appropriation Account' }} defaultTitle="Partnership Appropriation Account" /><SectionedStatement sections={sections} currency={currency} /></div>;
}

function PartnerCurrentAccounts({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const partners = normalizeTextList(data.partners);
  const rows = records(data.rows).map((row) => [text(row.label ?? row.item), ...partners.map((partner) => money(num(row[partner]), currency))]);
  return <div className="rounded-2xl border bg-background p-4"><StatementHeader data={{ ...data, statementTitle: data.statementTitle ?? 'Partner Current Accounts' }} defaultTitle="Partner Current Accounts" /><ProfessionalTable columns={['Item', ...partners]} rows={rows} /></div>;
}

function CompanyEquityStatement({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const columns = normalizeTextList(data.columns).length ? normalizeTextList(data.columns) : ['Share Capital', 'Retained Earnings', 'General Reserve', 'Total'];
  const rows = records(data.rows).map((row) => [text(row.label ?? row.item), ...columns.map((column) => money(num(row[column] ?? row[normalizeKey(column)]), currency))]);
  return <div className="rounded-2xl border bg-background p-4"><StatementHeader data={{ ...data, statementTitle: data.statementTitle ?? 'Statement of Changes in Equity' }} defaultTitle="Statement of Changes in Equity" /><ProfessionalTable columns={['Movement', ...columns]} rows={rows} /></div>;
}

function JournalEntryTable({ rows, currency }: { rows: ReturnType<typeof normalizeJournalRows>; currency: string }) {
  const totals = calculateJournalTotals(rows);
  const balanced = totals.debit === totals.credit && totals.debit > 0;
  return (
    <div className="space-y-3">
      <ProfessionalTable columns={['Professional account', `Debit (${currency})`, `Credit (${currency})`]} rows={rows.map((row) => [row.account, row.debit ? money(row.debit, currency) : '', row.credit ? money(row.credit, currency) : ''])} footRows={[[text('Total'), money(totals.debit, currency), money(totals.credit, currency)]]} />
      <BalanceBanner balanced={balanced} debit={totals.debit} credit={totals.credit} currency={currency} />
    </div>
  );
}

function LedgerAccount({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  return <LedgerLikeAccount title={text(data.accountName, 'Ledger Account')} data={data} currency={currency} debitLabel="Debit" creditLabel="Credit" />;
}

function ConceptCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex min-w-0 items-center gap-2 font-semibold">
        <Landmark className="h-4 w-4 shrink-0" />
        <span className="min-w-0 break-words">{text(data.concept, 'Accounting concept')}</span>
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
        <p className="break-words text-sm leading-6 text-muted-foreground"><MathText text={text(data.description ?? data.scenario ?? data.question, 'Add a realistic transaction scenario.')} /></p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Info label="Business" value={text(data.businessName, 'Business')} />
          <Info label="Date" value={text(data.transactionDate, 'Date')} />
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

function InventoryValuation({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const result = calculateInventory(data);
  return <ProfessionalTable columns={['Measure', currency]} rows={[[`Cost of goods sold (${text(data.method, 'FIFO')})`, money(result.cogs, currency)], ['Closing inventory', money(result.closingInventory, currency)]]} />;
}

function DepreciationSchedule({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const rows = records(data.assets ?? data.rows);
  if (rows.length) {
    return <ProfessionalTable columns={['Asset', 'Cost', 'Residual value', 'Useful life', 'Method', 'Depreciation', 'Accumulated depreciation', 'Net book value']} rows={rows.map((asset) => {
      const cost = num(asset.cost);
      const depreciation = num(asset.depreciation ?? asset.accumulatedDepreciation ?? calculateDepreciation(asset));
      return [text(asset.name ?? asset.asset), money(cost, currency), money(num(asset.residualValue), currency), text(asset.usefulLifeYears ?? asset.life ?? ''), text(asset.method ?? data.method ?? 'straight line'), money(num(asset.annualDepreciation ?? calculateDepreciation(asset)), currency), money(depreciation, currency), money(cost - depreciation, currency)];
    })} />;
  }
  const cost = num(data.cost);
  const depreciation = calculateDepreciation(data);
  return <ProfessionalTable columns={['Asset', 'Method', 'Depreciation', 'Net book value']} rows={[[text(data.asset, 'Asset'), text(data.method, 'straight line'), money(depreciation, currency), money(cost - depreciation, currency)]]} />;
}

function RatioAnalysis({ data }: { data: Record<string, unknown> }) {
  const ratios = calculateRatios(data.financialData && typeof data.financialData === 'object' ? data.financialData as Record<string, unknown> : data);
  const rows = Object.entries(ratios).filter(([, value]) => value > 0).map(([key, value]) => [key.replace(/_/g, ' '), formulaForRatio(key), String(value), key.includes('margin') ? `${value}%` : `${value}:1`, interpretationForRatio(key, value)]);
  return <ProfessionalTable columns={['Ratio', 'Formula', 'Working', 'Result', 'Interpretation']} rows={rows} />;
}

function ErrorCorrection({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const rows = normalizeJournalRows(data.correctionRows ?? data.rows);
  return <div className="space-y-3"><div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm"><AlertTriangle className="mb-2 h-4 w-4" />{text(data.errorDescription, 'Describe the accounting error.')}</div><JournalEntryTable rows={rows} currency={currency} /></div>;
}

function ProfessionalCase({ data }: { data: Record<string, unknown> }) {
  const prompts = normalizeTextList(data.required ?? data.prompts ?? data.tasks);
  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div className="font-semibold">{text(data.caseTitle ?? data.businessName, 'Professional accounting case')}</div>
      {data.scenario ? <p className="break-words text-sm leading-6 text-muted-foreground"><MathText text={String(data.scenario)} /></p> : null}
      <GenericWorkpaperTable data={data} />
      {prompts.length ? <ol className="space-y-2 text-sm text-muted-foreground">{prompts.slice(0, 6).map((prompt, index) => <li key={prompt} className="rounded-xl bg-muted/30 p-3">{index + 1}. <MathText text={prompt} /></li>)}</ol> : null}
      {data.evidenceStandard ? <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground"><strong>Evidence standard:</strong> <MathText text={String(data.evidenceStandard)} /></div> : null}
    </div>
  );
}

function BusinessSimulation({ data, currency }: { data: Record<string, unknown>; currency: string }) {
  const transactions = Array.isArray(data.transactions) ? data.transactions.map(String) : [];
  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div className="flex min-w-0 items-center gap-2 font-semibold"><BriefcaseBusiness className="h-4 w-4 shrink-0" /> <span className="min-w-0 break-words">{text(data.businessName, 'Accounting business simulator')}</span></div>
      <GenericWorkpaperTable data={data} />
      {transactions.length ? <ol className="space-y-2 text-sm text-muted-foreground">{transactions.slice(0, 4).map((transaction, index) => <li key={transaction} className="rounded-xl bg-muted/30 p-3">{index + 1}. <MathText text={transaction.replace(/K([0-9,]+)/g, `${currency} $1`)} /></li>)}</ol> : null}
    </div>
  );
}

function GenericWorkpaperTable({ data }: { data: Record<string, unknown> }) {
  if (!Array.isArray(data.columns) || !Array.isArray(data.rows)) return null;
  return <ProfessionalTable columns={data.columns.map(String)} rows={(data.rows as unknown[]).map((row) => Array.isArray(row) ? row : [String(row)])} />;
}

function BalanceBanner({ balanced, debit, credit, currency }: { balanced: boolean; debit: number; credit: number; currency: string }) {
  return <div className={`rounded-xl border p-3 text-sm ${balanced ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-destructive/30 bg-destructive/10'}`}><div className="flex items-center gap-2 font-medium">{balanced ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />} {balanced ? 'Balanced' : 'Not balanced'}</div><p className="mt-1 text-muted-foreground">Debit: {money(debit, currency)} · Credit: {money(credit, currency)}</p></div>;
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <div className="rounded-2xl border bg-muted/10 p-4"><div className="mb-2 text-sm font-semibold text-primary">{title}</div><ul className="space-y-2 text-sm text-muted-foreground">{items.slice(0, 8).map((item) => <li key={item} className="break-words rounded-xl bg-background/70 p-2"><MathText text={item} /></li>)}</ul></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted/30 p-3"><div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div><div className="break-words font-medium">{value}</div></div>;
}

function statementSections(data: Record<string, unknown>, fallback: StatementSection[]) {
  const sections = records(data.sections).map((section) => ({ title: text(section.title), subtotalLabel: text(section.subtotalLabel), items: recordsToAmountItems(section.items) })).filter((section) => section.title && section.items.length);
  return sections.length ? sections : fallback;
}

function recordsToAmountItems(value: unknown): AmountItem[] {
  return records(value).map((item) => ({ name: text(item.name ?? item.label ?? item.title ?? item.item), amount: num(item.amount ?? item.value), note: text(item.note) })).filter((item) => item.name || item.amount !== 0);
}

function records(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
}

function ledgerEntries(value: unknown) {
  return records(value).map((entry) => ({ ...entry, date: text(entry.date), details: text(entry.details ?? entry.name ?? entry.label), amount: num(entry.amount), cash: num(entry.cash), bank: num(entry.bank) }));
}

function assetScheduleRows(data: Record<string, unknown>) {
  return records(data.assetSchedule ?? data.nonCurrentAssetSchedule ?? data.fixedAssetSchedule).map((asset) => ({ name: text(asset.name ?? asset.asset), cost: num(asset.cost), depreciation: num(asset.depreciation ?? asset.accumulatedDepreciation) })).filter((asset) => asset.name || asset.cost || asset.depreciation);
}

function sectionTotal(section?: StatementSection) {
  return section?.items.reduce((sum, item) => sum + item.amount, 0) ?? 0;
}

function sumAmounts(value: unknown) {
  if (!Array.isArray(value)) return 0;
  return value.reduce((sum, item) => sum + Number((typeof item === 'object' && item !== null ? (item as Record<string, unknown>).amount : item) ?? 0), 0);
}

function money(value: unknown, currency: string) {
  const amount = num(value);
  if (!amount) return '';
  return formatMoney(amount, currency);
}

function num(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function text(value: unknown, fallback = '') {
  if (value === null || typeof value === 'undefined') return fallback;
  const result = String(value).trim();
  return result || fallback;
}

function normalizeKey(value: unknown) {
  return text(value).toLowerCase().replace(/[\s-]+/g, '_');
}

function formulaForRatio(key: string) {
  if (key.includes('current')) return 'Current assets / Current liabilities';
  if (key.includes('quick')) return '(Current assets - Inventory) / Current liabilities';
  if (key.includes('gross_profit')) return 'Gross profit / Revenue × 100';
  if (key.includes('net_profit')) return 'Net profit / Revenue × 100';
  if (key.includes('return_on_assets')) return 'Net profit / Total assets × 100';
  if (key.includes('debt_to_equity')) return 'Total liabilities / Equity';
  return 'Accounting formula';
}

function interpretationForRatio(key: string, value: number) {
  if (key.includes('current') || key.includes('quick')) return value >= 1 ? 'Can cover short-term obligations.' : 'Liquidity may be weak.';
  if (key.includes('margin')) return value > 0 ? 'Positive profitability indicator.' : 'Profitability needs investigation.';
  if (key.includes('debt_to_equity')) return value > 1 ? 'Higher financial risk from debt.' : 'Lower gearing pressure.';
  return 'Interpret using the business context.';
}
