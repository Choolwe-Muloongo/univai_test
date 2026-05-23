'use client';

import { useMemo, type ReactNode } from 'react';
import { BookOpen, Database, GraduationCap, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { BlockEditorProps } from '../schemas';
import { getAccountingContent, validateAccountingPayload } from './engine';
import { accountingRenderableTemplates, applyAccountingTemplate } from './template-factory';

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
  'consolidation',
  'cash_flow_statement',
  'ifrs_treatment',
  'audit_risk',
  'tax_computation',
  'budgeting',
  'variance_analysis',
  'research_case',
];

const difficulties = ['beginner', 'intermediate', 'advanced', 'professional', 'phd'];

export function AccountingStudioEditor({ payload, definition, onChange }: BlockEditorProps) {
  const content = getAccountingContent(payload);
  const validation = useMemo(() => validateAccountingPayload(payload), [payload]);
  const setPayload = (patch: Partial<typeof payload>) => onChange({ ...payload, ...patch });
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
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Create renderable accounting course content: scenario cards, journals, ledgers, statements, reconciliations, IFRS cases, audit cases, tax cases, budgeting, variance analysis, and research critique.</p>
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
          <span>Course difficulty / sophistication</span>
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
          title="Renderable card data JSON"
          description="This is the content that the Accounting Studio renderer turns into tables, T-accounts, statements, calculations, simulations, cases, and workspaces."
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
        <div className="font-semibold">{validation.valid ? 'Accounting content is renderable.' : 'Fix these rendering issues:'}</div>
        {!validation.valid ? <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{validation.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : null}
      </div>

      <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
        <div className="mb-2 font-semibold text-foreground">Renderable accounting course templates</div>
        <p className="mb-3 text-xs leading-5">Pick any template and it creates structured data that the student lesson player can render immediately.</p>
        <div className="flex flex-wrap gap-2">
          {accountingRenderableTemplates.map((template) => (
            <Button key={template} type="button" size="sm" variant="outline" onClick={() => onChange(applyAccountingTemplate(template, payload))}>{template}</Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function JsonPanel({ icon, title, description, value, onChange }: { icon: ReactNode; title: string; description: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span className="flex items-center gap-2">{icon}{title}</span>
      <span className="block text-xs font-normal leading-5 text-muted-foreground">{description}</span>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-64 font-mono text-xs" spellCheck={false} />
    </label>
  );
}
