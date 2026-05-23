import type { PhysicsObject } from '../types';
import type { SvgDiagramRendererProps } from './SvgDiagramRenderer';

export function CircuitPhysicsRenderer(props: SvgDiagramRendererProps) {
  const { visual, highlightedIds, selectedTargetId, onSelect } = props;
  const components = visual.objects ?? [];
  const battery = findComponent(components, 'battery') ?? components[0];
  const resistor = findComponent(components, 'resistor') ?? components[1];
  const ammeter = components.find((object) => object.id === 'ammeter');
  const voltmeter = components.find((object) => object.id === 'voltmeter');

  return (
    <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border bg-muted/10 p-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Circuit renderer</p>
        <p className="text-sm text-muted-foreground">Ammeter in series. Voltmeter in parallel. Tap components to answer questions.</p>
      </div>
      <div className="min-w-0 overflow-hidden rounded-2xl border bg-background p-2">
        <svg viewBox="0 0 900 480" className="block h-auto w-full max-w-full" preserveAspectRatio="xMidYMid meet">
          <defs><marker id="circuit-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 z" className="fill-current" /></marker></defs>
          <rect x="0" y="0" width="900" height="480" className="fill-background" />
          <path d="M170,240 L285,240 M335,240 L430,240 M550,240 L690,240 L690,340 L170,340 Z" fill="none" className="stroke-slate-800 dark:stroke-slate-100" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M430,180 L430,120 L550,120 L550,180" fill="none" className="stroke-slate-800 dark:stroke-slate-100" strokeWidth="3" strokeLinecap="round" />
          {battery ? <Battery object={battery} highlighted={highlightedIds.has(battery.id) || selectedTargetId === battery.id} onSelect={onSelect} /> : null}
          {resistor ? <Resistor object={resistor} highlighted={highlightedIds.has(resistor.id) || selectedTargetId === resistor.id} onSelect={onSelect} /> : null}
          {ammeter ? <Meter object={ammeter} label="A" highlighted={highlightedIds.has(ammeter.id) || selectedTargetId === ammeter.id} onSelect={onSelect} /> : null}
          {voltmeter ? <Meter object={voltmeter} label="V" highlighted={highlightedIds.has(voltmeter.id) || selectedTargetId === voltmeter.id} onSelect={onSelect} /> : null}
          <g className="stroke-emerald-600 fill-emerald-600"><line x1="250" y1="340" x2="610" y2="340" strokeWidth="4" markerEnd="url(#circuit-arrow)" /><text x="405" y="365" className="fill-emerald-700 text-[14px] font-bold">conventional current</text></g>
          <text x="235" y="62" className="fill-foreground text-[18px] font-semibold">Ohm&apos;s law circuit</text>
          <text x="335" y="425" className="fill-muted-foreground text-[14px]">I = V/R · Ammeter series · Voltmeter parallel</text>
        </svg>
      </div>
    </div>
  );
}

function findComponent(objects: PhysicsObject[], componentType: string) {
  return objects.find((object) => object.componentType === componentType || object.physics?.componentType === componentType || object.id === componentType);
}

function Battery({ object, highlighted, onSelect }: { object: PhysicsObject; highlighted: boolean; onSelect: (id: string) => void }) {
  const strokeWidth = highlighted ? 6 : 4;
  return <g onClick={() => onSelect(object.id)} className="cursor-pointer stroke-slate-800 dark:stroke-slate-100"><line x1="145" y1="200" x2="145" y2="280" strokeWidth={strokeWidth} /><line x1="175" y1="215" x2="175" y2="265" strokeWidth={strokeWidth} /><text x="160" y="315" textAnchor="middle" className="fill-foreground text-[14px] font-semibold">{object.label || 'Battery'}</text></g>;
}

function Resistor({ object, highlighted, onSelect }: { object: PhysicsObject; highlighted: boolean; onSelect: (id: string) => void }) {
  const strokeWidth = highlighted ? 6 : 4;
  return <g onClick={() => onSelect(object.id)} className="cursor-pointer stroke-slate-800 dark:stroke-slate-100"><rect x="430" y="212" width="120" height="56" fill="none" strokeWidth={strokeWidth} /><text x="490" y="302" textAnchor="middle" className="fill-foreground text-[14px] font-semibold">{object.label || 'Resistor'}</text></g>;
}

function Meter({ object, label, highlighted, onSelect }: { object: PhysicsObject; label: string; highlighted: boolean; onSelect: (id: string) => void }) {
  const cx = label === 'A' ? 310 : 490;
  const cy = label === 'A' ? 240 : 120;
  return <g onClick={() => onSelect(object.id)} className="cursor-pointer"><circle cx={cx} cy={cy} r="35" className="fill-background stroke-slate-800 dark:stroke-slate-100" strokeWidth={highlighted ? 6 : 4} /><text x={cx} y={cy + 7} textAnchor="middle" className="fill-foreground text-[22px] font-bold">{label}</text><text x={cx} y={cy + 58} textAnchor="middle" className="fill-muted-foreground text-[12px]">{label === 'A' ? 'ammeter' : 'voltmeter'}</text></g>;
}
