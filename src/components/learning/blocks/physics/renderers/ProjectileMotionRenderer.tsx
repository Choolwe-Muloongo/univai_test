import type { SvgDiagramRendererProps } from './SvgDiagramRenderer';

const markerId = 'projectile-arrow';

export function ProjectileMotionRenderer({ visual }: SvgDiagramRendererProps) {
  const metadata = asRecord(visual.metadata);
  const mode = text(metadata.mode ?? metadata.projectileMode) || 'angled_launch';
  const title = text(metadata.title ?? metadata.name) || (mode === 'horizontal_projection' ? 'Horizontal projection from a height' : 'Projectile motion');
  const u = num(metadata.initialVelocity ?? metadata.u, 20);
  const angle = num(metadata.angle ?? metadata.theta, 30);
  const g = num(metadata.gravity, 9.8);
  const ux = num(metadata.horizontalComponent ?? metadata.ux, u * Math.cos(rad(angle)));
  const uy = mode === 'horizontal_projection' ? 0 : num(metadata.verticalComponent ?? metadata.uy, u * Math.sin(rad(angle)));
  const width = visual.canvas?.width || 900;
  const height = visual.canvas?.height || 520;
  const startX = 120;
  const groundY = 410;
  const tableY = mode === 'horizontal_projection' ? 235 : groundY;
  const path = mode === 'horizontal_projection'
    ? `M ${startX} ${tableY} C 270 ${tableY + 5}, 450 ${tableY + 95}, 690 ${groundY}`
    : `M ${startX} ${groundY} C 285 ${groundY - 230}, 505 ${groundY - 230}, 720 ${groundY}`;

  return (
    <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border bg-muted/10 p-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Projectile renderer</p>
        <h3 className="break-words text-base font-bold text-foreground">{title}</h3>
        <p className="break-words text-sm text-muted-foreground">Use this card for projectile motion. Use graph cards only when the lesson is specifically about graph reading.</p>
      </div>
      <div className="max-w-full overflow-x-auto rounded-2xl border bg-background p-1 sm:p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto max-h-[70vh] w-full min-w-[320px] rounded-xl bg-background" preserveAspectRatio="xMidYMid meet">
          <defs><marker id={markerId} markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 z" className="fill-current" /></marker></defs>
          <rect x="0" y="0" width={width} height={height} className="fill-background" />
          {grid(width, height)}
          {mode === 'horizontal_projection' ? <Table y={tableY} /> : null}
          <line x1="70" y1={groundY} x2="800" y2={groundY} className="stroke-foreground" strokeWidth="3" />
          <path d={path} fill="none" className="stroke-primary" strokeWidth="5" strokeLinecap="round" />
          <circle cx={startX} cy={tableY} r="8" className="fill-primary" />
          <Arrow from={[startX, tableY]} to={[startX + 130, mode === 'horizontal_projection' ? tableY : groundY - 75]} label={`u = ${round(u)} m/s`} />
          <Arrow from={[startX, tableY + 32]} to={[startX + 155, tableY + 32]} label={`ux = ${round(ux)} m/s`} role="velocity" />
          <Arrow from={[startX + 34, tableY]} to={[startX + 34, mode === 'horizontal_projection' ? tableY + 92 : groundY - 110]} label={mode === 'horizontal_projection' ? 'uy starts at 0' : `uy = ${round(uy)} m/s`} role="force" />
          <Arrow from={[760, 105]} to={[760, 210]} label={`g = ${round(g)} m/s²`} role="weight" />
          {mode !== 'horizontal_projection' ? <AngledLabels startX={startX} groundY={groundY} angle={angle} /> : <HorizontalLabels />}
          <StepBox mode={mode} />
        </svg>
      </div>
    </div>
  );
}

function Table({ y }: { y: number }) {
  return <><rect x="65" y={y} width="120" height="175" rx="8" className="fill-muted stroke-foreground" strokeWidth="3" /><rect x="55" y={y - 18} width="170" height="22" rx="8" className="fill-slate-200 stroke-slate-700 dark:fill-slate-700 dark:stroke-slate-200" strokeWidth="3" /><text x="62" y={y - 32} className="fill-muted-foreground text-[14px] font-semibold">Object leaves table horizontally</text></>;
}

