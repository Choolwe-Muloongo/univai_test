'use client';
import { AccountingShell } from '../AccountingShell';
import type { AccountingVisual } from '../types';

const Metrics = ({ visual }: { visual: AccountingVisual }) => <>{visual.metrics?.map((m) => <div key={m.label} className='rounded-2xl border bg-background p-3'><p className='text-xs text-muted-foreground'>{m.label}</p><p className='text-lg font-bold'>{m.value}</p>{m.note ? <p className='text-xs text-muted-foreground'>{m.note}</p> : null}</div>)}</>;
const Body = ({ visual }: { visual: AccountingVisual }) => <div className='space-y-3'>{visual.explanation ? <p className='text-sm text-muted-foreground'>{visual.explanation}</p> : null}{visual.table ? <table className='w-full text-sm'><thead><tr>{visual.table.columns.map((c) => <th key={c} className='border px-2 py-1 text-left'>{c}</th>)}</tr></thead><tbody>{visual.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className='border px-2 py-1'>{String(c ?? '')}</td>)}</tr>)}</tbody></table> : null}</div>;
const scene = (visual: AccountingVisual) => <AccountingShell visual={visual} title={visual.title} subtitle={visual.subtitle} metrics={<Metrics visual={visual} />}><Body visual={visual} /></AccountingShell>;

export const AccountingIntroScene = ({ visual }: { visual: AccountingVisual }) => scene(visual);
export const AccountingEquationScene = ({ visual }: { visual: AccountingVisual }) => scene(visual);
export const AccountClassificationScene = ({ visual }: { visual: AccountingVisual }) => scene(visual);
export const TransactionScenarioScene = ({ visual }: { visual: AccountingVisual }) => scene(visual);
export const TransactionAnalysisScene = ({ visual }: { visual: AccountingVisual }) => scene(visual);
export const JournalEntryScene = ({ visual }: { visual: AccountingVisual }) => scene(visual);
export const LedgerPostingScene = ({ visual }: { visual: AccountingVisual }) => scene(visual);
export const TrialBalanceScene = ({ visual }: { visual: AccountingVisual }) => scene(visual);
export const FinancialStatementScene = ({ visual }: { visual: AccountingVisual }) => scene(visual);
export const BankReconciliationScene = ({ visual }: { visual: AccountingVisual }) => scene(visual);
export const DepreciationScene = ({ visual }: { visual: AccountingVisual }) => scene(visual);
export const InventoryValuationScene = ({ visual }: { visual: AccountingVisual }) => scene(visual);
export const RatioAnalysisScene = ({ visual }: { visual: AccountingVisual }) => scene(visual);
