import { MathText } from '@/components/learning/math-text';

type AnyBlock = Record<string, any>;

const width = 520;
const height = 300;
const pad = 38;

export function MathVisualBlock({ block }: { block: AnyBlock }) {
  if (block.type === 'equation') return <EquationBlock block={block} />;
  if (block.type === 'graph') return <GraphBlock block={block} />;
  if (block.type === 'table') return <TableBlock block={block} />;
  if (block.type === 'number_line') return <NumberLineBlock block={block} />;
  if (block.type === 'matrix') return <MatrixBlock block={block} />;
  if (block.type === 'formula_sheet') return <FormulaSheetBlock block={block} />;
  if (block.type === 'geometry') return <GeometryBlock block={block} />;
  return null;
}

function EquationBlock({ block }: { block: AnyBlock }) {
  return (
    <div className="space-y-4">
      {block.body ? <p className="text-base leading-7 text-muted-foreground"><MathText text={block.body} /></p> : null}
      <div className="overflow-x-auto rounded-2xl border bg-muted/40 p-5 text-center text-2xl font-semibold">
        <MathText text={block.equation || block.formula || block.body || ''} />
      </div>
      {block.explanation ? <p className="text-sm leading-6 text-muted-foreground"><MathText text={block.explanation} /></p> : null}
    </div>
  );
}

function GraphBlock({ block }: { block: AnyBlock }) {
  const graphType = block.graphType || 'function';
  if (graphType === 'bar') return <BarGraph block={block} />;
  if (graphType === 'pie') return <PieGraph block={block} />;
  return <XYGraph block={block} />;
}

function XYGraph({ block }: { block: AnyBlock }) {
  const xMin = Number(block.xMin ?? -10);
  const xMax = Number(block.xMax ?? 10);
  const yMin = Number(block.yMin ?? -10);
  const yMax = Number(block.yMax ?? 10);
  const functions = Array.isArray(block.functions) ? block.functions : [];
  const data = Array.isArray(block.data) ? block.data : [];
  const graphType = block.graphType || 'function';

  const xToPx = (x: number) => pad + ((x - xMin) / (xMax - xMin || 1)) * (width - pad * 2);
  const yToPx = (y: number) => height - pad - ((y - yMin) / (yMax - yMin || 1)) * (height - pad * 2);
  const axisX = yMin <= 0 && yMax >= 0 ? yToPx(0) : height - pad;
  const axisY = xMin <= 0 && xMax >= 0 ? xToPx(0) : pad;

  const functionPaths = functions.map((fn: AnyBlock, index: number) => {
    const points: string[] = [];
    for (let i = 0; i <= 180; i++) {
      const x = xMin + (i / 180) * (xMax - xMin);
      const y = evaluateExpression(String(fn.expression || 'x'), x);
      if (!Number.isFinite(y) || y < yMin - Math.abs(yMax - yMin) || y > yMax + Math.abs(yMax - yMin)) continue;
      points.push(`${points.length ? 'L' : 'M'}${xToPx(x).toFixed(2)},${yToPx(y).toFixed(2)}`);
    }
    return { path: points.join(' '), label: fn.label || `f${index + 1}(x)`, index };
  });

  return (
    <div className="space-y-3">
      {block.description ? <p className="text-sm text-muted-foreground"><MathText text={block.description} /></p> : null}
      <div className="overflow-x-auto rounded-2xl border bg-background p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[360px]">
          <rect x="0" y="0" width={width} height={height} rx="18" className="fill-muted/20" />
          {ticks(xMin, xMax).map((x) => <line key={`gx-${x}`} x1={xToPx(x)} x2={xToPx(x)} y1={pad} y2={height - pad} className="stroke-border" strokeWidth="1" />)}
          {ticks(yMin, yMax).map((y) => <line key={`gy-${y}`} x1={pad} x2={width - pad} y1={yToPx(y)} y2={yToPx(y)} className="stroke-border" strokeWidth="1" />)}
          <line x1={pad} x2={width - pad} y1={axisX} y2={axisX} className="stroke-foreground" strokeWidth="1.5" />
          <line x1={axisY} x2={axisY} y1={pad} y2={height - pad} className="stroke-foreground" strokeWidth="1.5" />
          {functionPaths.map((item) => <path key={item.label} d={item.path} fill="none" className="stroke-primary" strokeWidth={item.index === 0 ? 3 : 2} />)}
          {data.map((point: AnyBlock, index: number) => {
            const x = Number(point.x);
            const y = Number(point.y);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
            return <circle key={index} cx={xToPx(x)} cy={yToPx(y)} r={graphType === 'scatter' ? 4 : 3} className="fill-primary" />;
          })}
          <text x={width - pad} y={height - 8} textAnchor="end" className="fill-muted-foreground text-[12px]">{block.xLabel || 'x'}</text>
          <text x={10} y={pad} className="fill-muted-foreground text-[12px]">{block.yLabel || 'y'}</text>
        </svg>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {functions.map((fn: AnyBlock, index: number) => <span key={index} className="rounded-full border px-2 py-1"><MathText text={fn.label || fn.expression} /></span>)}
      </div>
    </div>
  );
}

