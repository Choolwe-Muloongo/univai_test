'use client';

import type { PhysicsVisual } from '../types';
import {
  bernoulliTotalPressure,
  buoyantForce,
  cylinderExtensionSpeed,
  darcyWeisbachPressureDrop,
  flowRate,
  hydraulicForce,
  hydraulicPower,
  hydrostaticPressure,
  pipeCrossSectionArea,
  pressure,
  reynoldsNumber,
} from '../math/physicsMath';

type HydraulicsProps = {
  visual: PhysicsVisual;
};

function n(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
    <div className="min-w-0 rounded-2xl border bg-background/80 p-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-lg font-bold text-foreground">{value}</p>
      {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export function HydraulicsRenderer({ visual }: HydraulicsProps) {
  const template = visual.template;

  if (template === 'fluid_pressure') return <FluidPressureScene visual={visual} />;
  if (template === 'bernoulli_flow') return <BernoulliFlowScene visual={visual} />;
  if (template === 'pipe_flow') return <PipeFlowScene visual={visual} />;
  if (template === 'buoyancy') return <BuoyancyScene visual={visual} />;
  if (template === 'manometer') return <ManometerScene visual={visual} />;
  if (template === 'hydraulic_cylinder') return <HydraulicCylinderScene visual={visual} />;
  if (template === 'hydraulic_brake' || template === 'brake_hydraulics') return <HydraulicBrakeScene visual={visual} />;
  if (template === 'pump_valve_circuit') return <PumpValveCircuitScene visual={visual} />;

  return <HydraulicPressScene visual={visual} />;
}

function HydraulicShell({ visual, title, subtitle, children, metrics }: { visual: PhysicsVisual; title: string; subtitle: string; children: React.ReactNode; metrics: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-4 overflow-hidden rounded-2xl border bg-gradient-to-br from-sky-50 via-background to-cyan-50 p-3 shadow-sm dark:from-sky-950/20 dark:via-background dark:to-cyan-950/20 sm:rounded-3xl sm:p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Advanced hydraulics renderer</p>
          <h4 className="break-words text-base font-bold sm:text-lg">{title}</h4>
          <p className="max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <span className="max-w-full truncate rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">{visual.template.replace(/_/g, ' ')}</span>
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 overflow-hidden rounded-2xl border bg-background p-1 shadow-inner sm:rounded-3xl sm:p-2">
          {children}
        </div>
        <div className="grid min-w-0 content-start gap-3 sm:grid-cols-2 xl:grid-cols-1">{metrics}</div>
      </div>
    </div>
  );
}

const responsiveSvgClass = 'h-auto w-full max-w-full';

function HydraulicPressScene({ visual }: HydraulicsProps) {
  const inputForce = n(visual.metadata?.inputForceN ?? visual.metadata?.forceN, 150);
  const inputArea = n(visual.metadata?.inputAreaM2, 0.003);
  const outputArea = n(visual.metadata?.outputAreaM2, 0.06);
  const p = pressure(inputForce, inputArea);
  const outputForce = hydraulicForce(inputForce, inputArea, outputArea);
  const mechanicalAdvantage = inputArea === 0 ? 0 : outputArea / inputArea;

  return (
    <HydraulicShell
      visual={visual}
      title="Hydraulic press force multiplication"
      subtitle="Pascal’s principle shown as one pressure field acting through different piston areas."
      metrics={
        <>
          {metric('Input pressure', kpa(p), 'P = F₁ / A₁')}
          {metric('Output force', `${fmt(outputForce, 0)} N`, 'F₂ = P × A₂')}
          {metric('Mechanical advantage', `${fmt(mechanicalAdvantage, 1)}×`, 'Area ratio A₂ / A₁')}
        </>
      }
    >
      <svg viewBox="0 0 980 520" className={responsiveSvgClass}>
        <defs>
          <linearGradient id="hydraulic-fluid" x1="0" x2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" /><stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.45" /></linearGradient>
          <marker id="pressure-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M2,2 L10,6 L2,10 z" fill="currentColor" /></marker>
        </defs>
        <rect x="120" y="170" width="140" height="210" rx="18" fill="none" stroke="currentColor" strokeWidth="8" opacity="0.75" />
        <rect x="650" y="110" width="220" height="270" rx="22" fill="none" stroke="currentColor" strokeWidth="8" opacity="0.75" />
        <path d="M190 380 V430 H760 V380" fill="none" stroke="url(#hydraulic-fluid)" strokeWidth="70" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="135" y="235" width="110" height="32" rx="12" fill="#64748b" />
        <rect x="675" y="185" width="170" height="38" rx="14" fill="#64748b" />
        <line x1="190" y1="90" x2="190" y2="230" stroke="#ef4444" strokeWidth="10" markerEnd="url(#pressure-arrow)" />
        <line x1="760" y1="255" x2="760" y2="120" stroke="#22c55e" strokeWidth="12" markerEnd="url(#pressure-arrow)" />
        {[330, 420, 510, 600].map((x) => <line key={x} x1={x} y1="430" x2={x + 45} y2="430" stroke="#0284c7" strokeWidth="6" markerEnd="url(#pressure-arrow)" />)}
        <text x="130" y="70" className="fill-foreground text-[18px] font-bold">F₁ = {fmt(inputForce, 0)} N</text>
        <text x="655" y="88" className="fill-foreground text-[18px] font-bold">F₂ ≈ {fmt(outputForce, 0)} N</text>
        <text x="105" y="420" className="fill-muted-foreground text-[15px]">A₁ = {fmt(inputArea, 4)} m²</text>
        <text x="650" y="420" className="fill-muted-foreground text-[15px]">A₂ = {fmt(outputArea, 3)} m²</text>
        <text x="345" y="500" className="fill-muted-foreground text-[15px]">Same fluid pressure travels through the connected chamber.</text>
      </svg>
    </HydraulicShell>
  );
}

function FluidPressureScene({ visual }: HydraulicsProps) {
  const density = n(visual.metadata?.densityKgM3, 1000);
  const depth = n(visual.metadata?.depthM, 4);
  const p = hydrostaticPressure(density, depth);

  return (
    <HydraulicShell
      visual={visual}
      title="Hydrostatic pressure with depth"
      subtitle="Pressure rises as the column of liquid above the point becomes heavier."
      metrics={
        <>
          {metric('Gauge pressure', kpa(p), 'ρgh')}
          {metric('Density', `${fmt(density, 0)} kg/m³`, 'Fluid property')}
          {metric('Depth', `${fmt(depth, 2)} m`, 'Measured below surface')}
        </>
      }
    >
      <svg viewBox="0 0 900 520" className={responsiveSvgClass}>
        <rect x="210" y="70" width="440" height="380" rx="28" fill="none" stroke="currentColor" strokeWidth="8" opacity="0.75" />
        <rect x="220" y="125" width="420" height="315" rx="18" fill="#38bdf8" opacity="0.45" />
        <line x1="680" y1="125" x2="680" y2="440" stroke="currentColor" strokeWidth="3" strokeDasharray="8 8" />
        <line x1="660" y1="125" x2="700" y2="125" stroke="currentColor" strokeWidth="3" />
        <line x1="660" y1="440" x2="700" y2="440" stroke="currentColor" strokeWidth="3" />
        <text x="705" y="290" className="fill-foreground text-[18px] font-bold">h = {fmt(depth)} m</text>
        {[170, 260, 350].map((y, i) => (
          <g key={y}>
            <line x1="250" y1={y} x2={250 + 60 + i * 45} y2={y} stroke="#0284c7" strokeWidth={4 + i * 2} markerEnd="url(#pressure-arrow)" />
            <line x1="610" y1={y} x2={610 - 60 - i * 45} y2={y} stroke="#0284c7" strokeWidth={4 + i * 2} markerEnd="url(#pressure-arrow)" />
          </g>
        ))}
        <circle cx="430" cy="440" r="12" fill="#ef4444" />
        <text x="365" y="485" className="fill-muted-foreground text-[16px]">Pressure point: {kpa(p)}</text>
      </svg>
    </HydraulicShell>
  );
}

function BernoulliFlowScene({ visual }: HydraulicsProps) {
  const density = n(visual.metadata?.densityKgM3, 1000);
  const p1 = n(visual.metadata?.pressure1Pa, 120_000);
  const p2 = n(visual.metadata?.pressure2Pa, 85_000);
  const v1 = n(visual.metadata?.velocity1Ms, 2);
  const v2 = n(visual.metadata?.velocity2Ms, 5);
  const total1 = bernoulliTotalPressure(p1, density, v1);
  const total2 = bernoulliTotalPressure(p2, density, v2);

  return (
    <HydraulicShell
      visual={visual}
      title="Bernoulli flow through a restriction"
      subtitle="The narrowed section speeds up the fluid and changes the static pressure."
      metrics={
        <>
          {metric('Section 1 total', kpa(total1), 'P + ½ρv²')}
          {metric('Section 2 total', kpa(total2), 'Compare energy line')}
          {metric('Velocity increase', `${fmt(v2 / Math.max(v1, 0.0001), 1)}×`, 'v₂ / v₁')}
        </>
      }
    >
      <svg viewBox="0 0 980 500" className={responsiveSvgClass}>
        <defs><marker id="flow-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M2,2 L10,6 L2,10 z" fill="#059669" /></marker></defs>
        <path d="M80,160 C270,160 300,230 470,230 C640,230 670,160 900,160" fill="none" stroke="#0369a1" strokeWidth="8" />
        <path d="M80,340 C270,340 300,270 470,270 C640,270 670,340 900,340" fill="none" stroke="#0369a1" strokeWidth="8" />
        {[140, 245, 360, 485, 610, 735].map((x, i) => <line key={x} x1={x} y1="250" x2={x + 60 + i * 7} y2="250" stroke="#059669" strokeWidth={i > 2 ? 6 : 4} markerEnd="url(#flow-arrow)" />)}
        <text x="115" y="120" className="fill-foreground text-[17px] font-bold">P₁ {kpa(p1)} · v₁ {fmt(v1)} m/s</text>
        <text x="610" y="120" className="fill-foreground text-[17px] font-bold">P₂ {kpa(p2)} · v₂ {fmt(v2)} m/s</text>
        <text x="395" y="405" className="fill-muted-foreground text-[15px]">Fast throat region: kinetic energy rises.</text>
      </svg>
    </HydraulicShell>
  );
}

function PipeFlowScene({ visual }: HydraulicsProps) {
  const density = n(visual.metadata?.densityKgM3, 1000);
  const diameter = n(visual.metadata?.pipeDiameterM ?? visual.metadata?.diameterM, 0.08);
  const velocity = n(visual.metadata?.velocityMs, 3);
  const length = n(visual.metadata?.pipeLengthM, 12);
  const friction = n(visual.metadata?.frictionFactor, 0.025);
  const area = pipeCrossSectionArea(diameter);
  const q = flowRate(area, velocity);
  const re = reynoldsNumber(density, velocity, diameter);
  const drop = darcyWeisbachPressureDrop(friction, length, diameter, density, velocity);

  return (
    <HydraulicShell
      visual={visual}
      title="Pipe flow, Reynolds number, and pressure loss"
      subtitle="Advanced hydraulics needs flow rate, regime awareness, and losses—not only ideal pressure."
      metrics={
        <>
          {metric('Flow rate', `${fmt(q, 4)} m³/s`, 'Q = Av')}
          {metric('Reynolds number', fmt(re, 0), re < 2300 ? 'Likely laminar' : re < 4000 ? 'Transition region' : 'Likely turbulent')}
          {metric('Pressure drop', kpa(drop), 'Darcy-Weisbach estimate')}
        </>
      }
    >
      <svg viewBox="0 0 980 500" className={responsiveSvgClass}>
        <rect x="110" y="185" width="740" height="130" rx="65" fill="#38bdf8" opacity="0.32" stroke="#0369a1" strokeWidth="8" />
        {[170, 280, 390, 500, 610, 720].map((x) => <line key={x} x1={x} y1="250" x2={x + 70} y2="250" stroke="#059669" strokeWidth="6" markerEnd="url(#pressure-arrow)" />)}
        <path d="M140 175 C240 125 360 125 460 175" fill="none" stroke="#f97316" strokeWidth="4" strokeDasharray="8 8" />
        <path d="M530 325 C640 380 760 380 850 325" fill="none" stroke="#f97316" strokeWidth="4" strokeDasharray="8 8" />
        <text x="120" y="145" className="fill-foreground text-[17px] font-bold">D = {fmt(diameter, 3)} m</text>
        <text x="390" y="115" className="fill-muted-foreground text-[15px]">Losses grow with length, velocity, and roughness/friction.</text>
        <text x="600" y="405" className="fill-foreground text-[17px] font-bold">L = {fmt(length, 1)} m</text>
      </svg>
    </HydraulicShell>
  );
}

function BuoyancyScene({ visual }: HydraulicsProps) {
  const density = n(visual.metadata?.densityKgM3, 1000);
  const volume = n(visual.metadata?.displacedVolumeM3, 0.045);
  const force = buoyantForce(density, volume);

  return (
    <HydraulicShell
      visual={visual}
      title="Buoyancy and displaced fluid"
      subtitle="The upward force equals the weight of the fluid displaced by the object."
      metrics={
        <>
          {metric('Buoyant force', `${fmt(force, 1)} N`, 'ρgV')}
          {metric('Displaced volume', `${fmt(volume, 3)} m³`, 'Submerged volume')}
          {metric('Fluid density', `${fmt(density, 0)} kg/m³`, 'Liquid around object')}
        </>
      }
    >
      <svg viewBox="0 0 900 500" className={responsiveSvgClass}>
        <rect x="170" y="130" width="560" height="300" rx="26" fill="none" stroke="currentColor" strokeWidth="8" opacity="0.75" />
        <rect x="180" y="210" width="540" height="210" rx="18" fill="#38bdf8" opacity="0.38" />
        <rect x="390" y="245" width="120" height="120" rx="18" fill="#94a3b8" stroke="currentColor" strokeWidth="5" />
        <line x1="450" y1="390" x2="450" y2="275" stroke="#22c55e" strokeWidth="10" markerEnd="url(#pressure-arrow)" />
        <line x1="450" y1="220" x2="450" y2="330" stroke="#ef4444" strokeWidth="8" markerEnd="url(#pressure-arrow)" />
        <text x="485" y="300" className="fill-foreground text-[16px] font-bold">Upthrust</text>
        <text x="485" y="340" className="fill-muted-foreground text-[15px]">Weight</text>
      </svg>
    </HydraulicShell>
  );
}

function HydraulicCylinderScene({ visual }: HydraulicsProps) {
  const p = n(visual.metadata?.pressurePa ?? visual.metadata?.pumpPressurePa, 7_000_000);
  const area = n(visual.metadata?.pistonAreaM2, 0.012);
  const q = n(visual.metadata?.flowRateM3s, 0.0018);
  const force = p * area;
  const speed = cylinderExtensionSpeed(q, area);
  const power = hydraulicPower(p, q);

  return (
    <HydraulicShell
      visual={visual}
      title="Hydraulic cylinder extension"
      subtitle="Cylinder force depends on pressure and piston area; extension speed depends on flow rate."
      metrics={
        <>
          {metric('Cylinder force', `${fmt(force, 0)} N`, 'F = PA')}
          {metric('Extension speed', `${fmt(speed, 3)} m/s`, 'v = Q / A')}
          {metric('Hydraulic power', `${fmt(power / 1000, 1)} kW`, 'P × Q')}
        </>
      }
    >
      <svg viewBox="0 0 980 500" className={responsiveSvgClass}>
        <rect x="180" y="205" width="430" height="110" rx="28" fill="#38bdf8" opacity="0.38" stroke="#0369a1" strokeWidth="8" />
        <rect x="510" y="195" width="60" height="130" rx="14" fill="#64748b" />
        <rect x="565" y="240" width="240" height="38" rx="18" fill="#94a3b8" />
        <line x1="220" y1="260" x2="470" y2="260" stroke="#0284c7" strokeWidth="7" markerEnd="url(#pressure-arrow)" />
        <line x1="610" y1="260" x2="790" y2="260" stroke="#22c55e" strokeWidth="9" markerEnd="url(#pressure-arrow)" />
        <text x="205" y="165" className="fill-foreground text-[17px] font-bold">Pump pressure {kpa(p)}</text>
        <text x="590" y="335" className="fill-muted-foreground text-[15px]">Rod extends as oil volume enters the chamber.</text>
      </svg>
    </HydraulicShell>
  );
}

function ManometerScene({ visual }: HydraulicsProps) {
  const density = n(visual.metadata?.manometerFluidDensityKgM3 ?? visual.metadata?.densityKgM3, 13_600);
  const heightDifference = n(visual.metadata?.heightDifferenceM, 0.18);
  const deltaP = hydrostaticPressure(density, heightDifference);

  return (
    <HydraulicShell
      visual={visual}
      title="U-tube manometer reading"
      subtitle="Pressure difference is read from the height difference between fluid columns."
      metrics={
        <>
          {metric('Pressure difference', kpa(deltaP), 'ΔP = ρgΔh')}
          {metric('Height difference', `${fmt(heightDifference, 3)} m`, 'Column separation')}
          {metric('Manometer fluid', `${fmt(density, 0)} kg/m³`, 'Usually dense fluid')}
        </>
      }
    >
      <svg viewBox="0 0 900 500" className={responsiveSvgClass}>
        <path d="M320 100 V350 Q320 420 390 420 H510 Q580 420 580 350 V170" fill="none" stroke="currentColor" strokeWidth="34" strokeLinecap="round" />
        <path d="M320 225 V350 Q320 420 390 420 H510 Q580 420 580 350 V285" fill="none" stroke="#0ea5e9" strokeWidth="24" strokeLinecap="round" />
        <line x1="630" y1="225" x2="630" y2="285" stroke="#ef4444" strokeWidth="4" />
        <text x="650" y="260" className="fill-foreground text-[17px] font-bold">Δh = {fmt(heightDifference, 3)} m</text>
        <text x="230" y="80" className="fill-muted-foreground text-[15px]">High-pressure side</text>
        <text x="545" y="145" className="fill-muted-foreground text-[15px]">Low-pressure side</text>
      </svg>
    </HydraulicShell>
  );
}

function HydraulicBrakeScene({ visual }: HydraulicsProps) {
  const pedalForce = n(visual.metadata?.pedalForceN ?? visual.metadata?.inputForceN, 180);
  const masterArea = n(visual.metadata?.masterCylinderAreaM2 ?? visual.metadata?.inputAreaM2, 0.00045);
  const caliperArea = n(visual.metadata?.caliperPistonAreaM2 ?? visual.metadata?.outputAreaM2, 0.0032);
  const linePressure = pressure(pedalForce, masterArea);
  const clampForce = hydraulicForce(pedalForce, masterArea, caliperArea);

  return (
    <HydraulicShell
      visual={visual}
      title="Hydraulic brake pressure transfer"
      subtitle="A small master-cylinder force creates high line pressure, then a larger caliper piston creates clamp force."
      metrics={
        <>
          {metric('Brake line pressure', kpa(linePressure), 'Master cylinder')}
          {metric('Caliper force', `${fmt(clampForce, 0)} N`, 'Pressure × caliper area')}
          {metric('Area ratio', `${fmt(caliperArea / masterArea, 1)}×`, 'Caliper/master')}
        </>
      }
    >
      <svg viewBox="0 0 980 500" className={responsiveSvgClass}>
        <rect x="115" y="210" width="140" height="80" rx="18" fill="#94a3b8" stroke="currentColor" strokeWidth="5" />
        <path d="M255 250 H650" stroke="#0284c7" strokeWidth="26" strokeLinecap="round" />
        <circle cx="760" cy="250" r="95" fill="none" stroke="currentColor" strokeWidth="8" />
        <rect x="650" y="185" width="70" height="130" rx="18" fill="#64748b" />
        <line x1="130" y1="120" x2="190" y2="205" stroke="#ef4444" strokeWidth="9" markerEnd="url(#pressure-arrow)" />
        <line x1="680" y1="250" x2="735" y2="250" stroke="#22c55e" strokeWidth="9" markerEnd="url(#pressure-arrow)" />
        <text x="95" y="105" className="fill-foreground text-[17px] font-bold">Pedal force</text>
        <text x="610" y="360" className="fill-muted-foreground text-[15px]">Caliper clamps the disc.</text>
      </svg>
    </HydraulicShell>
  );
}

function PumpValveCircuitScene({ visual }: HydraulicsProps) {
  const pressurePa = n(visual.metadata?.pumpPressurePa ?? visual.metadata?.pressurePa, 6_500_000);
  const q = n(visual.metadata?.flowRateM3s, 0.002);
  const power = hydraulicPower(pressurePa, q);
  const valveState = String(visual.metadata?.valveState ?? 'open');

  return (
    <HydraulicShell
      visual={visual}
      title="Pump, relief valve, directional valve, and actuator"
      subtitle="A complete hydraulic circuit view for advanced troubleshooting and system reading."
      metrics={
        <>
          {metric('Pump pressure', kpa(pressurePa), 'Supply pressure')}
          {metric('Flow rate', `${fmt(q, 4)} m³/s`, 'Pump delivery')}
          {metric('Hydraulic power', `${fmt(power / 1000, 1)} kW`, `Valve state: ${valveState}`)}
        </>
      }
    >
      <svg viewBox="0 0 980 520" className={responsiveSvgClass}>
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
      </svg>
    </HydraulicShell>
  );
}
