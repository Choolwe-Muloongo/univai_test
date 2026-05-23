'use client';

import type { PhysicsVisual } from '../types';
import { trapezoidalArea } from '../math/physicsMath';

export function ThermodynamicCycleRenderer({ visual }: { visual: PhysicsVisual }) {
  const points = (visual.metadata?.cyclePoints as Array<[number, number]> | undefined) ?? [[1, 1], [3, 1], [3, 3], [1, 3], [1, 1]];
  const area = Math.abs(trapezoidalArea(points));
  const plotX = (v: number) => 120 + v * 150;
  const plotY = (p: number) => 390 - p * 85;
  const polyline = points.map(([v, p]) => `${plotX(v)},${plotY(p)}`).join(' ');
  const polygon = `120,390 ${polyline} 120,390`;

  return (
    <div className="space-y-4 rounded-2xl border bg-muted/10 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Advanced thermodynamics renderer</p>
        <h4 className="font-semibold">PV cycle diagram</h4>
        <p className="text-sm text-muted-foreground">Shows the cycle path and shaded work area enclosed by the process.</p>
      </div>
      <div className="overflow-auto rounded-2xl border bg-background p-2">
        <svg viewBox="0 0 900 500" className="h-auto w-full min-w-[680px]">
          <defs><marker id="thermo-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 z" className="fill-current" /></marker></defs>
          <line x1="100" y1="400" x2="800" y2="400" className="stroke-muted-foreground" strokeWidth="3" />
          <line x1="100" y1="400" x2="100" y2="70" className="stroke-muted-foreground" strokeWidth="3" />
          <text x="780" y="425" className="fill-muted-foreground text-[13px]">V</text>
          <text x="75" y="85" className="fill-muted-foreground text-[13px]">P</text>
          <polygon points={polygon} className="fill-primary/10" />
          <polyline points={polyline} fill="none" className="stroke-blue-700 fill-blue-700" strokeWidth="5" strokeLinejoin="round" markerEnd="url(#thermo-arrow)" />
          {points.slice(0, -1).map(([v, p], index) => <g key={index}><circle cx={plotX(v)} cy={plotY(p)} r="7" className="fill-emerald-600" /><text x={plotX(v) + 10} y={plotY(p) - 8} className="fill-foreground text-[13px]">{String.fromCharCode(65 + index)}</text></g>)}
          <text x="145" y="455" className="fill-muted-foreground text-[13px]">Estimated enclosed area ∝ work ≈ {area.toFixed(2)} pressure-volume units.</text>
        </svg>
      </div>
    </div>
  );
}
