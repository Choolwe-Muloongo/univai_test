'use client';

import type { PhysicsVisual } from '../types';
import { hydraulicPower } from '../math/physicsMath';

type Props = { visual: PhysicsVisual };

function n(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function yes(value: unknown, fallback = true) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  return ['true', 'yes', '1', 'on', 'show'].includes(String(value).toLowerCase());
}

function fmt(value: number, digits = 2) {
  if (!Number.isFinite(value)) return '∞';
  if (Math.abs(value) >= 100_000) return value.toExponential(2);
  if (Math.abs(value) >= 1000) return Math.round(value).toLocaleString();
  return value.toFixed(digits).replace(/\.00$/, '');
}

function kpa(value: number) {
  return `${fmt(value / 1000, 1)} kPa`;
}

function metric(label: string, value: string, note?: string) {
  return (
    <div className="rounded-2xl border bg-background/80 p-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
      {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

function Shell({ visual, children, metrics }: { visual: PhysicsVisual; children: React.ReactNode; metrics: React.ReactNode }) {
  const mode = String(visual.metadata?.visualMode ?? 'schematic');
  return (
    <div className="space-y-4 rounded-3xl border bg-gradient-to-br from-slate-50 via-background to-sky-50 p-4 shadow-sm dark:from-slate-950/30 dark:via-background dark:to-sky-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Hydraulic circuit training renderer</p>
          <h4 className="text-lg font-bold">Pump, valve, actuator and circuit-symbol reading</h4>
          <p className="max-w-3xl text-sm text-muted-foreground">Use schematic mode for industrial symbol reading, fault tracing, pressure/return lines, and valve-state interpretation.</p>
        </div>
        <span className="rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">{mode.replace(/_/g, ' ')}</span>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-auto rounded-3xl border bg-background p-2 shadow-inner">{children}</div>
        <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-1">{metrics}</div>
      </div>
    </div>
  );
}

export function HydraulicCircuitRenderer({ visual }: Props) {
  const pressurePa = n(visual.metadata?.pumpPressurePa ?? visual.metadata?.pressurePa, 6_500_000);
  const q = n(visual.metadata?.flowRateM3s, 0.002);
  const valveState = String(visual.metadata?.valveState ?? 'open');
  const visualMode = String(visual.metadata?.visualMode ?? 'schematic');
  const showPressureLine = yes(visual.metadata?.showPressureLine, true);
  const showReturnLine = yes(visual.metadata?.showReturnLine, true);
  const showPilotLine = yes(visual.metadata?.showPilotLine, true);
  const faultMode = String(visual.metadata?.faultMode ?? 'none');
  const power = hydraulicPower(pressurePa, q);

  return (
    <Shell
      visual={visual}
      metrics={
        <>
          {metric('Pump pressure', kpa(pressurePa), 'Supply line pressure')}
          {metric('Flow rate', `${fmt(q, 4)} m³/s`, 'Pump delivery')}
          {metric('Hydraulic power', `${fmt(power / 1000, 1)} kW`, `Valve: ${valveState}`)}
          {metric('Fault mode', faultMode.replace(/_/g, ' '), visualMode === 'schematic' ? 'Circuit diagnosis enabled' : 'Pictorial teaching mode')}
        </>
      }
    >
      {visualMode === 'pictorial' ? (
        <PictorialCircuit pressurePa={pressurePa} q={q} valveState={valveState} />
      ) : (
        <SchematicCircuit
          pressurePa={pressurePa}
          q={q}
          valveState={valveState}
          faultMode={faultMode}
          showPressureLine={showPressureLine}
          showReturnLine={showReturnLine}
          showPilotLine={showPilotLine}
        />
      )}
    </Shell>
  );
}

function SymbolLabel({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return <text x={x} y={y} className="fill-muted-foreground text-[14px] font-semibold">{children}</text>;
}

function SchematicCircuit({ pressurePa, q, valveState, faultMode, showPressureLine, showReturnLine, showPilotLine }: { pressurePa: number; q: number; valveState: string; faultMode: string; showPressureLine: boolean; showReturnLine: boolean; showPilotLine: boolean }) {
  const blockedFilter = faultMode === 'blocked_filter';
  const reliefOpen = faultMode === 'relief_open' || valveState === 'relief';
  const cylinderStalled = faultMode === 'cylinder_stalled';

  return (
    <svg viewBox="0 0 1120 620" className="h-auto w-full min-w-[860px]">
      <defs>
        <marker id="hyd-symbol-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M2,2 L10,6 L2,10 z" fill="currentColor" /></marker>
        <pattern id="tank-lines" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8 L8 0" stroke="currentColor" strokeWidth="1" opacity="0.25" /></pattern>
      </defs>

      {/* Tank */}
      <rect x="70" y="450" width="190" height="90" fill="url(#tank-lines)" stroke="currentColor" strokeWidth="3" />
      <line x1="70" y1="450" x2="260" y2="450" stroke="currentColor" strokeWidth="5" />
      <SymbolLabel x={105} y={570}>Reservoir / tank</SymbolLabel>

      {/* Pump */}
      <circle cx="175" cy="330" r="58" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M150 350 L182 304 L205 350 Z" fill="none" stroke="currentColor" strokeWidth="4" />
      <line x1="175" y1="450" x2="175" y2="388" stroke="currentColor" strokeWidth="5" />
      <SymbolLabel x={128} y={250}>Pump</SymbolLabel>

      {/* Filter */}
      <rect x="305" y="300" width="84" height="60" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M315 350 L380 310 M315 310 L380 350" stroke="currentColor" strokeWidth="3" />
      {blockedFilter ? <path d="M300 292 L395 368" stroke="#ef4444" strokeWidth="7" /> : null}
      <SymbolLabel x={308} y={285}>Filter</SymbolLabel>

      {/* Pressure gauge */}
      <circle cx="455" cy="230" r="38" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M455 230 L476 210" stroke="currentColor" strokeWidth="4" />
      <text x="434" y="238" className="fill-foreground text-[14px] font-bold">P</text>
      <line x1="455" y1="300" x2="455" y2="268" stroke="currentColor" strokeWidth="3" strokeDasharray="7 6" />
      <SymbolLabel x={410} y={190}>Gauge</SymbolLabel>

      {/* Directional valve */}
      <rect x="540" y="260" width="210" height="120" fill="none" stroke="currentColor" strokeWidth="4" />
      <line x1="610" y1="260" x2="610" y2="380" stroke="currentColor" strokeWidth="3" />
      <line x1="680" y1="260" x2="680" y2="380" stroke="currentColor" strokeWidth="3" />
      <path d="M555 290 L595 350 M595 290 L555 350" stroke="currentColor" strokeWidth="3" />
      <path d="M625 320 H665" stroke="currentColor" strokeWidth="4" markerEnd="url(#hyd-symbol-arrow)" />
      <path d="M695 350 L735 290" stroke="currentColor" strokeWidth="4" markerEnd="url(#hyd-symbol-arrow)" />
      <SymbolLabel x={552} y={235}>4/3 directional control valve</SymbolLabel>
      <text x="595" y="410" className="fill-foreground text-[15px] font-bold">state: {valveState}</text>

      {/* Cylinder */}
      <rect x="870" y="250" width="170" height="120" fill="none" stroke="currentColor" strokeWidth="4" />
      <line x1="965" y1="250" x2="965" y2="370" stroke="currentColor" strokeWidth="4" />
      <rect x="965" y="300" width="105" height="22" fill="none" stroke="currentColor" strokeWidth="4" />
      <line x1="1070" y1="311" x2="1100" y2="311" stroke="currentColor" strokeWidth="5" />
      {cylinderStalled ? <path d="M842 236 L1092 388" stroke="#ef4444" strokeWidth="7" /> : null}
      <SymbolLabel x={884} y={225}>Double-acting cylinder</SymbolLabel>

      {/* Relief valve */}
      <rect x="370" y="430" width="95" height="70" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M385 485 L450 445" stroke="currentColor" strokeWidth="4" markerEnd="url(#hyd-symbol-arrow)" />
      <path d="M390 435 C405 415 425 415 440 435" fill="none" stroke="currentColor" strokeWidth="3" />
      {reliefOpen ? <circle cx="465" cy="430" r="13" fill="#ef4444" opacity="0.9" /> : null}
      <SymbolLabel x={350} y={530}>Relief valve</SymbolLabel>

      {/* Lines */}
      {showPressureLine ? <path d="M233 330 H305 M389 330 H540" fill="none" stroke="#ef4444" strokeWidth="7" strokeLinecap="round" markerEnd="url(#hyd-symbol-arrow)" /> : null}
      {showPressureLine ? <path d="M750 290 H870" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" markerEnd="url(#hyd-symbol-arrow)" /> : null}
      {showReturnLine ? <path d="M870 350 H750 M540 350 H250 V450" fill="none" stroke="#0284c7" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#hyd-symbol-arrow)" /> : null}
      {showReturnLine ? <path d="M417 500 V540 H250" fill="none" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" /> : null}
      {showPressureLine ? <path d="M345 360 V465 H370" fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" /> : null}
      {showPilotLine ? <path d="M455 300 V330 H540" fill="none" stroke="#64748b" strokeWidth="3" strokeDasharray="8 7" /> : null}

      <rect x="68" y="38" width="980" height="72" rx="18" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <text x="92" y="70" className="fill-foreground text-[16px] font-bold">Industrial reading layer</text>
      <text x="92" y="94" className="fill-muted-foreground text-[14px]">Red = pressure/supply line · Blue = return line · Dashed grey = pilot/gauge signal · Q = {fmt(q, 4)} m³/s · P = {kpa(pressurePa)}</text>
    </svg>
  );
}

function PictorialCircuit({ pressurePa, q, valveState }: { pressurePa: number; q: number; valveState: string }) {
  return (
    <svg viewBox="0 0 980 520" className="h-auto w-full min-w-[760px]">
      <defs><marker id="pressure-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M2,2 L10,6 L2,10 z" fill="currentColor" /></marker></defs>
      <rect x="90" y="335" width="160" height="85" rx="18" fill="#38bdf8" opacity="0.35" stroke="#0369a1" strokeWidth="6" />
      <circle cx="170" cy="235" r="54" fill="none" stroke="currentColor" strokeWidth="7" />
      <path d="M145 250 L185 215 L195 260 Z" fill="#0ea5e9" opacity="0.8" />
      <rect x="365" y="195" width="120" height="90" rx="16" fill="none" stroke="currentColor" strokeWidth="7" />
      <path d="M382 240 H468 M452 222 L470 240 L452 258" stroke="#059669" strokeWidth="5" fill="none" />
      <rect x="675" y="205" width="190" height="80" rx="20" fill="#38bdf8" opacity="0.35" stroke="#0369a1" strokeWidth="6" />
      <rect x="805" y="195" width="38" height="100" rx="10" fill="#64748b" />
      <path d="M170 335 V290 M224 235 H365 M485 240 H675 M770 285 V365 H250" fill="none" stroke="#0284c7" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="515" y1="355" x2="515" y2="255" stroke="#ef4444" strokeWidth="8" strokeDasharray="10 8" markerEnd="url(#pressure-arrow)" />
      <text x="125" y="185" className="fill-foreground text-[15px] font-bold">Pump</text>
      <text x="360" y="175" className="fill-foreground text-[15px] font-bold">Directional valve</text>
      <text x="690" y="185" className="fill-foreground text-[15px] font-bold">Actuator</text>
      <text x="500" y="390" className="fill-muted-foreground text-[15px]">Return line to tank</text>
      <text x="100" y="470" className="fill-muted-foreground text-[15px]">P = {kpa(pressurePa)} · Q = {fmt(q, 4)} m³/s · valve = {valveState}</text>
    </svg>
  );
}
