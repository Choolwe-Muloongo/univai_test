import type { SvgDiagramRendererProps } from './SvgDiagramRenderer';

const markerId = 'force-teaching-arrow';

export function FreeBodyTeachingRenderer({ visual }: SvgDiagramRendererProps) {
  const metadata = asRecord(visual.metadata);
  const title = text(metadata.title ?? metadata.name) || 'Free-body diagram: build the forces step by step';
  const equation = text(metadata.equation) || visual.equations?.[0]?.latex || 'F - f = ma';

  return (
    <Shell eyebrow="Free-body renderer" title={title} note="This teaches force diagrams progressively: object, weight, normal, friction, direction, then equation.">
      <svg viewBox="0 0 900 540" className="block h-auto max-h-[70vh] w-full min-w-[320px] rounded-xl bg-background" preserveAspectRatio="xMidYMid meet">
        <Defs />
        <rect width="900" height="540" className="fill-background" />
        <Grid />
        <rect x="175" y="335" width="550" height="16" rx="4" className="fill-muted stroke-muted-foreground" strokeWidth="2" />
        <rect x="390" y="250" width="130" height="85" rx="14" className="fill-slate-50 stroke-slate-900 dark:fill-slate-800 dark:stroke-slate-100" strokeWidth="4" />
        <text x="455" y="298" textAnchor="middle" className="fill-foreground text-[17px] font-bold">Object</text>
        <Arrow from={[455, 335]} to={[455, 450]} label="W = mg" role="weight" />
        <Arrow from={[455, 250]} to={[455, 145]} label="N" role="normal" />
        <Arrow from={[520, 292]} to={[660, 292]} label="F" />
        <Arrow from={[390, 292]} to={[260, 292]} label="f" role="friction" />
        <Arrow from={[525, 235]} to={[650, 235]} label="+ direction" role="velocity" dashed />
        <text x="320" y="504" className="fill-foreground text-[18px] font-bold">Equation: {equation}</text>
        <Steps items={[
          ['Draw object', 'Start with only the body.'],
          ['Add weight', 'Weight acts vertically downward.'],
          ['Add normal', 'Normal is perpendicular to contact.'],
          ['Add friction', 'Friction opposes motion.'],
          ['Choose positive', 'Pick direction before equations.'],
          ['Write equation', equation],
        ]} />
      </svg>
    </Shell>
  );
}

export function VectorResolutionRenderer({ visual }: SvgDiagramRendererProps) {
  const metadata = asRecord(visual.metadata);
  const magnitude = num(metadata.magnitude ?? metadata.vectorMagnitude ?? metadata.force, 50);
  const angle = num(metadata.angle ?? metadata.theta, 30);
  const label = text(metadata.vectorLabel) || 'F';
  const title = text(metadata.title ?? metadata.name) || 'Resolving a vector into horizontal and vertical components';
  const origin: [number, number] = [250, 390];
  const scale = 4.8;
  const end: [number, number] = [origin[0] + Math.cos(rad(angle)) * magnitude * scale, origin[1] - Math.sin(rad(angle)) * magnitude * scale];
  const foot: [number, number] = [end[0], origin[1]];

  return (
    <Shell eyebrow="Vector resolution renderer" title={title} note="This makes the adjacent side, opposite side, cos side, and sin side visible.">
      <svg viewBox="0 0 900 540" className="block h-auto max-h-[70vh] w-full min-w-[320px] rounded-xl bg-background" preserveAspectRatio="xMidYMid meet">
        <Defs />
        <rect width="900" height="540" className="fill-background" />
        <Grid />
        <line x1="130" y1={origin[1]} x2="760" y2={origin[1]} className="stroke-muted-foreground" strokeWidth="3" />
        <line x1={foot[0]} y1={origin[1]} x2={foot[0]} y2={end[1]} className="stroke-muted-foreground" strokeWidth="3" strokeDasharray="8 8" />
        <Arrow from={origin} to={end} label={`${label} = ${round(magnitude)}`} />
        <Arrow from={[origin[0], origin[1] + 28]} to={[foot[0], origin[1] + 28]} label={`${label}x = ${label} cos θ`} role="velocity" />
        <Arrow from={[foot[0] + 32, origin[1]]} to={[foot[0] + 32, end[1]]} label={`${label}y = ${label} sin θ`} role="normal" />
        <path d={`M ${origin[0] + 58} ${origin[1]} A 58 58 0 0 0 ${origin[0] + 50} ${origin[1] - 30}`} fill="none" className="stroke-orange-500" strokeWidth="4" />
        <text x={origin[0] + 72} y={origin[1] - 14} className="fill-orange-600 text-[18px] font-bold">θ = {round(angle)}°</text>
        <text x="520" y="140" className="fill-foreground text-[19px] font-bold">Horizontal: {label}x = {label} cos θ</text>
        <text x="520" y="175" className="fill-foreground text-[19px] font-bold">Vertical: {label}y = {label} sin θ</text>
        <text x="520" y="215" className="fill-muted-foreground text-[15px] font-semibold">Cos goes with adjacent. Sin goes with opposite.</text>
        <Steps items={[
          ['Draw vector', 'Place the vector at angle θ.'],
          ['Make triangle', 'Drop a vertical line.'],
          ['Adjacent side', `${label}x = ${label} cos θ`],
          ['Opposite side', `${label}y = ${label} sin θ`],
        ]} />
      </svg>
    </Shell>
  );
}

