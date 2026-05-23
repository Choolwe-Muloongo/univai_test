'use client';

import type { PhysicsVisual } from '../types';
import { electricFieldStrength } from '../math/physicsMath';

export function FieldVisualizationRenderer({ visual }: { visual: PhysicsVisual }) {
  const charge = Number(visual.metadata?.chargeC ?? 1e-9);
  const fieldAt1m = electricFieldStrength(charge, 1);
  const isMagnetic = visual.template === 'magnetic_field';
  const vectors = Array.from({ length: 7 }, (_, row) => Array.from({ length: 9 }, (_, col) => ({ x: 110 + col * 80, y: 95 + row * 45 }))).flat();

  return (
    <div className="space-y-4 rounded-2xl border bg-muted/10 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Advanced field renderer</p>
        <h4 className="font-semibold">{isMagnetic ? 'Magnetic field visualization' : 'Electric field visualization'}</h4>
        <p className="text-sm text-muted-foreground">Shows vector arrows, source object, and field-strength interpretation.</p>
      </div>
      <div className="overflow-auto rounded-2xl border bg-background p-2">
        <svg viewBox="0 0 900 480" className="h-auto w-full min-w-[680px]">
          <defs><marker id="field-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 z" className="fill-current" /></marker></defs>
          <circle cx="450" cy="240" r="34" className={isMagnetic ? 'fill-red-100 stroke-red-700' : charge >= 0 ? 'fill-blue-100 stroke-blue-700' : 'fill-amber-100 stroke-amber-700'} strokeWidth="4" />
          <text x="450" y="246" textAnchor="middle" className="fill-foreground text-[18px] font-bold">{isMagnetic ? 'N' : charge >= 0 ? '+' : '-'}</text>
          {vectors.map(({ x, y }, index) => {
            const dx = isMagnetic ? -(y - 240) : x - 450;
            const dy = isMagnetic ? x - 450 : y - 240;
            const length = Math.sqrt(dx * dx + dy * dy) || 1;
            const ux = dx / length;
            const uy = dy / length;
            return <line key={index} x1={x} y1={y} x2={x + ux * 28} y2={y + uy * 28} className={isMagnetic ? 'stroke-red-600 fill-red-600' : 'stroke-blue-600 fill-blue-600'} strokeWidth="3" markerEnd="url(#field-arrow)" />;
          })}
          <text x="90" y="430" className="fill-muted-foreground text-[13px]">{isMagnetic ? 'Vector direction represents local magnetic field orientation.' : `E(1 m) ≈ ${fieldAt1m.toExponential(2)} N/C for q=${charge.toExponential(1)} C.`}</text>
        </svg>
      </div>
    </div>
  );
}
