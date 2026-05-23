'use client';

import { useMemo } from 'react';
import { BookOpen, Database, GraduationCap, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { BlockEditorProps, LearningBlockPayload } from '../schemas';
import { getAccountingContent, validateAccountingPayload } from './engine';

const accountingTypes = [
  'concept',
  'transaction',
  'journal_entry',
  'ledger',
  'trial_balance',
  'financial_statement',
  'bank_reconciliation',
  'depreciation',
  'inventory',
  'ratio_analysis',
  'error_correction',
  'case_study',
  'exam_practice',
  'marking_scheme',
  'business_simulation',
];

const difficulties = ['beginner', 'intermediate', 'advanced', 'professional'];

export function AccountingStudioEditor({ payload, definition, onChange }: BlockEditorProps) {
  const content = getAccountingContent(payload);
  const validation = useMemo(() => validateAccountingPayload(payload), [payload]);
  const setPayload = (patch: Partial<LearningBlockPayload>) => onChange({ ...payload, ...patch });
  const setContent = (patch: Record<string, unknown>) => setPayload({ content: { ...content, ...patch } });
  const setDataJson = (value: string) => {
    try {
      setContent({ data: JSON.parse(value) });
    } catch {
      setPayload({ accountingStudioDraftJson: value });
    }
  };
  const setExpectedJson = (value: string) => {
    try {
      setContent({ expectedAnswer: JSON.parse(value) });
    } catch {
      setPayload({ accountingStudioExpectedDraftJson: value });
    }
  };
  const setMarkingJson = (value: string) => {
    try {
      setContent({ markingScheme: JSON.parse(value) });
    } catch {
      setPayload({ accountingStudioMarkingDraftJson: value });
    }
  };

  return (
    <div className="min-w-0 space-y-5">
      <div className="rounded-2xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2 font-semibold"><Sparkles className="size-4" /> {definition.label}</div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Build accounting as a workflow: scenario, transaction, journal, ledger, trial balance, statements, analysis, and marking scheme.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-2 text-sm font-medium">
          <span>Block title</span>
          <Input value={String(payload.title ?? '')} onChange={(event) => setPayload({ title: event.target.value })} placeholder="Accounting practice title" />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          <span>Accounting card type</span>
          <select
            value={content.accountingType}
            onChange={(event) => setContent({ accountingType: event.target.value })}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {accountingTypes.map((type) => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-2 text-sm font-medium">
          <span>Difficulty</span>
          <select
            value={content.difficulty}
            onChange={(event) => setContent({ difficulty: event.target.value })}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
          </select>
        </label>
        <label className="block space-y-2 text-sm font-medium">
          <span>Teacher instruction / explanation</span>
          <Input value={String(payload.body ?? '')} onChange={(event) => setPayload({ body: event.target.value })} placeholder="What should the learner do?" />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <JsonPanel
          icon={<Database className="size-4" />}
          title="Card data JSON"
          description="Scenario, rows, statements, transactions, balances, formula inputs, or simulation events."
          value={String(payload.accountingStudioDraftJson ?? JSON.stringify(content.data, null, 2))}
          onChange={setDataJson}
        />
        <JsonPanel
          icon={<GraduationCap className="size-4" />}
          title="Expected answer JSON"
          description="Correct rows or answer shape used by auto-marking and feedback."
          value={String(payload.accountingStudioExpectedDraftJson ?? JSON.stringify(content.expectedAnswer ?? {}, null, 2))}
          onChange={setExpectedJson}
        />
        <JsonPanel
          icon={<BookOpen className="size-4" />}
          title="Marking scheme JSON"
          description="Professional marks allocation for exam-style accounting work."
          value={String(payload.accountingStudioMarkingDraftJson ?? JSON.stringify(content.markingScheme ?? { totalMarks: 0, items: [] }, null, 2))}
          onChange={setMarkingJson}
        />
      </div>

      <div className={`rounded-2xl border p-4 text-sm ${validation.valid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
        <div className="font-semibold">{validation.valid ? 'Accounting workflow is valid.' : 'Fix these accounting issues:'}</div>
        {!validation.valid ? <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{validation.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : null}
      </div>

      <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
        <div className="mb-2 font-semibold text-foreground">Professional template examples</div>
        <div className="flex flex-wrap gap-2">
          {['Basic transaction practice', 'Full accounting cycle', 'Bank reconciliation', 'Depreciation schedule', 'Inventory valuation', 'Ratio analysis', 'Audit case study'].map((template) => (
            <Button key={template} type="button" size="sm" variant="outline" onClick={() => applyTemplate(template, payload, onChange)}>{template}</Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function JsonPanel({ icon, title, description, value, onChange }: { icon: React.ReactNode; title: string; description: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span className="flex items-center gap-2">{icon}{title}</span>
      <span className="block text-xs font-normal leading-5 text-muted-foreground">{description}</span>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-64 font-mono text-xs" spellCheck={false} />
    </label>
  );
}

function applyTemplate(template: string, payload: LearningBlockPayload, onChange: (payload: LearningBlockPayload) => void) {
  const base = { ...payload };
  const content = getAccountingContent(base);
  const next = { ...content };

  if (template === 'Basic transaction practice') {
    next.accountingType = 'journal_entry';
    next.difficulty = 'beginner';
    next.data = {
      currency: 'ZMW',
      question: 'Record the purchase of goods for cash, K2,000.',
      rows: [
        { account: 'Purchases', debit: 2000, credit: 0 },
        { account: 'Cash', debit: 0, credit: 2000 },
      ],
      narration: 'Being goods purchased for cash.',
    };
    next.expectedAnswer = { rows: next.data.rows };
  }

  if (template === 'Full accounting cycle') {
    next.accountingType = 'business_simulation';
    next.difficulty = 'intermediate';
    next.data = {
      currency: 'ZMW',
      businessName: 'Copperbelt Stationery Supplies',
      transactions: [
        '1 Jan: Started business with K20,000 cash.',
        '2 Jan: Bought goods for resale, K5,000 cash.',
        '3 Jan: Sold goods for K3,000 cash. Cost of goods sold was K1,800.',
        '4 Jan: Paid rent K1,000.',
        '5 Jan: Bought office furniture on credit, K4,000.',
      ],
    };
  }

  if (template === 'Bank reconciliation') {
    next.accountingType = 'bank_reconciliation';
    next.difficulty = 'intermediate';
    next.data = { currency: 'ZMW', cashBookBalance: 8200, bankStatementBalance: 9500, additions: [{ label: 'Direct deposit', amount: 1200 }], deductions: [{ label: 'Bank charges', amount: 300 }], uncreditedDeposits: [{ amount: 1000 }], unpresentedCheques: [{ amount: 1400 }] };
  }

  if (template === 'Depreciation schedule') {
    next.accountingType = 'depreciation';
    next.difficulty = 'intermediate';
    next.data = { currency: 'ZMW', asset: 'Motor Vehicle', cost: 50000, residualValue: 5000, usefulLifeYears: 5, method: 'straight_line' };
  }

  if (template === 'Inventory valuation') {
    next.accountingType = 'inventory';
    next.difficulty = 'advanced';
    next.data = { currency: 'ZMW', method: 'FIFO', transactions: [{ type: 'purchase', units: 100, unitCost: 20 }, { type: 'purchase', units: 50, unitCost: 25 }, { type: 'sale', units: 120 }] };
  }

  if (template === 'Ratio analysis') {
    next.accountingType = 'ratio_analysis';
    next.difficulty = 'advanced';
    next.data = { financialData: { currentAssets: 50000, inventory: 10000, currentLiabilities: 25000, revenue: 120000, grossProfit: 65000, netProfit: 30000 } };
  }

  if (template === 'Audit case study') {
    next.accountingType = 'case_study';
    next.difficulty = 'professional';
    next.data = { businessName: 'Muloongo Traders', scenario: 'The business has weak cash controls, missing receipt numbers, and one person recording and banking cash.', required: ['Identify audit risks', 'Recommend controls', 'Explain governance impact'] };
    next.markingScheme = { totalMarks: 10, items: [{ description: 'Audit risk identification', marks: 3 }, { description: 'Control recommendation', marks: 4 }, { description: 'Professional explanation', marks: 3 }] };
  }

  onChange({ ...base, accountingStudioDraftJson: undefined, accountingStudioExpectedDraftJson: undefined, accountingStudioMarkingDraftJson: undefined, content: next });
}
