'use client';

import type { PhysicsVisual } from '../types';
import { lorentzFactor } from '../math/physicsMath';

export function SpacetimeDiagramRenderer({ visual }: { visual: PhysicsVisual }) {
  const beta = Math.max(-0.95, Math.min(0.95, Number(visual.metadata?.beta ?? 0.6)));
  const gamma = lorentzFactor(beta * 299_792_458);
  const centerX = 450;
  const centerY = 250;
  const scale = 120;
  const worldlineTilt = beta * scale;

  return (
    <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border bg-muted/10 p-3 sm:p-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Advanced relativity renderer</p>
        <h4 className="break-words font-semibold">Minkowski spacetime diagram</h4>
        <p className="break-words text-sm text-muted-foreground">Shows ct and x axes, light cone, a moving observer worldline, and Lorentz factor.</p>
      </div>
      <div className="max-w-full overflow-x-auto rounded-2xl border bg-background p-1 sm:p-2">
        <svg viewBox="0 0 900 520" className="block h-auto max-h-[70vh] w-full min-w-[320px] max-w-full" preserveAspectRatio="xMidYMid meet">
          <defs><marker id="rel-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 z" className="fill-current" /></marker></defs>
          <line x1="80" y1={centerY} x2="820" y2={centerY} className="stroke-muted-foreground" strokeWidth="3" markerEnd="url(#rel-arrow)" />
          <line x1={centerX} y1="470" x2={centerX} y2="55" className="stroke-muted-foreground" strokeWidth="3" markerEnd="url(#rel-arrow)" />
          <text x="805" y={centerY - 12} className="fill-muted-foreground text-[13px]">x</text>
          <text x={centerX + 12} y="70" className="fill-muted-foreground text-[13px]">ct</text>
          <line x1={centerX - 220} y1={centerY + 220} x2={centerX + 220} y2={centerY - 220} className="stroke-amber-600" strokeWidth="3" strokeDasharray="9 7" />
          <line x1={centerX + 220} y1={centerY + 220} x2={centerX - 220} y2={centerY - 220} className="stroke-amber-600" strokeWidth="3" strokeDasharray="9 7" />
          <text x={centerX + 235} y={centerY - 215} className="fill-amber-700 text-[13px]">light cone</text>
          <line x1={centerX} y1={centerY + 210} x2={centerX + worldlineTilt} y2={centerY - 210} className="stroke-blue-700" strokeWidth="5" />
          <circle cx={centerX + worldlineTilt * 0.45} cy={centerY - 95} r="8" className="fill-emerald-600" />
          <text x={centerX + worldlineTilt * 0.45 + 12} y={centerY - 100} className="fill-emerald-700 text-[13px]">event</text>
          <text x="95" y="70" className="fill-foreground text-[15px] font-semibold">β = {beta.toFixed(2)}, γ = {gamma.toFixed(3)}</text>
        </svg>
      </div>
    </div>
  );
}