function BarGraph({ block }: { block: AnyBlock }) {
  const data = Array.isArray(block.data) ? block.data : [];
  const max = Math.max(1, ...data.map((d: AnyBlock) => Number(d.y) || 0));
  return (
    <div className="space-y-3">
      {block.description ? <p className="text-sm text-muted-foreground"><MathText text={block.description} /></p> : null}
      <div className="space-y-2 rounded-2xl border bg-muted/20 p-4">
        {data.map((item: AnyBlock, index: number) => {
          const value = Number(item.y) || 0;
          return (
            <div key={index} className="grid grid-cols-[90px_1fr_50px] items-center gap-3 text-sm">
              <span className="truncate"><MathText text={item.x} /></span>
              <div className="h-4 rounded-full bg-muted"><div className="h-4 rounded-full bg-primary" style={{ width: `${Math.max(2, (value / max) * 100)}%` }} /></div>
              <span className="text-right font-medium">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PieGraph({ block }: { block: AnyBlock }) {
  const data = Array.isArray(block.data) ? block.data : [];
  const total = data.reduce((sum: number, item: AnyBlock) => sum + Math.max(0, Number(item.y) || 0), 0) || 1;
  let cumulative = 0;
  return (
    <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-center">
      <svg viewBox="0 0 220 220" className="h-56 w-56">
        <circle cx="110" cy="110" r="95" className="fill-muted/30" />
        {data.map((item: AnyBlock, index: number) => {
          const value = Math.max(0, Number(item.y) || 0);
          const start = cumulative / total;
          cumulative += value;
          const end = cumulative / total;
          return <path key={index} d={arcPath(110, 110, 95, start, end)} className={index % 2 === 0 ? 'fill-primary' : 'fill-muted-foreground'} opacity={0.85} />;
        })}
      </svg>
      <div className="space-y-2 text-sm">
        {data.map((item: AnyBlock, index: number) => <p key={index}><span className="font-medium"><MathText text={item.x} /></span>: {item.y}</p>)}
      </div>
    </div>
  );
}

function TableBlock({ block }: { block: AnyBlock }) {
  const columns = Array.isArray(block.columns) ? block.columns : [];
  const rows = Array.isArray(block.rows) ? block.rows : [];
  return (
    <div className="space-y-3">
      {block.description ? <p className="text-sm text-muted-foreground"><MathText text={block.description} /></p> : null}
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="bg-muted/60 text-left"><tr>{columns.map((column: string) => <th key={column} className="p-3"><MathText text={column} /></th>)}</tr></thead>
          <tbody>{rows.map((row: any[], index: number) => <tr key={index} className="border-t">{row.map((cell, cellIndex) => <td key={cellIndex} className="p-3"><MathText text={cell} /></td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function NumberLineBlock({ block }: { block: AnyBlock }) {
  const min = Number(block.min ?? -10);
  const max = Number(block.max ?? 10);
  const scale = (value: number) => 35 + ((value - min) / (max - min || 1)) * 450;
  const intervals = Array.isArray(block.intervals) ? block.intervals : [];
  const points = Array.isArray(block.points) ? block.points : [];
  return (
    <div className="space-y-3">
      {block.description ? <p className="text-sm text-muted-foreground"><MathText text={block.description} /></p> : null}
      <div className="overflow-x-auto rounded-2xl border bg-muted/20 p-4">
        <svg viewBox="0 0 520 120" className="h-auto w-full min-w-[360px]">
          <line x1="35" x2="485" y1="60" y2="60" className="stroke-foreground" strokeWidth="2" />
          {ticks(min, max).map((tick) => <g key={tick}><line x1={scale(tick)} x2={scale(tick)} y1="52" y2="68" className="stroke-foreground" /><text x={scale(tick)} y="90" textAnchor="middle" className="fill-muted-foreground text-[11px]">{tick}</text></g>)}
          {intervals.map((interval: AnyBlock, index: number) => <line key={index} x1={scale(Number(interval.start))} x2={scale(Number(interval.end))} y1="60" y2="60" className="stroke-primary" strokeWidth="7" strokeLinecap="round" />)}
          {points.map((point: any, index: number) => { const value = typeof point === 'number' ? point : Number(point.value); return <circle key={index} cx={scale(value)} cy="60" r="6" className="fill-primary" />; })}
        </svg>
      </div>
    </div>
  );
}

function MatrixBlock({ block }: { block: AnyBlock }) {
  const matrix = Array.isArray(block.matrix) ? block.matrix : [];
  return (
    <div className="space-y-3">
      {block.description ? <p className="text-sm text-muted-foreground"><MathText text={block.description} /></p> : null}
      <div className="inline-flex rounded-2xl border-l-4 border-r-4 border-foreground px-4 py-3 font-mono text-lg">
        <div className="grid gap-2">{matrix.map((row: any[], rowIndex: number) => <div key={rowIndex} className="flex gap-5">{row.map((cell, index) => <span key={index}><MathText text={cell} /></span>)}</div>)}</div>
      </div>
    </div>
  );
}

function FormulaSheetBlock({ block }: { block: AnyBlock }) {
  const formulas = Array.isArray(block.formulas) ? block.formulas : [];
  return <div className="space-y-3">{formulas.map((formula: AnyBlock, index: number) => <div key={index} className="rounded-2xl border p-4"><p className="font-semibold"><MathText text={formula.name} /></p><p className="mt-2 text-xl"><MathText text={formula.formula} /></p>{formula.description ? <p className="mt-2 text-sm text-muted-foreground"><MathText text={formula.description} /></p> : null}</div>)}</div>;
}

function GeometryBlock({ block }: { block: AnyBlock }) {
  const shape = block.shape || 'triangle';
  return (
    <div className="space-y-3">
      {block.description ? <p className="text-sm text-muted-foreground"><MathText text={block.description} /></p> : null}
      <div className="overflow-x-auto rounded-2xl border bg-muted/20 p-4">
        <svg viewBox="0 0 420 260" className="h-auto w-full min-w-[320px]">
          {shape === 'circle' ? <><circle cx="210" cy="125" r="80" fill="none" className="stroke-primary" strokeWidth="3" /><line x1="210" y1="125" x2="290" y2="125" className="stroke-foreground" strokeWidth="2" /><text x="245" y="116" className="fill-foreground text-[14px]">r</text></> : null}
          {shape === 'rectangle' ? <rect x="85" y="70" width="250" height="120" fill="none" className="stroke-primary" strokeWidth="3" /> : null}
          {shape === 'line' ? <line x1="70" y1="130" x2="350" y2="130" className="stroke-primary" strokeWidth="3" /> : null}
          {shape === 'angle' ? <><line x1="115" y1="180" x2="320" y2="180" className="stroke-primary" strokeWidth="3" /><line x1="115" y1="180" x2="250" y2="70" className="stroke-primary" strokeWidth="3" /><path d="M150 180 A35 35 0 0 1 142 154" fill="none" className="stroke-foreground" strokeWidth="2" /></> : null}
          {shape === 'triangle' || !['circle', 'rectangle', 'line', 'angle'].includes(shape) ? <polygon points="90,200 330,200 210,55" fill="none" className="stroke-primary" strokeWidth="3" /> : null}
          {Object.entries(block.labels || {}).map(([key, value], index) => <text key={key} x={40 + index * 100} y="238" className="fill-muted-foreground text-[13px]"><MathText text={`${key}: ${value}`} /></text>)}
        </svg>
      </div>
    </div>
  );
}

function ticks(min: number, max: number) {
  const count = 6;
  const step = (max - min) / count || 1;
  return Array.from({ length: count + 1 }, (_, i) => Number((min + i * step).toFixed(2)));
}

function evaluateExpression(expression: string, x: number) {
  const safe = expression
    .replace(/\^/g, '**')
    .replace(/\bpi\b/gi, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
    .replace(/\bsin\(/gi, 'Math.sin(')
    .replace(/\bcos\(/gi, 'Math.cos(')
    .replace(/\btan\(/gi, 'Math.tan(')
    .replace(/\blog\(/gi, 'Math.log10(')
    .replace(/\bln\(/gi, 'Math.log(')
    .replace(/\bsqrt\(/gi, 'Math.sqrt(')
    .replace(/\babs\(/gi, 'Math.abs(')
    .replace(/[^-+*/().,\d xMathPIEsincotaglqr]/gi, '');
  try {
    return Function('x', `return ${safe}`)(x) as number;
  } catch {
    return NaN;
  }
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const startAngle = start * Math.PI * 2 - Math.PI / 2;
  const endAngle = end * Math.PI * 2 - Math.PI / 2;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const large = end - start > 0.5 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}
