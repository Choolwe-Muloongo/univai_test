import { MathText } from '@/components/learning/math-text';
import { PlotlyGraph } from '@/components/learning/plotly-graph';
import { ProfessionalVennBlock } from '@/components/learning/professional-venn-block';
import { ChemistryVisualRenderer } from '@/components/learning/blocks/chemistry/ChemistryVisualRenderer';
import type { ChemistryVisual } from '@/components/learning/blocks/chemistry/types';
import { PhysicsVisualRenderer } from '@/components/learning/blocks/physics/PhysicsVisualRenderer';
import type { PhysicsVisual } from '@/components/learning/blocks/physics/types';

type AnyBlock = Record<string, any>;

const mathVisualTypes = new Set(['equation', 'formula', 'graph', 'table', 'number_line', 'interval_number_line', 'matrix', 'formula_sheet', 'geometry', 'venn']);
const physicsTemplates = new Set([
  'free_body', 'pulley', 'kinematics_graph', 'projectile', 'inclined_plane', 'moments', 'spring',
  'angle_vector_resolution', 'collision', 'momentum_conservation', 'elastic_collision', 'inelastic_collision',
  'perfectly_inelastic_collision', 'explosion_separation', 'impulse_collision', 'collision_graph',
  'collision_vector_diagram', 'circuit', 'ray_diagram', 'wave', 'electric_field', 'magnetic_field',
  'thermodynamic_cycle', 'heat_engine', 'fluid_flow', 'hydraulic_press', 'fluid_pressure', 'pascal_principle',
  'bernoulli_flow', 'continuity_equation', 'buoyancy', 'pipe_flow', 'manometer', 'hydraulic_cylinder',
  'hydraulic_brake', 'brake_hydraulics', 'pump_valve_circuit', 'custom',
]);

export function MathVisualBlock({ block }: { block: AnyBlock }) {
  const renderBlock = resolveRenderableMathBlock(block);

  const chemistryVisual = resolveChemistryVisual(renderBlock);
  if (chemistryVisual) return <ChemistryVisualRenderer visual={chemistryVisual} mode="student" />;

  const physicsVisual = resolvePhysicsVisual(renderBlock);
  if (physicsVisual) return <PhysicsVisualRenderer visual={physicsVisual} mode="student" />;

  if (renderBlock.type === 'equation' || renderBlock.type === 'formula') return <EquationBlock block={renderBlock} />;
  if (renderBlock.type === 'graph') return <GraphBlock block={renderBlock} />;
  if (renderBlock.type === 'table') return <TableBlock block={renderBlock} />;
  if (renderBlock.type === 'number_line') return <NumberLineBlock block={renderBlock} />;
  if (renderBlock.type === 'interval_number_line') return <IntervalNumberLineBlock block={renderBlock} />;
  if (renderBlock.type === 'matrix') return <MatrixBlock block={renderBlock} />;
  if (renderBlock.type === 'formula_sheet') return <FormulaSheetBlock block={renderBlock} />;
  if (renderBlock.type === 'geometry') return <GeometryBlock block={renderBlock} />;
  if (renderBlock.type === 'venn') return <ProfessionalVennBlock block={renderBlock} />;
  return null;
}