export function InclinedPlaneTeachingRenderer({ visual }: SvgDiagramRendererProps) {
  const metadata = asRecord(visual.metadata);
  const angle = num(metadata.angle ?? metadata.theta, 30);
  const mass = num(metadata.mass ?? metadata.massKg, 10);
  const title = text(metadata.title ?? metadata.name) || 'Inclined plane: resolve weight using slope axes';

  return (
    <Shell eyebrow="Inclined-plane renderer" title={title} note="Weight stays vertical. The axes rotate to match the slope.">
      <svg viewBox="0 0 900 540" className="block h-auto max-h-[70vh] w-full min-w-[320px] rounded-xl bg-background" preserveAspectRatio="xMidYMid meet">
        <Defs />
        <rect width="900" height="540" className="fill-background" />
        <Grid />
        <polygon points="210,420 700,420 700,190" className="fill-muted stroke-foreground" strokeWidth="4" />
        <g transform={`rotate(${-angle} 445 290)`}>
          <rect x="385" y="250" width="120" height="80" rx="12" className="fill-slate-50 stroke-slate-900 dark:fill-slate-800 dark:stroke-slate-100" strokeWidth="4" />
          <text x="445" y="296" textAnchor="middle" className="fill-foreground text-[16px] font-bold">{round(mass)} kg</text>
        </g>
        <path d="M 640 420 A 58 58 0 0 0 700 365" fill="none" className="stroke-orange-500" strokeWidth="4" />
        <text x="635" y="395" className="fill-orange-600 text-[17px] font-bold">θ = {round(angle)}°</text>
        <Arrow from={[445, 300]} to={[445, 455]} label="mg" role="weight" />
        <Arrow from={[505, 260]} to={[590, 175]} label="N" role="normal" />
        <Arrow from={[430, 360]} to={[305, 420]} label="mg sin θ" />
        <Arrow from={[505, 320]} to={[575, 390]} label="mg cos θ" role="friction" />
        <text x="520" y="84" className="fill-foreground text-[18px] font-bold">Parallel: mg sin θ</text>
        <text x="520" y="116" className="fill-foreground text-[18px] font-bold">Perpendicular: mg cos θ</text>
        <Steps items={[
          ['Weight down', 'Draw mg straight down.'],
          ['Rotate axes', 'Use slope axes.'],
          ['Split weight', 'Resolve mg into components.'],
          ['Along slope', 'Component is mg sin θ.'],
          ['Into slope', 'Component is mg cos θ.'],
        ]} />
      </svg>
    </Shell>
  );
}

function Shell({ eyebrow, title, note, children }: { eyebrow: string; title: string; note: string; children: React.ReactNode }) {
  return <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border bg-muted/10 p-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p><h3 className="break-words text-base font-bold text-foreground">{title}</h3><p className="break-words text-sm text-muted-foreground">{note}</p></div><div className="max-w-full overflow-x-auto rounded-2xl border bg-background p-1 sm:p-2">{children}</div></div>;
}

function Defs() { return <defs><marker id={markerId} markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 z" className="fill-current" /></marker></defs>; }

function Arrow({ from, to, label, role = 'force', dashed = false }: { from: [number, number]; to: [number, number]; label: string; role?: string; dashed?: boolean }) {
  const classes: Record<string, string> = { force: 'stroke-blue-600 fill-blue-700', velocity: 'stroke-emerald-600 fill-emerald-700', weight: 'stroke-red-600 fill-red-700', normal: 'stroke-violet-600 fill-violet-700', friction: 'stroke-orange-600 fill-orange-700' };
  const className = classes[role] ?? classes.force;
  return <g><line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} className={className} strokeWidth="4" strokeLinecap="round" strokeDasharray={dashed ? '9 7' : undefined} markerEnd={`url(#${markerId})`} /><text x={(from[0] + to[0]) / 2 + 10} y={(from[1] + to[1]) / 2 - 8} className={`${className} text-[15px] font-bold`}>{label}</text></g>;
}

function Steps({ items }: { items: Array<[string, string]> }) {
  return <g><rect x="35" y="35" width="330" height={34 + items.length * 48} rx="18" className="fill-background/95 stroke-muted-foreground" strokeWidth="2" /><text x="53" y="65" className="fill-foreground text-[15px] font-bold">Next-step teaching</text>{items.map(([title, body], i) => <g key={`${title}-${i}`}><circle cx="60" cy={97 + i * 48} r="12" className="fill-primary" /><text x="60" y={101 + i * 48} textAnchor="middle" className="fill-primary-foreground text-[10px] font-bold">{i + 1}</text><text x="82" y={93 + i * 48} className="fill-foreground text-[12px] font-bold">{title}</text><text x="82" y={110 + i * 48} className="fill-muted-foreground text-[11px] font-semibold">{body}</text></g>)}</g>;
}

function Grid() { return <g opacity="0.35">{Array.from({ length: 23 }, (_, i) => <line key={`v-${i}`} x1={i * 40} x2={i * 40} y1="0" y2="540" className="stroke-muted" />)}{Array.from({ length: 14 }, (_, i) => <line key={`h-${i}`} x1="0" x2="900" y1={i * 40} y2={i * 40} className="stroke-muted" />)}</g>; }
function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === 'object' ? value as Record<string, unknown> : {}; }
function text(value: unknown) { return typeof value === 'string' || typeof value === 'number' ? String(value) : ''; }
function num(value: unknown, fallback: number) { const number = Number(value); return Number.isFinite(number) ? number : fallback; }
function rad(degrees: number) { return degrees * Math.PI / 180; }
function round(value: number) { return Math.round(value * 100) / 100; }
