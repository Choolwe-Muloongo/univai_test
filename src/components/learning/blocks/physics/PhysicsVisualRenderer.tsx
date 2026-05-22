'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, HelpCircle, RotateCcw, XCircle } from 'lucide-react';

import { MathText } from '@/components/learning/math-text';
import { Button } from '@/components/ui/button';
import type { PhysicsArrow, PhysicsInteraction, PhysicsObject, PhysicsVisual } from './types';

type Props = {
  visual: PhysicsVisual;
  mode?: 'builder' | 'student' | 'preview';
};

type FeedbackState = { correct: boolean; message: string } | null;

const arrowRoleClass: Record<string, string> = {
  force: 'stroke-sky-600 fill-sky-600',
  velocity: 'stroke-emerald-600 fill-emerald-600',
  acceleration: 'stroke-purple-600 fill-purple-600',
  tension: 'stroke-blue-600 fill-blue-600',
  weight: 'stroke-red-600 fill-red-600',
  normal: 'stroke-violet-600 fill-violet-600',
  friction: 'stroke-amber-600 fill-amber-600',
  momentum: 'stroke-teal-600 fill-teal-600',
  impulse: 'stroke-orange-600 fill-orange-600',
  ray: 'stroke-yellow-600 fill-yellow-600',
};

export function PhysicsVisualRenderer({ visual, mode = 'student' }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const steps = visual.steps ?? [];
  const interactions = visual.interactions ?? [];
  const activeStep = steps[stepIndex] ?? null;
  const activeInteraction = interactions[0] ?? activeStep?.checkpointQuestion ?? null;
  const highlighted = useMemo(() => new Set(activeStep?.highlightObjectIds ?? []), [activeStep]);
  const hidden = useMemo(() => new Set(activeStep?.hideObjectIds ?? []), [activeStep]);
  const width = visual.canvas?.width || 800;
  const height = visual.canvas?.height || 500;

  function handleTarget(targetId: string) {
    setSelectedTargetId(targetId);
    if (!activeInteraction) return;
    const result = evaluateInteraction(activeInteraction, targetId);
    if (result) setFeedback(result);
  }

  return (
    <div className="space-y-4 rounded-3xl border bg-background p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Physics visual engine</p>
          <p className="text-sm text-muted-foreground">{visual.template.replace(/_/g, ' ')} · {visual.visualType}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === 'builder' ? <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Builder preview</span> : null}
          <Button type="button" variant="outline" size="sm" onClick={() => { setStepIndex(0); setSelectedTargetId(null); setFeedback(null); }}>
            <RotateCcw className="mr-2 size-4" /> Reset
          </Button>
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border bg-muted/20 p-2">
        <svg role="img" aria-label="Interactive physics diagram" viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[620px] rounded-xl bg-background">
          <defs>
            <marker id="physics-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
              <path d="M2,2 L10,6 L2,10 z" className="fill-current" />
            </marker>
          </defs>
          <CanvasBackground width={width} height={height} background={visual.canvas?.background} />
          {(visual.objects ?? []).filter((object) => !hidden.has(object.id)).map((object) => (
            <PhysicsObjectNode key={object.id} object={object} highlighted={highlighted.has(object.id) || selectedTargetId === object.id} onSelect={handleTarget} />
          ))}
          {(visual.arrows ?? []).filter((arrow) => !hidden.has(arrow.id)).map((arrow) => (
            <PhysicsArrowNode key={arrow.id} arrow={arrow} highlighted={highlighted.has(arrow.id) || selectedTargetId === arrow.id} onSelect={handleTarget} />
          ))}
          {(visual.labels ?? []).map((label) => (
            <text key={label.id} x={label.x} y={label.y} className="fill-foreground text-[18px] font-semibold">{label.text}</text>
          ))}
          {(visual.hotspots ?? []).map((hotspot) => (
            <rect key={hotspot.id} x={hotspot.x} y={hotspot.y} width={hotspot.width} height={hotspot.height} rx="10" className="cursor-pointer fill-primary/5 stroke-primary/40 transition hover:fill-primary/15" strokeDasharray="8 6" onClick={() => handleTarget(hotspot.targetId || hotspot.id)} />
          ))}
          {activeStep?.focusBox ? <rect x={activeStep.focusBox.x} y={activeStep.focusBox.y} width={activeStep.focusBox.width} height={activeStep.focusBox.height} rx="18" className="fill-transparent stroke-primary" strokeWidth="4" strokeDasharray="10 8" /> : null}
        </svg>
      </div>

      {activeStep ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Step {stepIndex + 1} of {steps.length}</p>
              <h4 className="mt-1 font-semibold"><MathText text={activeStep.title} /></h4>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" disabled={stepIndex === 0} onClick={() => { setStepIndex((value) => Math.max(0, value - 1)); setFeedback(null); }}>Back</Button>
              <Button type="button" size="sm" disabled={stepIndex >= steps.length - 1} onClick={() => { setStepIndex((value) => Math.min(steps.length - 1, value + 1)); setFeedback(null); }}>Next step</Button>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground"><MathText text={activeStep.explanation} /></p>
          {activeStep.equation ? <div className="mt-3 rounded-xl border bg-background p-3 text-center text-lg font-semibold"><MathText text={`$${activeStep.equation}$`} /></div> : null}
        </div>
      ) : null}

      {activeInteraction ? (
        <div className="rounded-2xl border p-4">
          <div className="flex items-start gap-2">
            <HelpCircle className="mt-0.5 size-4 text-primary" />
            <div>
              <p className="text-sm font-semibold">Checkpoint</p>
              <p className="mt-1 text-sm text-muted-foreground"><MathText text={activeInteraction.prompt} /></p>
              {activeInteraction.type === 'enter_numeric_answer' ? <NumericInteraction interaction={activeInteraction} onFeedback={setFeedback} /> : <p className="mt-2 text-xs text-muted-foreground">Tap the correct object, arrow, or hotspot in the diagram.</p>}
            </div>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <div className={`rounded-2xl border p-4 text-sm ${feedback.correct ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
          <div className="mb-1 flex items-center gap-2 font-semibold">
            {feedback.correct ? <CheckCircle2 className="size-4 text-primary" /> : <XCircle className="size-4 text-destructive" />}
            {feedback.correct ? 'Correct' : 'Not quite'}
          </div>
          <p className="text-muted-foreground"><MathText text={feedback.message} /></p>
        </div>
      ) : null}
    </div>
  );
}

function CanvasBackground({ width, height, background }: { width: number; height: number; background?: string }) {
  if (background !== 'grid' && background !== 'graph_paper') return <rect x="0" y="0" width={width} height={height} className="fill-background" />;
  const spacing = background === 'graph_paper' ? 25 : 40;
  return (
    <g>
      <rect x="0" y="0" width={width} height={height} className="fill-background" />
      {Array.from({ length: Math.floor(width / spacing) + 1 }, (_, index) => <line key={`v-${index}`} x1={index * spacing} x2={index * spacing} y1="0" y2={height} className="stroke-muted" strokeWidth="1" />)}
      {Array.from({ length: Math.floor(height / spacing) + 1 }, (_, index) => <line key={`h-${index}`} x1="0" x2={width} y1={index * spacing} y2={index * spacing} className="stroke-muted" strokeWidth="1" />)}
    </g>
  );
}

function PhysicsObjectNode({ object, highlighted, onSelect }: { object: PhysicsObject; highlighted: boolean; onSelect: (id: string) => void }) {
  const strokeWidth = highlighted ? 5 : object.style?.strokeWidth ?? 2;
  const className = `${object.interactive ? 'cursor-pointer' : ''} ${highlighted ? 'drop-shadow-sm' : ''}`;
  const fill = object.style?.fill || '#f8fafc';
  const stroke = object.style?.stroke || '#0f172a';
  const common = { onClick: () => onSelect(object.id), className, transform: object.rotation ? `rotate(${object.rotation} ${object.x} ${object.y})` : undefined };

  if (object.type === 'wave') return <WaveObjectNode object={object} highlighted={highlighted} onSelect={onSelect} />;

  if (object.type === 'circle' || object.type === 'pulley') {
    const radius = object.radius ?? Math.min(object.width ?? 80, object.height ?? 80) / 2;
    const cx = object.x;
    const cy = object.y;
    return <g {...common}><circle cx={cx} cy={cy} r={radius} fill={fill} stroke={stroke} strokeWidth={strokeWidth} /><circle cx={cx} cy={cy} r={Math.max(4, radius * 0.18)} fill="none" stroke={stroke} strokeWidth="2" />{object.label ? <SvgMultilineText text={object.label} x={cx} y={cy + radius + 24} /> : null}</g>;
  }

  if (object.type === 'rope') {
    const x2 = object.x + (object.width ?? 120);
    const y2 = object.y + (object.height ?? 0);
    return <g {...common}><path d={`M${object.x},${object.y} Q${(object.x + x2) / 2},${object.y - 80} ${x2},${object.y}`} fill="none" stroke={stroke} strokeWidth={object.style?.strokeWidth ?? 4} strokeLinecap="round" /><line x1={object.x} y1={object.y} x2={object.x} y2={y2} stroke={stroke} strokeWidth={object.style?.strokeWidth ?? 4} /><line x1={x2} y1={object.y} x2={x2} y2={y2} stroke={stroke} strokeWidth={object.style?.strokeWidth ?? 4} /></g>;
  }

  if (object.type === 'triangle' || object.type === 'inclined_plane') {
    const width = object.width ?? 180;
    const height = object.height ?? 100;
    const points = `${object.x},${object.y + height} ${object.x + width},${object.y + height} ${object.x + width},${object.y}`;
    return <g {...common}><polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />{object.label ? <SvgMultilineText text={object.label} x={object.x + width / 2} y={object.y + height + 24} /> : null}</g>;
  }

  const width = object.width ?? 100;
  const height = object.height ?? 70;
  return (
    <g {...common}>
      <rect x={object.x} y={object.y} width={width} height={height} rx={object.type === 'surface' ? 3 : 12} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      {object.label ? <SvgMultilineText text={object.label} x={object.x + width / 2} y={object.y + height / 2 - 6} /> : null}
    </g>
  );
}

function WaveObjectNode({ object, highlighted, onSelect }: { object: PhysicsObject; highlighted: boolean; onSelect: (id: string) => void }) {
  const width = object.width ?? 520;
  const height = object.height ?? 160;
  const amplitude = Number(object.physics?.amplitude ?? height / 3);
  const cycles = Math.max(1, Number(object.physics?.cycles ?? 3));
  const points = Array.from({ length: 121 }, (_, index) => {
    const progress = index / 120;
    const x = object.x + progress * width;
    const y = object.y + height / 2 - Math.sin(progress * Math.PI * 2 * cycles) * amplitude;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <g onClick={() => onSelect(object.id)} className={object.interactive ? 'cursor-pointer' : undefined}>
      <line x1={object.x} x2={object.x + width} y1={object.y + height / 2} y2={object.y + height / 2} className="stroke-muted-foreground" strokeWidth="2" strokeDasharray="8 8" />
      <polyline points={points} fill="none" stroke={object.style?.stroke || '#2563eb'} strokeWidth={highlighted ? 6 : object.style?.strokeWidth ?? 4} strokeLinecap="round" strokeLinejoin="round" />
      {object.label ? <SvgMultilineText text={object.label} x={object.x + width / 2} y={object.y + height + 28} /> : null}
    </g>
  );
}

function PhysicsArrowNode({ arrow, highlighted, onSelect }: { arrow: PhysicsArrow; highlighted: boolean; onSelect: (id: string) => void }) {
  const roleClass = arrowRoleClass[arrow.colorRole || arrow.type] ?? 'stroke-slate-700 fill-slate-700';
  const midX = (arrow.from.x + arrow.to.x) / 2;
  const midY = (arrow.from.y + arrow.to.y) / 2;
  return (
    <g className={`cursor-pointer ${roleClass}`} onClick={() => onSelect(arrow.id)}>
      <line x1={arrow.from.x} y1={arrow.from.y} x2={arrow.to.x} y2={arrow.to.y} strokeWidth={highlighted ? 6 : 4} strokeDasharray={arrow.dashed ? '8 8' : undefined} strokeLinecap="round" markerEnd="url(#physics-arrow)" />
      {arrow.label ? <text x={midX + 8} y={midY - 8} className="fill-current text-[16px] font-bold">{arrow.label}</text> : null}
    </g>
  );
}

function SvgMultilineText({ text, x, y }: { text: string; x: number; y: number }) {
  const parts = text.split('\n');
  return (
    <text x={x} y={y} textAnchor="middle" className="fill-foreground text-[15px] font-semibold">
      {parts.map((part, index) => <tspan key={`${part}-${index}`} x={x} dy={index === 0 ? 0 : 18}>{part}</tspan>)}
    </text>
  );
}

function NumericInteraction({ interaction, onFeedback }: { interaction: PhysicsInteraction; onFeedback: (state: FeedbackState) => void }) {
  const [value, setValue] = useState('');
  function check() {
    const expected = Number(interaction.correctAnswer);
    const actual = Number(value);
    const tolerance = interaction.tolerance ?? 0;
    const correct = Number.isFinite(expected) && Number.isFinite(actual) && Math.abs(expected - actual) <= tolerance;
    onFeedback({ correct, message: correct ? interaction.feedback?.correct || 'Correct. Your calculation matches the diagram.' : interaction.feedback?.incorrect || 'Not quite. Check the formula, units, and signs.' });
  }
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input value={value} onChange={(event) => setValue(event.target.value)} inputMode="decimal" className="h-10 rounded-xl border bg-background px-3 text-sm" placeholder={`Answer${interaction.unit ? ` in ${interaction.unit}` : ''}`} />
      <Button type="button" size="sm" onClick={check}>Check</Button>
    </div>
  );
}

function evaluateInteraction(interaction: PhysicsInteraction, targetId: string): FeedbackState {
  const correct = interaction.correctTargetId ? targetId === interaction.correctTargetId : false;
  return {
    correct,
    message: correct ? interaction.feedback?.correct || 'Correct. You selected the right part of the diagram.' : interaction.feedback?.incorrect || 'Not quite. Study the direction, label, or object role and try again.',
  };
}
