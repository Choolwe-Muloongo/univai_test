import type { PhysicsVisual } from '../types';
import { SvgDiagramRenderer } from './SvgDiagramRenderer';

type Props = {
  visual: PhysicsVisual;
  highlightedIds: Set<string>;
  hiddenIds: Set<string>;
  selectedTargetId?: string | null;
  onSelect: (id: string) => void;
};

export function GraphPhysicsRenderer(props: Props) {
  const { visual, onSelect } = props;
  const width = visual.canvas?.width || 900;
  const height = visual.canvas?.height || 520;
  const graph = (visual.metadata?.graph ?? {}) as Record<string, unknown>;
  const points = Array.isArray(graph.points) ? graph.points as Array<[number, number]> : [[0, 0], [4, 20], [8, 20], [12, 0]];
  const xMax = Number(graph.xMax ?? 12);
  const yMax = Number(graph.yMax ?? 30);
  const plot = points.map(([x, y]) => `${130 + (x / xMax) * 580},${390 - (y / yMax) * 300}`).join(' ');
  const areaPoints = `130,390 ${plot} ${130 + (points[points.length - 1][0] / xMax) * 580},390`;

  return (
    <div className="space-y-3 rounded-2xl border bg-muted/10 p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Graph renderer</p>
        <p className="text-sm text-muted-foreground">Read gradient, area under graph, and axis values.</p>
      </div>
      <div className="overflow-auto rounded-2xl border bg-background p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[640px]">
          <defs>
            <marker id="graph-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 z" className="fill-current" /></marker>
          </defs>
          <rect x="0" y="0" width={width} height={height} className="fill-background" />
          {Array.from({ length: 15 }, (_, i) => <line key={`gx-${i}`} x1={130 + i * 40} x2={130 + i * 40} y1="70" y2="390" className="stroke-muted" />)}
          {Array.from({ length: 9 }, (_, i) => <line key={`gy-${i}`} x1="130" x2="740" y1={390 - i * 40} y2={390 - i * 40} className="stroke-muted" />)}
          <g className="stroke-slate-800 fill-slate-800 dark:stroke-slate-100 dark:fill-slate-100">
            <line x1="130" y1="390" x2="750" y2="390" strokeWidth="3" markerEnd="url(#graph-arrow)" />
            <line x1="130" y1="390" x2="130" y2="60" strokeWidth="3" markerEnd="url(#graph-arrow)" />
          </g>
          <polygon points={areaPoints} className="fill-primary/10 stroke-primary/20" onClick={() => onSelect('graph-area')} />
          <polyline points={plot} fill="none" className="stroke-primary" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map(([x, y]) => <circle key={`${x}-${y}`} cx={130 + (x / xMax) * 580} cy={390 - (y / yMax) * 300} r="6" className="fill-primary" />)}
          <path d="M210,330 L330,330 L330,210" fill="none" className="stroke-amber-600" strokeWidth="4" strokeDasharray="8 6" onClick={() => onSelect('gradient-triangle')} />
          <text x="360" y="225" className="fill-amber-700 text-[15px] font-bold">gradient = acceleration</text>
          <text x="325" y="455" textAnchor="middle" className="fill-foreground text-[16px] font-semibold">time / s</text>
          <text x="60" y="230" textAnchor="middle" className="fill-foreground text-[16px] font-semibold" transform="rotate(-90 60 230)">velocity / m s⁻¹</text>
          <text x="255" y="425" className="fill-primary text-[14px] font-semibold">area = displacement</text>
        </svg>
      </div>
      <SvgDiagramRenderer {...props} />
    </div>
  );
}