function EquationBlock({ block }: { block: AnyBlock }) {
  return (
    <div className="space-y-4">
      {block.body ? <p className="text-base leading-7 text-muted-foreground"><MathText text={block.body} /></p> : null}
      <div className="max-w-full rounded-2xl border bg-muted/40 p-3 text-center text-lg font-semibold sm:p-5 sm:text-2xl">
        <div className="max-w-full overflow-hidden break-words">
          <MathText text={asInlineLatex(block.equation || block.formula || block.body || '')} />
        </div>
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
      <div className="rounded-2xl border">
        <table className="w-full table-fixed text-[11px] sm:text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>{columns.map((column: string) => <th key={column} className="break-words p-2 align-top sm:p-3"><MathText text={column} /></th>)}</tr>
          </thead>
          <tbody>{rows.map((row: any[], index: number) => <tr key={index} className="border-t">{row.map((cell, cellIndex) => <td key={cellIndex} className="break-words p-2 align-top sm:p-3"><MathText text={cell} /></td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function NumberLineBlock({ block }: { block: AnyBlock }) {
  if (Array.isArray(block.rows) || block.renderMode === 'interval' || block.intervalMode === true) return <IntervalNumberLineBlock block={block} />;
  const intervals = Array.isArray(block.intervals) ? block.intervals : [];
  const hasTeachingIntervals = intervals.some((interval: AnyBlock) => interval && (interval.label || typeof interval.startClosed !== 'undefined' || typeof interval.endClosed !== 'undefined' || typeof interval.inclusiveStart !== 'undefined' || typeof interval.inclusiveEnd !== 'undefined'));
  if (hasTeachingIntervals) {
    return <IntervalNumberLineBlock block={{ ...block, rows: [{ label: block.label || '', expression: block.expression || block.title, segments: intervals }] }} />;
  }

  const min = Number(block.min ?? -10);
  const max = Number(block.max ?? 10);
  const scale = (value: number) => 35 + ((value - min) / (max - min || 1)) * 450;
  const points = Array.isArray(block.points) ? block.points : [];
  const tickValues = getTicks(block, min, max);
  return (
    <div className="space-y-3">
      {block.description ? <p className="text-sm text-muted-foreground"><MathText text={block.description} /></p> : null}
      <div className="rounded-2xl border bg-muted/20 p-2 sm:p-4">
        <svg viewBox="0 0 520 120" className="block h-auto max-h-[150px] w-full max-w-full" preserveAspectRatio="xMidYMid meet">
          <line x1="35" x2="485" y1="60" y2="60" className="stroke-foreground" strokeWidth="2" />
          {tickValues.map((tick) => <g key={tick}><line x1={scale(tick)} x2={scale(tick)} y1="52" y2="68" className="stroke-foreground" /><text x={scale(tick)} y="90" textAnchor="middle" className="fill-muted-foreground text-[11px]">{tick}</text></g>)}
          {points.map((point: any, index: number) => { const value = typeof point === 'number' ? point : Number(point.value); return <circle key={index} cx={scale(value)} cy="60" r="6" className="fill-primary" />; })}
        </svg>
      </div>
    </div>
  );
}

function IntervalNumberLineBlock({ block }: { block: AnyBlock }) {
  const rows = normalizeIntervalRows(block);
  const allSegments = rows.flatMap((row) => row.segments);
  const finiteValues = allSegments.flatMap((segment) => [segment.start, segment.end]).filter((value): value is number => Number.isFinite(value));
  const min = Number(block.min ?? (finiteValues.length ? Math.floor(Math.min(...finiteValues) - 1) : -10));
  const max = Number(block.max ?? (finiteValues.length ? Math.ceil(Math.max(...finiteValues) + 1) : 10));
  const width = 620;
  const left = 86;
  const right = 590;
  const rowGap = 68;
  const top = 58;
  const height = Math.max(150, top + rows.length * rowGap + 48);
  const scale = (value: number) => left + ((value - min) / (max - min || 1)) * (right - left);
  const tickValues = getTicks(block, min, max);

  return (
    <div className="space-y-3">
      {block.description ? <p className="text-sm text-muted-foreground"><MathText text={block.description} /></p> : null}
      <div className="overflow-x-auto rounded-2xl border bg-muted/20 p-3 sm:p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto min-w-[620px] max-w-full" preserveAspectRatio="xMidYMid meet">
          {rows.map((row, rowIndex) => {
            const y = top + rowIndex * rowGap;
            return (
              <g key={`${row.label}-${rowIndex}`}>
                <text x="8" y={y - 10} className="fill-foreground text-[13px] font-semibold">{row.label}</text>
                {row.expression ? <text x="8" y={y + 10} className="fill-primary text-[12px] font-semibold">{row.expression}</text> : null}
                <line x1={left} x2={right} y1={y} y2={y} className="stroke-foreground" strokeWidth="2" />
                {tickValues.map((tick) => <g key={`${rowIndex}-${tick}`}><line x1={scale(tick)} x2={scale(tick)} y1={y - 7} y2={y + 7} className="stroke-foreground" /><text x={scale(tick)} y={y + 27} textAnchor="middle" className="fill-muted-foreground text-[11px]">{tick}</text></g>)}
                {row.segments.map((segment, segmentIndex) => {
                  const hasLeftInfinity = segment.start == null || !Number.isFinite(segment.start);
                  const hasRightInfinity = segment.end == null || !Number.isFinite(segment.end);
                  const start = hasLeftInfinity ? min : Number(segment.start);
                  const end = hasRightInfinity ? max : Number(segment.end);
                  const x1 = scale(start);
                  const x2 = scale(end);
                  return (
                    <g key={`${rowIndex}-${segmentIndex}`}>
                      <line x1={x1} x2={x2} y1={y} y2={y} className="stroke-primary" strokeWidth="8" strokeLinecap="round" />
                      {hasLeftInfinity ? <polygon points={`${left},${y} ${left + 12},${y - 7} ${left + 12},${y + 7}`} className="fill-primary" /> : <IntervalEndpoint x={x1} y={y} closed={segment.startClosed} side="left" />}
                      {hasRightInfinity ? <polygon points={`${right},${y} ${right - 12},${y - 7} ${right - 12},${y + 7}`} className="fill-primary" /> : <IntervalEndpoint x={x2} y={y} closed={segment.endClosed} side="right" />}
                      {segment.label ? <text x={(x1 + x2) / 2} y={y - 18} textAnchor="middle" className="fill-primary text-[12px] font-semibold">{segment.label}</text> : null}
                    </g>
                  );
                })}
              </g>
            );
          })}
          <g>
            <circle cx="420" cy={height - 18} r="6" className="fill-primary stroke-primary" strokeWidth="2" />
            <text x="432" y={height - 14} className="fill-muted-foreground text-[11px]">included / closed</text>
            <circle cx="520" cy={height - 18} r="6" className="fill-background stroke-primary" strokeWidth="2" />
            <text x="532" y={height - 14} className="fill-muted-foreground text-[11px]">excluded / open</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

function IntervalEndpoint({ x, y, closed, side }: { x: number; y: number; closed: boolean; side: 'left' | 'right' }) {
  const bracket = closed ? (side === 'left' ? '[' : ']') : (side === 'left' ? '(' : ')');
  return (
    <g>
      <circle cx={x} cy={y} r="7" className={closed ? 'fill-primary stroke-primary' : 'fill-background stroke-primary'} strokeWidth="3" />
      <text x={side === 'left' ? x - 18 : x + 18} y={y + 6} textAnchor="middle" className="fill-primary text-[24px] font-bold">{bracket}</text>
    </g>
  );
}

function normalizeIntervalRows(block: AnyBlock) {
  const sourceRows = Array.isArray(block.rows)
    ? block.rows
    : [{ label: block.label || '', expression: block.expression || block.title || '', segments: Array.isArray(block.intervals) ? block.intervals : [] }];

  return sourceRows.map((row: AnyBlock, index: number) => {
    const rawSegments = Array.isArray(row.segments) ? row.segments : Array.isArray(row.intervals) ? row.intervals : [];
    return {
      label: String(row.label ?? row.name ?? `Row ${index + 1}`),
      expression: String(row.expression ?? row.interval ?? ''),
      segments: rawSegments.map((segment: AnyBlock) => ({
        start: segment.start == null ? null : Number(segment.start),
        end: segment.end == null ? null : Number(segment.end),
        startClosed: Boolean(segment.startClosed ?? segment.inclusiveStart ?? segment.closedStart),
        endClosed: Boolean(segment.endClosed ?? segment.inclusiveEnd ?? segment.closedEnd),
        label: segment.label ? String(segment.label) : '',
      })),
    };
  }).filter((row) => row.segments.length);
}

function MatrixBlock({ block }: { block: AnyBlock }) {
  const matrix = Array.isArray(block.matrix) ? block.matrix : [];
  const latex = `\begin{bmatrix}${matrix.map((row: any[]) => row.join(' & ')).join(' \\ ')}\end{bmatrix}`;
  return (
    <div className="space-y-3">
      {block.description ? <p className="text-sm text-muted-foreground"><MathText text={block.description} /></p> : null}
      <div className="max-w-full rounded-2xl border bg-muted/40 p-3 text-center text-lg sm:p-5 sm:text-xl"><div className="max-w-full overflow-hidden break-words"><MathText text={asInlineLatex(latex)} /></div></div>
    </div>
  );
}

function FormulaSheetBlock({ block }: { block: AnyBlock }) {
  const formulas = normalizeFormulaSheet(block);

  if (!formulas.length) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
        No formulas have been added to this formula sheet yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {formulas.map((formula: AnyBlock, index) => (
        <div key={index} className="min-w-0 rounded-2xl border bg-background p-3 shadow-sm sm:p-4">
          {formula.name ? <p className="break-words text-sm font-semibold"><MathText text={String(formula.name)} /></p> : null}
          <div className="mt-2 max-w-full overflow-x-auto rounded-xl bg-muted/30 p-3 text-center text-base sm:text-lg">
            <MathText text={asInlineLatex(formula.formula || formula.expression || formula.value || '')} />
          </div>
          {formula.description ? <p className="mt-2 break-words text-sm leading-6 text-muted-foreground"><MathText text={String(formula.description)} /></p> : null}
        </div>
      ))}
    </div>
  );
}

function GeometryBlock({ block }: { block: AnyBlock }) {
  const shape = block.shape || 'triangle';
  return (
    <div className="space-y-3">
      {block.description ? <p className="text-sm text-muted-foreground"><MathText text={block.description} /></p> : null}
      <div className="rounded-2xl border bg-muted/20 p-2 sm:p-4">
        <svg viewBox="0 0 420 260" className="block h-auto max-h-[300px] w-full max-w-full" preserveAspectRatio="xMidYMid meet">
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

function resolveRenderableMathBlock(block: AnyBlock) {
  const visual = block.visual;
  if (!visual || typeof visual !== 'object' || Array.isArray(visual)) return block;

  const rawType = String(visual.type ?? visual.visualType ?? block.type ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!mathVisualTypes.has(rawType)) return block;

  return {
    ...block,
    ...visual,
    type: rawType,
    title: block.title ?? visual.title,
    body: block.body ?? visual.body,
    description: block.description ?? visual.description,
  };
}

function normalizeFormulaSheet(block: AnyBlock) {
  const candidate = block.formulas ?? block.formulae ?? block.entries ?? block.items ?? block.rows ?? [];

  if (Array.isArray(candidate)) {
    return candidate
      .map((item) => {
        if (typeof item === 'string') return parseFormulaLine(item);
        if (Array.isArray(item)) {
          return {
            name: String(item[0] ?? ''),
            formula: String(item[1] ?? item[0] ?? ''),
            description: String(item[2] ?? ''),
          };
        }
        if (item && typeof item === 'object') return item as AnyBlock;
        return null;
      })
      .filter(Boolean) as AnyBlock[];
  }

  if (typeof candidate === 'string') {
    return candidate
      .split('\n')
      .map((line) => parseFormulaLine(line))
      .filter((item) => item.formula);
  }

  if (typeof block.formula === 'string' || typeof block.equation === 'string') {
    return [
      {
        name: block.name || block.title || 'Formula',
        formula: block.formula || block.equation,
        description: block.description || block.explanation || '',
      },
    ];
  }

  return [];
}

function parseFormulaLine(line: string) {
  const parts = line.split('|').map((part) => part.trim());
  if (parts.length >= 2) {
    return {
      name: parts[0],
      formula: parts[1],
      description: parts.slice(2).join(' | '),
    };
  }

  return {
    name: '',
    formula: line.trim(),
    description: '',
  };
}

function asInlineLatex(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return '';

  if (
    (text.startsWith('$') && text.endsWith('$'))
    || (text.startsWith('\\(') && text.endsWith('\\)'))
    || (text.startsWith('\\[') && text.endsWith('\\]'))
  ) {
    return text;
  }

  return `$${text}$`;
}

function resolveChemistryVisual(block: AnyBlock): ChemistryVisual | null {
  const looksLikeChemistry = block.subject === 'chemistry'
    || block.visualType === 'equation_balancer'
    || block.visualType === 'chemical_equation'
    || block.visualType === 'stoichiometry'
    || block.visualType === 'atom_structure'
    || block.visualType === 'lab_observation'
    || block.type === 'chemistry_visual'
    || block.type === 'chemical_equation'
    || block.type === 'equation_balancer';
  if (!looksLikeChemistry) return null;
  return {
    id: block.id || 'lesson-chemistry-visual',
    subject: 'chemistry',
    level: block.level,
    visualType: block.visualType || 'chemical_equation',
    template: block.template || 'custom',
    title: block.title,
    body: block.body,
    equation: block.equation,
    species: Array.isArray(block.species) ? block.species : [],
    particles: Array.isArray(block.particles) ? block.particles : [],
    steps: Array.isArray(block.steps) ? block.steps : [],
    tables: Array.isArray(block.tables) ? block.tables : [],
    interactions: Array.isArray(block.interactions) ? block.interactions : [],
    metadata: block.metadata || {},
  };
}

function resolvePhysicsVisual(block: AnyBlock): PhysicsVisual | null {
  const template = String(block.template ?? '').trim();
  const looksLikePhysics = block.subject === 'physics'
    || block.type === 'physics_visual'
    || physicsTemplates.has(template)
    || Array.isArray(block.objects);
  if (!looksLikePhysics) return null;

  const metadata = {
    ...(block.metadata && typeof block.metadata === 'object' ? block.metadata : {}),
    title: block.title,
    name: block.name,
    mode: block.mode,
    graph: block.graph,
    points: block.points,
    dataPoints: block.dataPoints,
    coordinates: block.coordinates,
    areaSegments: block.areaSegments,
    summaryText: block.summaryText,
    xLabel: block.xLabel ?? block.xAxisLabel,
    yLabel: block.yLabel ?? block.yAxisLabel,
    xMin: block.xMin,
    xMax: block.xMax,
    yMin: block.yMin,
    yMax: block.yMax,
    showArea: block.showArea,
    showGradient: block.showGradient,
    angle: block.angle ?? block.theta,
    initialVelocity: block.initialVelocity ?? block.u,
    horizontalComponent: block.horizontalComponent ?? block.ux,
    verticalComponent: block.verticalComponent ?? block.uy,
    gravity: block.gravity,
    mass: block.mass ?? block.massKg,
    vectorLabel: block.vectorLabel,
    magnitude: block.magnitude,
    equation: block.equation,
  };

  return {
    id: block.id || 'lesson-physics-visual',
    subject: 'physics',
    visualType: block.visualType || (template === 'kinematics_graph' ? 'graph' : 'diagram'),
    template: template || 'custom',
    renderMode: block.renderMode || 'svg',
    canvas: {
      width: Number(block.canvas?.width || (template === 'kinematics_graph' ? 900 : 800)),
      height: Number(block.canvas?.height || (template === 'kinematics_graph' ? 520 : 500)),
      background: block.canvas?.background || (template === 'kinematics_graph' ? 'graph_paper' : 'plain'),
      unitScale: block.canvas?.unitScale,
    },
    objects: Array.isArray(block.objects) ? block.objects : [],
    labels: Array.isArray(block.labels) ? block.labels : [],
    arrows: Array.isArray(block.arrows) ? block.arrows : [],
    hotspots: Array.isArray(block.hotspots) ? block.hotspots : [],
    steps: Array.isArray(block.steps) ? block.steps : [],
    interactions: Array.isArray(block.interactions) ? block.interactions : [],
    equations: Array.isArray(block.equations) ? block.equations : [],
    metadata,
  } as PhysicsVisual;
}

function getTicks(block: AnyBlock, min: number, max: number) {
  if (Array.isArray(block.ticks) && block.ticks.length) {
    return block.ticks.map((tick: unknown) => Number(tick)).filter((tick: number) => Number.isFinite(tick));
  }
  return ticks(min, max);
}

function ticks(min: number, max: number) {
  const count = 6;
  const step = (max - min) / count || 1;
  return Array.from({ length: count + 1 }, (_, i) => Number((min + i * step).toFixed(2)));
}
