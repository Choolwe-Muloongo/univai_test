'use client';

import type { PhysicsVisual } from '../types';
import { pressure } from '../math/physicsMath';

export function FluidFlowRenderer({ visual }: { visual: PhysicsVisual }) {
  const p1 = Number(visual.metadata?.pressure1Pa ?? 120000);
  const p2 = Number(visual.metadata?.pressure2Pa ?? 85000);
  const v1 = Number(visual.metadata?.velocity1Ms ?? 2);
  const v2 = Number(visual.metadata?.velocity2Ms ?? 5);
  const force = Number(visual.metadata?.forceN ?? 100);
  const area = Number(visual.metadata?.areaM2 ?? 0.02);
  const pressureFromForce = pressure(force, area);

  return (
    <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border bg-muted/10 p-3 sm:p-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Advanced fluid renderer</p>
        <h4 className="break-words font-semibold">Bernoulli flow and pressure comparison</h4>
        <p className="break-words text-sm text-muted-foreground">Shows pipe narrowing, velocity increase, and pressure change.</p>
      </div>
      <div className="max-w-full overflow-x-auto rounded-2xl border bg-background p-1 sm:p-2">
        <svg viewBox="0 0 900 420" className="block h-auto max-h-[70vh] w-full min-w-[320px] max-w-full" preserveAspectRatio="xMidYMid meet">
          <defs><marker id="fluid-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 z" className="fill-current" /></marker></defs>
          <path d="M90,150 C260,150 280,205 430,205 C580,205 600,150 810,150" fill="none" className="stroke-blue-700" strokeWidth="6" />
          <path d="M90,270 C260,270 280,215 430,215 C580,215 600,270 810,270" fill="none" className="stroke-blue-700" strokeWidth="6" />
          {[160, 250, 360, 480, 610, 720].map((x, index) => <line key={x} x1={x} y1="210" x2={x + 52 + index * 4} y2="210" className="stroke-emerald-600 fill-emerald-600" strokeWidth={index > 2 ? 5 : 3} markerEnd="url(#fluid-arrow)" />)}
          <text x="135" y="120" className="fill-foreground text-[14px] font-semibold">P₁={Math.round(p1 / 1000)} kPa, v₁={v1} m/s</text>
          <text x="570" y="120" className="fill-foreground text-[14px] font-semibold">P₂={Math.round(p2 / 1000)} kPa, v₂={v2} m/s</text>
          <text x="115" y="350" className="fill-muted-foreground text-[13px]">Bernoulli idea: higher speed region often has lower static pressure.</text>
          <text x="115" y="375" className="fill-muted-foreground text-[13px]">Pressure from F/A example: {pressureFromForce.toFixed(0)} Pa.</text>
        </svg>
      </div>
    </div>
  );
}