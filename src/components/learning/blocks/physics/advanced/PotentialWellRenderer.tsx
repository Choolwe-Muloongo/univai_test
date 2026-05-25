'use client';

import type { PhysicsVisual } from '../types';

export function PotentialWellRenderer({ visual }: { visual: PhysicsVisual }) {
  const barrierHeight = Number(visual.metadata?.barrierHeightEv ?? 8);
  const energy = Number(visual.metadata?.particleEnergyEv ?? 5);
  const width = visual.canvas?.width || 900;
  const height = visual.canvas?.height || 440;
  const scaleMax = Math.max(barrierHeight, energy, 1);
  const yFor = (value: number) => 355 - (value / scaleMax) * 240;
  const energyY = yFor(energy);
  const barrierY = yFor(barrierHeight);
  const belowBarrier = energy < barrierHeight;

  return (
    <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border bg-muted/10 p-3 sm:p-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Advanced quantum renderer</p>
        <h4 className="break-words font-semibold">Potential well and barrier</h4>
        <p className="break-words text-sm text-muted-foreground">Compares total energy with a potential barrier and marks the region requiring quantum interpretation.</p>
      </div>
      <div className="max-w-full overflow-x-auto rounded-2xl border bg-background p-1 sm:p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto max-h-[70vh] w-full min-w-[320px] max-w-full" preserveAspectRatio="xMidYMid meet">
          <line x1="90" y1="360" x2="810" y2="360" className="stroke-muted-foreground" strokeWidth="3" />
          <line x1="90" y1="80" x2="90" y2="360" className="stroke-muted-foreground" strokeWidth="3" />
          <text x="94" y="65" className="fill-muted-foreground text-[13px]">Energy / eV</text>
          <path d={`M110,360 L250,360 L250,${barrierY} L370,${barrierY} L370,360 L540,360 L540,${barrierY + 40} L660,${barrierY + 40} L660,360 L790,360`} fill="none" className="stroke-blue-700" strokeWidth="5" />
          <line x1="110" x2="790" y1={energyY} y2={energyY} className="stroke-emerald-600" strokeWidth="4" strokeDasharray="10 6" />
          <text x="680" y={energyY - 12} className="fill-emerald-700 text-[14px] font-semibold">E = {energy} eV</text>
          <text x="262" y={barrierY - 12} className="fill-blue-700 text-[14px] font-semibold">V₀ = {barrierHeight} eV</text>
          {belowBarrier ? <rect x="250" y={energyY} width="120" height={360 - energyY} className="fill-amber-500/20 stroke-amber-600" strokeDasharray="8 8" /> : null}
          <text x="230" y="405" className="fill-muted-foreground text-[13px]">{belowBarrier ? 'E is below the barrier: quantum tunnelling can be discussed here.' : 'E is above the barrier: the state is classically allowed across this region.'}</text>
        </svg>
      </div>
    </div>
  );
}