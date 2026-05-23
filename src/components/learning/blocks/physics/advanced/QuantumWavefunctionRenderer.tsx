'use client';

import type { PhysicsVisual } from '../types';
import { probabilityDensity, trapezoidalArea } from '../math/physicsMath';

type Props = { visual: PhysicsVisual };

export function QuantumWavefunctionRenderer({ visual }: Props) {
  const width = visual.canvas?.width || 900;
  const height = visual.canvas?.height || 460;
  const amplitude = Number(visual.metadata?.amplitude ?? 1);
  const quantumNumber = Math.max(1, Number(visual.metadata?.quantumNumber ?? 2));
  const length = Number(visual.metadata?.wellLength ?? 1);
  const samples = 180;
  const points = Array.from({ length: samples + 1 }, (_, index) => {
    const x = index / samples;
    const psi = amplitude * Math.sin(quantumNumber * Math.PI * x);
    return [x * length, psi] as [number, number];
  });
  const densityPoints = points.map(([x, psi]) => [x, probabilityDensity(psi)] as [number, number]);
  const normalizationEstimate = trapezoidalArea(densityPoints);
  const plotX = (x: number) => 90 + (x / length) * 700;
  const psiY = (psi: number) => 175 - psi * 90;
  const densityY = (density: number) => 365 - density * 95;
  const psiPolyline = points.map(([x, psi]) => `${plotX(x)},${psiY(psi)}`).join(' ');
  const densityPolyline = densityPoints.map(([x, density]) => `${plotX(x)},${densityY(density)}`).join(' ');
  const nodes = Array.from({ length: quantumNumber + 1 }, (_, index) => index / quantumNumber).filter((value) => value > 0 && value < 1);

  return (
    <div className="space-y-4 rounded-2xl border bg-muted/10 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Advanced quantum renderer</p>
        <h4 className="font-semibold">Wavefunction and probability density</h4>
        <p className="text-sm text-muted-foreground">Plots ψ(x), |ψ|², nodes, and a numerical normalization estimate.</p>
      </div>
      <div className="overflow-auto rounded-2xl border bg-background p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[680px]">
          <line x1="90" y1="175" x2="790" y2="175" className="stroke-muted-foreground" strokeDasharray="8 8" />
          <line x1="90" y1="365" x2="790" y2="365" className="stroke-muted-foreground" strokeDasharray="8 8" />
          <text x="95" y="45" className="fill-foreground text-[17px] font-semibold">Particle in a 1D box: n={quantumNumber}</text>
          <text x="95" y="145" className="fill-muted-foreground text-[13px]">ψ(x)</text>
          <text x="95" y="335" className="fill-muted-foreground text-[13px]">|ψ|²</text>
          <polyline points={psiPolyline} fill="none" className="stroke-blue-600" strokeWidth="4" strokeLinecap="round" />
          <polyline points={densityPolyline} fill="none" className="stroke-emerald-600" strokeWidth="4" strokeLinecap="round" />
          {nodes.map((node) => <g key={node}><line x1={plotX(node * length)} x2={plotX(node * length)} y1="80" y2="395" className="stroke-amber-600" strokeWidth="2" strokeDasharray="6 6" /><text x={plotX(node * length) + 6} y="105" className="fill-amber-700 text-[12px]">node</text></g>)}
          <text x="95" y="425" className="fill-muted-foreground text-[13px]">∫|ψ|² dx ≈ {normalizationEstimate.toFixed(3)}. For a normalized state this should be 1.</text>
        </svg>
      </div>
    </div>
  );
}
