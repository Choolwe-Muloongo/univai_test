'use client';

import { useMemo, useState } from 'react';
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Eye,
  FileText,
  FlaskConical,
  GripVertical,
  Lightbulb,
  Pencil,
  ShieldCheck,
  Table2,
} from 'lucide-react';

import { MathText } from '@/components/learning/math-text';
import { MathVisualBlock } from '@/components/learning/math-visual-blocks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { BlockEditorProps, BlockRendererProps, BlockRuntimeState, LearningBlockPayload } from '../schemas';

const visualTypes = new Set(['equation', 'formula', 'graph', 'table', 'number_line', 'matrix', 'formula_sheet', 'geometry']);

export function GenericBlockAdminEditor({ payload, definition, onChange }: BlockEditorProps) {
  const set = (key: string, value: unknown) => onChange({ ...payload, [key]: value });

  return (
    <div className="min-w-0 space-y-4">
      <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Pencil className="size-4" />
          {definition.label}
        </div>
        <p className="mt-1">{definition.description}</p>
      </div>
      <label className="block space-y-2 text-sm font-medium">
        <span>Block title</span>
        <Input value={stringValue(payload.title)} onChange={(event) => set('title', event.target.value)} placeholder={definition.label} />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span>Main explanation or instructions</span>
        <Textarea value={stringValue(payload.body)} onChange={(event) => set('body', event.target.value)} placeholder="Write what the learner should see." className="min-h-28" />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span>Prompt / question</span>
        <Textarea value={stringValue(payload.prompt ?? payload.question)} onChange={(event) => set(definition.completion.requiresAnswer ? 'question' : 'prompt', event.target.value)} placeholder="Add a learner prompt when this block needs a response." />
      </label>
      {definition.completion.requiresAnswer ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-2 text-sm font-medium">
            <span>Options</span>
            <Textarea value={optionsToText(payload.options)} onChange={(event) => set('options', textToOptions(event.target.value))} placeholder="One option per line" />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Correct answer</span>
            <Input value={stringValue(payload.correctAnswer ?? payload.answer)} onChange={(event) => set('correctAnswer', event.target.value)} />
          </label>
        </div>
      ) : null}
      <label className="block space-y-2 text-sm font-medium">
        <span>Feedback / explanation</span>
        <Textarea value={stringValue(payload.explanation)} onChange={(event) => set('explanation', event.target.value)} placeholder="Explain why this block matters or why the answer is correct." />
      </label>
    </div>
  );
}