function AngledLabels({ startX, groundY, angle }: { startX: number; groundY: number; angle: number }) {
  return <><path d={`M ${startX + 55} ${groundY} A 55 55 0 0 0 ${startX + 101} ${groundY - 30}`} fill="none" className="stroke-orange-500" strokeWidth="4" /><text x={startX + 72} y={groundY - 12} className="fill-orange-600 text-[16px] font-bold">θ = {round(angle)}°</text><line x1="420" y1="195" x2="420" y2={groundY} className="stroke-muted-foreground" strokeWidth="3" strokeDasharray="8 8" /><text x="438" y="210" className="fill-foreground text-[15px] font-bold">Maximum height H</text><Arrow from={[startX, groundY + 42]} to={[720, groundY + 42]} label="Range R" role="displacement" /><text x="462" y="470" textAnchor="middle" className="fill-muted-foreground text-[14px] font-semibold">Time of flight T</text></>;
}

function HorizontalLabels() {
  return <><Arrow from={[305, 283]} to={[305, 375]} label="vertical velocity grows" role="weight" /><text x="330" y="190" className="fill-foreground text-[15px] font-bold">Horizontal velocity remains constant</text><text x="500" y="330" className="fill-foreground text-[15px] font-bold">Gravity curves the path downward</text></>;
}

function StepBox({ mode }: { mode: string }) {
  const steps = mode === 'horizontal_projection'
    ? ['Horizontal velocity is constant.', 'Vertical velocity starts at zero.', 'Gravity changes vertical motion.', 'The path curves downward.']
    : ['Resolve u into ux and uy.', 'ux = u cos θ.', 'uy = u sin θ.', 'At the top, vertical velocity is zero.'];
  return <g><rect x="38" y="38" width="318" height="240" rx="18" className="fill-background/95 stroke-muted-foreground" strokeWidth="2" /><text x="56" y="70" className="fill-foreground text-[15px] font-bold">Next-step teaching</text>{steps.map((step, i) => <g key={step}><circle cx="64" cy={105 + i * 38} r="12" className="fill-primary" /><text x="64" y={109 + i * 38} textAnchor="middle" className="fill-primary-foreground text-[10px] font-bold">{i + 1}</text><text x="86" y={110 + i * 38} className="fill-muted-foreground text-[12px] font-semibold">{step}</text></g>)}</g>;
}

function Arrow({ from, to, label, role = 'force' }: { from: [number, number]; to: [number, number]; label: string; role?: string }) {
  const classes: Record<string, string> = { force: 'stroke-blue-600 fill-blue-700', velocity: 'stroke-emerald-600 fill-emerald-700', weight: 'stroke-red-600 fill-red-700', displacement: 'stroke-sky-600 fill-sky-700' };
  const className = classes[role] ?? classes.force;
  return <g><line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} className={className} strokeWidth="4" strokeLinecap="round" markerEnd={`url(#${markerId})`} /><text x={(from[0] + to[0]) / 2 + 10} y={(from[1] + to[1]) / 2 - 8} className={`${className} text-[15px] font-bold`}>{label}</text></g>;
}

function grid(width: number, height: number) {
  return <g opacity="0.35">{Array.from({ length: Math.floor(width / 40) + 1 }, (_, i) => <line key={`v-${i}`} x1={i * 40} x2={i * 40} y1="0" y2={height} className="stroke-muted" />)}{Array.from({ length: Math.floor(height / 40) + 1 }, (_, i) => <line key={`h-${i}`} x1="0" x2={width} y1={i * 40} y2={i * 40} className="stroke-muted" />)}</g>;
}

function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === 'object' ? value as Record<string, unknown> : {}; }
function text(value: unknown) { return typeof value === 'string' || typeof value === 'number' ? String(value) : ''; }
function num(value: unknown, fallback: number) { const number = Number(value); return Number.isFinite(number) ? number : fallback; }
function rad(degrees: number) { return degrees * Math.PI / 180; }
function round(value: number) { return Math.round(value * 100) / 100; }
