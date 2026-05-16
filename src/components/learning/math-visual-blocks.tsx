import { MathText } from '@/components/learning/math-text';
import { PlotlyGraph } from '@/components/learning/plotly-graph';

type AnyBlock = Record<string, any>;

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
        <MathText text={`$${block.equation || block.formula || block.body || ''}$`} />
      </div>
      {block.explanation ? <p className="text-sm leading-6 text-muted-foreground"><MathText text={block.explanation} /></p> : null}
    </div>
  );
}

function GraphBlock({ block }: { block: AnyBlock }) {
  return (
    <div className="space-y-3">
      {block.description ? <p className="text-sm text-muted-foreground"><MathText text={block.description} /></p> : null}
      <PlotlyGraph block={block} />
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
          <thead className="bg-muted/60 text-left">
            <tr>{columns.map((column: string) => <th key={column} className="p-3"><MathText text={column} /></th>)}</tr>
          </thead>
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
  const latex = `\\begin{bmatrix}${matrix.map((row: any[]) => row.join(' & ')).join(' \\\\ ')}\\end{bmatrix}`;
  return (
    <div className="space-y-3">
      {block.description ? <p className="text-sm text-muted-foreground"><MathText text={block.description} /></p> : null}
      <div className="overflow-x-auto rounded-2xl border bg-muted/40 p-5 text-center text-xl"><MathText text={`$${latex}$`} /></div>
    </div>
  );
}

function FormulaSheetBlock({ block }: { block: AnyBlock }) {
  const formulas = Array.isArray(block.formulas) ? block.formulas : [];
  return <div className="space-y-3">{formulas.map((formula: AnyBlock, index: number) => <div key={index} className="rounded-2xl border p-4"><p className="font-semibold"><MathText text={formula.name} /></p><p className="mt-2 text-xl"><MathText text={`$${formula.formula}$`} /></p>{formula.description ? <p className="mt-2 text-sm text-muted-foreground"><MathText text={formula.description} /></p> : null}</div>)}</div>;
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
          {Object.entries(block.labels || {}).map(([key, value], index) => <text key={key} x={40 + index * 100} y="238" className="fill-muted-foreground text-[13px]">{`${key}: ${value}`}</text>)}
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