export function GenericBlockStudentRenderer({ payload, definition, state, onStateChange }: BlockRendererProps) {
  const [localState, setLocalState] = useState<BlockRuntimeState>(state ?? {});
  const runtimeState = state ?? localState;
  const setRuntimeState = (next: BlockRuntimeState) => {
    setLocalState(next);
    onStateChange?.(next);
  };
  const answer = runtimeState.answer ?? runtimeState.selected ?? '';
  const options = normalizeOptions(payload.options);
  const needsAnswer = Boolean(definition.completion.requiresAnswer);
  const visual = payload.visual && typeof payload.visual === 'object' ? payload.visual as Record<string, unknown> : null;
  const autoMarked = useMemo(() => {
    if (!runtimeState.completed || !definition.autoMark) return null;
    return definition.autoMark(payload, answer);
  }, [answer, definition, payload, runtimeState.completed]);

  return (
    <div className="univai-lesson-render-safe min-w-0 space-y-3 overflow-hidden sm:space-y-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant="secondary" className="max-w-full rounded-full capitalize text-[11px] sm:text-xs">{definition.category.replace(/-/g, ' ')}</Badge>
        {definition.certificate.canRequire ? (
          <Badge variant="outline" className="max-w-full gap-1 rounded-full text-[11px] sm:text-xs"><ShieldCheck className="size-3 shrink-0" /> certificate capable</Badge>
        ) : null}
      </div>

      {stringValue(payload.body) ? <p className="break-words text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7"><MathText text={stringValue(payload.body)} /></p> : null}
      {stringValue(payload.prompt ?? payload.question) ? (
        <div className="min-w-0 rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:p-4">
          <div className="mb-2 flex min-w-0 items-center gap-2 text-sm font-semibold">
            <Lightbulb className="size-4 shrink-0" />
            <span className="min-w-0 break-words">Learner prompt</span>
          </div>
          <p className="break-words text-sm leading-6 text-muted-foreground"><MathText text={stringValue(payload.prompt ?? payload.question)} /></p>
        </div>
      ) : null}

      {visual ? <div className="min-w-0 overflow-hidden rounded-2xl"><MathVisualBlock block={visual} /></div> : null}
      {visualTypes.has(payload.type) ? <div className="min-w-0 overflow-hidden rounded-2xl"><MathVisualBlock block={payload} /></div> : null}
      <SubjectActivity payload={payload} definition={definition} />
      <GenericList payload={payload} />
      <GenericTable payload={payload} />
      {typeof payload.code === 'string' && payload.code ? <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-muted p-3 text-xs sm:p-4 sm:text-sm"><code>{payload.code}</code></pre> : null}
      {definition.completion.requiresReveal ? (
        <div className="min-w-0 rounded-2xl border p-3 sm:p-4">
          {runtimeState.revealed ? (
            <p className="break-words text-sm leading-6 text-muted-foreground"><MathText text={stringValue(payload.explanation) || 'The hidden step has been revealed.'} /></p>
          ) : (
            <Button type="button" variant="outline" className="min-h-10 w-full sm:w-auto" onClick={() => setRuntimeState({ ...runtimeState, revealed: true })}>Reveal step</Button>
          )}
        </div>
      ) : null}

      {needsAnswer ? (
        <div className="min-w-0 space-y-3 rounded-2xl border p-3 sm:p-4">
          {options.length ? (
            <div className="grid gap-2">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRuntimeState({ ...runtimeState, selected: option, answer: option })}
                  className={`min-h-11 rounded-xl border p-3 text-left text-sm transition ${answer === option ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                >
                  <MathText text={option} />
                </button>
              ))}
            </div>
          ) : (
            <Input className="min-h-11" value={answer} onChange={(event) => setRuntimeState({ ...runtimeState, answer: event.target.value })} placeholder="Type your answer" />
          )}
          <Button type="button" size="sm" className="min-h-10 w-full sm:w-auto" onClick={() => setRuntimeState({ ...runtimeState, completed: true })} disabled={!String(answer).trim()}>
            Check / save answer
          </Button>
          {runtimeState.completed ? (
            <div className={`rounded-xl border p-3 text-sm ${autoMarked?.correct ? 'border-primary/30 bg-primary/5 text-primary' : 'bg-muted/30 text-muted-foreground'}`}>
              <p className="flex items-center gap-2 font-medium"><CheckCircle2 className="size-4 shrink-0" /> {autoMarked ? (autoMarked.correct ? 'Correct' : 'Review needed') : 'Response saved'}</p>
              {autoMarked?.feedback ? <p className="mt-1 break-words"><MathText text={autoMarked.feedback} /></p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function GenericBlockPreviewRenderer(props: BlockRendererProps) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border bg-background p-3 sm:p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Eye className="size-4" />
        Student preview
      </div>
      <GenericBlockStudentRenderer {...props} />
    </div>
  );
}

export function BoardBlockStudentRenderer(props: BlockRendererProps) {
  const { payload, definition } = props;
  return (
    <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border bg-[#12231c] p-4 text-white shadow-sm sm:space-y-4 sm:p-5">
      <div className="flex min-w-0 items-center gap-2 text-xs uppercase tracking-wide text-white/60">
        <FileText className="size-4 shrink-0" />
        <span className="min-w-0 break-words">Classroom board</span>
      </div>
      <h3 className="break-words text-lg font-semibold sm:text-xl"><MathText text={stringValue(payload.title) || definition.label} /></h3>
      <div className="min-w-0 text-white/85">
        <GenericBlockStudentRenderer {...props} />
      </div>
    </div>
  );
}

function GenericList({ payload }: { payload: LearningBlockPayload }) {
  const items = normalizeList(payload.items);
  if (!items.length) return null;
  return (
    <ul className="grid gap-2">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="min-w-0 rounded-xl border bg-muted/10 p-3 text-sm leading-6 text-muted-foreground">
          <MathText text={item} />
        </li>
      ))}
    </ul>
  );
}

function GenericTable({ payload }: { payload: LearningBlockPayload }) {
  const columns = normalizeList(payload.columns);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (!columns.length || !rows.length) return null;
  return (
    <div className="max-w-full overflow-x-auto rounded-2xl border">
      <table className="min-w-[520px] text-[11px] sm:w-full sm:min-w-0 sm:text-sm">
        <thead className="bg-muted/50">
          <tr>{columns.map((column) => <th key={column} className="break-words px-2 py-2 text-left align-top font-semibold sm:px-3">{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t">
              {(Array.isArray(row) ? row : [row]).map((cell, cellIndex) => <td key={cellIndex} className="break-words px-2 py-2 align-top text-muted-foreground sm:px-3">{String(cell ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubjectActivity({ payload, definition }: BlockRendererProps) {
  if (['accounting', 'spreadsheet'].includes(definition.category)) return <WorkbookActivity payload={payload} category={definition.category} />;
  if (['coding', 'web', 'cybersecurity', 'ai-data'].includes(definition.category)) return <CodeAndSecurityActivity payload={payload} category={definition.category} />;
  if (['business'].includes(definition.category)) return <BusinessActivity payload={payload} />;
  if (['science', 'simulations', 'vocational'].includes(definition.category)) return <ScienceActivity payload={payload} category={definition.category} />;
  if (definition.category === 'drag-drop') return <SortingActivity payload={payload} />;
  if (definition.category === 'projects') return <ProjectActivity payload={payload} />;
  if (['certificate', 'gamification'].includes(definition.category)) return <CheckpointActivity payload={payload} category={definition.category} />;
  if (['writing'].includes(definition.category)) return <WritingActivity payload={payload} />;
  if (definition.category === 'media') return <MediaActivity payload={payload} />;
  return null;
}

function WorkbookActivity({ payload, category }: { payload: LearningBlockPayload; category: string }) {
  const columns = normalizeList(payload.columns).length ? normalizeList(payload.columns) : category === 'accounting' ? ['Account', 'Debit', 'Credit', 'Reason'] : ['Cell', 'Value', 'Formula', 'Reason'];
  const rows = Array.isArray(payload.rows) && payload.rows.length ? payload.rows : [
    category === 'accounting' ? ['Cash', '', '', 'Explain placement'] : ['A1', '', '', 'Explain formula'],
  ];
  return (
    <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border p-3 sm:p-4">
      <div className="flex items-center gap-2 text-sm font-semibold"><Table2 className="size-4 shrink-0 text-primary" /> Workbook board</div>
      <p className="break-words text-sm text-muted-foreground">Use this table step by step. The instructor can add rows across cards while the source question stays visible.</p>
      <div className="max-w-full overflow-x-auto rounded-xl border">
        <table className="min-w-[580px] text-[11px] sm:w-full sm:min-w-0 sm:text-sm">
          <thead className="bg-muted/50"><tr>{columns.map((column) => <th key={column} className="break-words px-2 py-2 text-left align-top sm:px-3">{column}</th>)}</tr></thead>
          <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-t">{(Array.isArray(row) ? row : [row]).map((cell, cellIndex) => <td key={cellIndex} className="break-words px-2 py-2 align-top text-muted-foreground sm:px-3"><MathText text={String(cell ?? '')} /></td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function CodeAndSecurityActivity({ payload, category }: { payload: LearningBlockPayload; category: string }) {
  const [code, setCode] = useState(stringValue(payload.code) || stringValue(payload.body));
  const isWebPreview = payload.type.includes('html') || payload.type.includes('web') || payload.type.includes('component') || payload.type.includes('ui_');
  return (
    <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border p-3 sm:p-4">
      <div className="flex items-center gap-2 text-sm font-semibold"><Code2 className="size-4 shrink-0 text-primary" /> {category === 'cybersecurity' ? 'Security lab' : 'Code lab'}</div>
      <Textarea value={code} onChange={(event) => setCode(event.target.value)} className="min-h-36 font-mono text-sm" placeholder="Write, inspect, fix, trace, or explain code here." />
      {isWebPreview ? (
        <div className="overflow-hidden rounded-xl border">
          <div className="border-b bg-muted/40 px-3 py-2 text-xs font-medium">Live HTML/CSS/JS preview</div>
          <iframe title="Student code preview" srcDoc={code} className="h-56 w-full bg-white" sandbox="allow-scripts" />
        </div>
      ) : null}
    </div>
  );
}

function BusinessActivity({ payload }: { payload: LearningBlockPayload }) {
  const headings = payload.type.includes('swot') ? ['Strengths', 'Weaknesses', 'Opportunities', 'Threats'] : ['Problem', 'Customer', 'Value', 'Evidence'];
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border p-3 sm:p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><BriefcaseBusiness className="size-4 shrink-0 text-primary" /> Business canvas</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {headings.map((heading) => <div key={heading} className="min-h-24 min-w-0 rounded-xl border bg-muted/20 p-3"><p className="break-words text-sm font-medium">{heading}</p><p className="mt-2 break-words text-xs text-muted-foreground">Add case evidence, decisions, calculations, or reflection.</p></div>)}
      </div>
    </div>
  );
}

function ScienceActivity({ payload, category }: { payload: LearningBlockPayload; category: string }) {
  const observations = normalizeList(payload.observations ?? payload.items);
  return (
    <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border p-3 sm:p-4">
      <div className="flex items-center gap-2 text-sm font-semibold"><FlaskConical className="size-4 shrink-0 text-primary" /> {category === 'simulations' ? 'Simulation board' : 'Experiment board'}</div>
      <div className="grid min-w-0 gap-3 md:grid-cols-[180px_1fr]">
        <div className="min-w-0 rounded-xl border bg-muted/20 p-3">
          <svg viewBox="0 0 180 140" className="block h-auto w-full max-w-full">
            <rect x="35" y="25" width="110" height="75" rx="12" fill="none" className="stroke-primary" strokeWidth="3" />
            <line x1="20" y1="115" x2="160" y2="115" className="stroke-muted-foreground" strokeWidth="2" />
            <circle cx="70" cy="65" r="8" className="fill-primary" />
            <circle cx="110" cy="65" r="8" className="fill-primary" />
            <text x="90" y="132" textAnchor="middle" className="fill-muted-foreground text-[10px]">diagram workspace</text>
          </svg>
        </div>
        <div className="min-w-0 rounded-xl border bg-muted/20 p-3">
          <p className="break-words text-sm font-medium">Observations / known values</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {(observations.length ? observations : ['List variables, forces, components, observations, or safety checks.']).map((item, index) => <li key={`${item}-${index}`} className="break-words"><MathText text={`- ${item}`} /></li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SortingActivity({ payload }: { payload: LearningBlockPayload }) {
  const [items, setItems] = useState(() => normalizeList(payload.items).length ? normalizeList(payload.items) : ['Step 1', 'Step 2', 'Step 3']);
  return (
    <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border p-3 sm:p-4">
      <div className="flex items-center gap-2 text-sm font-semibold"><GripVertical className="size-4 shrink-0 text-primary" /> Drag/drop style activity</div>
      <div className="grid gap-2">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="flex min-w-0 flex-col gap-2 rounded-xl border p-3 text-sm sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <GripVertical className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 break-words"><MathText text={item} /></span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <Button type="button" size="sm" variant="ghost" className="min-h-9" onClick={() => setItems(move(items, index, -1))} disabled={index === 0}>Up</Button>
              <Button type="button" size="sm" variant="ghost" className="min-h-9" onClick={() => setItems(move(items, index, 1))} disabled={index === items.length - 1}>Down</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectActivity({ payload }: { payload: LearningBlockPayload }) {
  const tasks = normalizeList(payload.items ?? payload.criteria).length ? normalizeList(payload.items ?? payload.criteria) : ['Understand the task', 'Build the evidence', 'Check against rubric'];
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border p-3 sm:p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><ClipboardCheck className="size-4 shrink-0 text-primary" /> Project stage</div>
      <div className="grid gap-2">
        {tasks.map((task, index) => <label key={`${task}-${index}`} className="flex min-w-0 items-center gap-2 rounded-xl border p-3 text-sm"><input type="checkbox" /> <span className="min-w-0 break-words"><MathText text={task} /></span></label>)}
      </div>
    </div>
  );
}

function CheckpointActivity({ payload, category }: { payload: LearningBlockPayload; category: string }) {
  const requirements = normalizeList(payload.items ?? payload.criteria).length ? normalizeList(payload.items ?? payload.criteria) : ['Required lesson complete', 'Required practice/project complete', 'Exam or checkpoint passed'];
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><BadgeCheck className="size-4 shrink-0 text-primary" /> {category === 'certificate' ? 'Certificate checkpoint' : 'Learning reward'}</div>
      <div className="grid gap-2">
        {requirements.map((item, index) => <div key={`${item}-${index}`} className="flex min-w-0 items-center gap-2 rounded-xl bg-background/70 p-3 text-sm"><CheckCircle2 className="size-4 shrink-0 text-primary" /><span className="min-w-0 break-words"><MathText text={item} /></span></div>)}
      </div>
    </div>
  );
}

function WritingActivity({ payload }: { payload: LearningBlockPayload }) {
  const [draft, setDraft] = useState(stringValue(payload.answer));
  return (
    <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border p-3 sm:p-4">
      <div className="flex items-center gap-2 text-sm font-semibold"><Pencil className="size-4 shrink-0 text-primary" /> Writing workspace</div>
      <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-36" placeholder="Draft, rewrite, translate, summarize, or plan your response." />
    </div>
  );
}

function MediaActivity({ payload }: { payload: LearningBlockPayload }) {
  const src = stringValue(payload.imageUrl ?? payload.url ?? payload.src);
  if (!src) return null;
  if (payload.type.includes('audio')) return <audio className="w-full" controls src={src} />;
  if (payload.type.includes('video')) return <div className="overflow-hidden rounded-2xl border"><iframe title={stringValue(payload.title) || 'Video'} src={src} className="aspect-video w-full" allowFullScreen /></div>;
  return <img src={src} alt={stringValue(payload.imageAlt) || stringValue(payload.title) || 'Learning media'} className="max-h-[420px] w-full rounded-2xl border object-contain" />;
}

function move(items: string[], index: number, direction: -1 | 1) {
  const next = [...items];
  const target = index + direction;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function stringValue(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
}

function normalizeOptions(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') return textToOptions(value);
  return [];
}

function normalizeList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => {
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      return String(record.label ?? record.title ?? record.name ?? record.text ?? record.description ?? '');
    }
    return '';
  }).filter(Boolean);
  if (typeof value === 'string') return textToOptions(value);
  return [];
}

function textToOptions(value: string) {
  return value.split(/\r\n|\r|\n|,/).map((item) => item.trim()).filter(Boolean);
}

function optionsToText(value: unknown) {
  return normalizeOptions(value).join('\n');
}
