import type { SvgDiagramRendererProps } from './SvgDiagramRenderer';

type Point = [number, number];

type AreaSegment = {
  id: string;
  label: string;
  shapeType: 'rectangle' | 'triangle' | 'trapezium' | 'above_time_axis' | 'below_time_axis';
  startTime: number;
  endTime: number;
  startValue: number;
  endValue: number;
  formulaText?: string;
  calculationText?: string;
  resultText?: string;
};

type GraphConfig = {
  points: Point[];
  areaSegments: AreaSegment[];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xLabel: string;
  yLabel: string;
  title: string;
  note: string;
  summaryText: string;
  showArea: boolean;
  showGradient: boolean;
};

export function GraphPhysicsRenderer(props: SvgDiagramRendererProps) {
  const { visual, onSelect } = props;
  const width = visual.canvas?.width || 900;
  const height = visual.canvas?.height || 520;
  const graph = resolveGraphConfig(visual);
  const plotLeft = 110;
  const plotTop = 62;
  const plotWidth = 650;
  const plotHeight = 330;
  const xRange = graph.xMax - graph.xMin || 1;
  const yRange = graph.yMax - graph.yMin || 1;
  const mapX = (x: number) => plotLeft + ((x - graph.xMin) / xRange) * plotWidth;
  const mapY = (y: number) => plotTop + plotHeight - ((y - graph.yMin) / yRange) * plotHeight;
  const plot = graph.points.map(([x, y]) => `${mapX(x)},${mapY(y)}`).join(' ');
  const firstPoint = graph.points[0] ?? [graph.xMin, graph.yMin];
  const lastPoint = graph.points[graph.points.length - 1] ?? [graph.xMax, graph.yMin];
  const zeroY = mapY(clamp(0, graph.yMin, graph.yMax));
  const areaPoints = `${mapX(firstPoint[0])},${zeroY} ${plot} ${mapX(lastPoint[0])},${zeroY}`;
  const xTicks = ticks(graph.xMin, graph.xMax, 5);
  const yTicks = ticks(graph.yMin, graph.yMax, 5);
  const isDemand = /demand|economic|quantity|price/i.test(`${graph.title} ${graph.xLabel} ${graph.yLabel} ${visual.template}`);

  return (
    <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border bg-muted/10 p-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Graph renderer</p>
        <p className="break-words text-sm text-muted-foreground">{graph.note}</p>
      </div>
      <div className="max-w-full overflow-x-auto rounded-2xl border bg-background p-1 sm:p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto max-h-[70vh] w-full min-w-[320px] max-w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="graph-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 z" className="fill-current" /></marker>
          </defs>
          <rect x="0" y="0" width={width} height={height} className="fill-background" />
          <text x={plotLeft} y="36" className="fill-foreground text-[16px] font-semibold">{graph.title}</text>
          {Array.from({ length: 14 }, (_, i) => <line key={`gx-${i}`} x1={plotLeft + i * (plotWidth / 13)} x2={plotLeft + i * (plotWidth / 13)} y1={plotTop} y2={plotTop + plotHeight} className="stroke-muted" />)}
          {Array.from({ length: 8 }, (_, i) => <line key={`gy-${i}`} x1={plotLeft} x2={plotLeft + plotWidth} y1={plotTop + i * (plotHeight / 7)} y2={plotTop + i * (plotHeight / 7)} className="stroke-muted" />)}
          <line x1={plotLeft} y1={zeroY} x2={plotLeft + plotWidth} y2={zeroY} className="stroke-muted-foreground" strokeWidth="2" strokeDasharray="8 8" />
          <g className="stroke-slate-800 fill-slate-800 dark:stroke-slate-100 dark:fill-slate-100">
            <line x1={plotLeft} y1={plotTop + plotHeight} x2={plotLeft + plotWidth + 30} y2={plotTop + plotHeight} strokeWidth="3" markerEnd="url(#graph-arrow)" />
            <line x1={plotLeft} y1={plotTop + plotHeight} x2={plotLeft} y2={plotTop - 24} strokeWidth="3" markerEnd="url(#graph-arrow)" />
          </g>
          {xTicks.map((tick) => <g key={`x-${tick}`}><line x1={mapX(tick)} x2={mapX(tick)} y1={plotTop + plotHeight} y2={plotTop + plotHeight + 8} className="stroke-foreground" /><text x={mapX(tick)} y={plotTop + plotHeight + 28} textAnchor="middle" className="fill-muted-foreground text-[11px]">{formatTick(tick)}</text></g>)}
          {yTicks.map((tick) => <g key={`y-${tick}`}><line x1={plotLeft - 8} x2={plotLeft} y1={mapY(tick)} y2={mapY(tick)} className="stroke-foreground" /><text x={plotLeft - 14} y={mapY(tick) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">{formatTick(tick)}</text></g>)}
          {graph.areaSegments.length ? graph.areaSegments.map((segment, index) => <AreaShape key={segment.id} segment={segment} index={index} mapX={mapX} mapY={mapY} zeroY={zeroY} onSelect={onSelect} />) : graph.showArea ? <polygon points={areaPoints} className="fill-primary/10 stroke-primary/20 cursor-pointer" onClick={() => onSelect('graph-area')} /> : null}
          <polyline points={plot} fill="none" className="stroke-primary" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {graph.points.map(([x, y], index) => <circle key={`${x}-${y}-${index}`} cx={mapX(x)} cy={mapY(y)} r="6" className="fill-primary" />)}
          {graph.showGradient && graph.points.length >= 2 ? <GradientTriangle points={graph.points} mapX={mapX} mapY={mapY} onSelect={onSelect} isDemand={isDemand} /> : null}
          <text x={plotLeft + plotWidth / 2} y={height - 40} textAnchor="middle" className="fill-foreground text-[15px] font-semibold">{graph.xLabel}</text>
          <text x="42" y={plotTop + plotHeight / 2} textAnchor="middle" className="fill-foreground text-[15px] font-semibold" transform={`rotate(-90 42 ${plotTop + plotHeight / 2})`}>{graph.yLabel}</text>
          <text x={plotLeft + 8} y={height - 16} className="fill-muted-foreground text-[12px]">{graph.summaryText || (isDemand ? 'Downward line: as price rises, quantity demanded falls.' : 'Follow the plotted line and compare axis values.')}</text>
        </svg>
      </div>
    </div>
  );
}

function AreaShape({ segment, index, mapX, mapY, zeroY, onSelect }: { segment: AreaSegment; index: number; mapX: (x: number) => number; mapY: (y: number) => number; zeroY: number; onSelect: (id: string) => void }) {
  const x1 = mapX(segment.startTime);
  const x2 = mapX(segment.endTime);
  const y1 = mapY(segment.startValue);
  const y2 = mapY(segment.endValue);
  const polygonPoints = areaPolygonPoints(segment, x1, x2, y1, y2, zeroY);
  const labelPoint = areaLabelPoint(segment, x1, x2, y1, y2, zeroY, index);
  const shapeName = segment.shapeType.replace(/_/g, ' ');
  const label = [segment.label, shapeName, segment.calculationText, segment.resultText].filter(Boolean).join(' = ');
  return (
    <g className="cursor-pointer" onClick={() => onSelect(segment.id)}>
      <polygon points={polygonPoints} className="fill-primary/15 stroke-primary/40" strokeWidth="2" />
      <line x1={x1} x2={x1} y1={zeroY} y2={y1} className="stroke-primary/30" strokeWidth="2" strokeDasharray="6 6" />
      <line x1={x2} x2={x2} y1={zeroY} y2={y2} className="stroke-primary/30" strokeWidth="2" strokeDasharray="6 6" />
      <text x={labelPoint.x} y={labelPoint.y} textAnchor="middle" className="fill-foreground text-[12px] font-bold">{label}</text>
      {segment.formulaText ? <text x={labelPoint.x} y={labelPoint.y + 16} textAnchor="middle" className="fill-muted-foreground text-[11px] font-semibold">{segment.formulaText}</text> : null}
    </g>
  );
}

function areaPolygonPoints(segment: AreaSegment, x1: number, x2: number, y1: number, y2: number, zeroY: number) {
  const startIsOnAxis = nearlyEqual(y1, zeroY);
  const endIsOnAxis = nearlyEqual(y2, zeroY);

  if (segment.shapeType === 'rectangle') {
    const topY = Math.abs(y1 - zeroY) >= Math.abs(y2 - zeroY) ? y1 : y2;
    return `${x1},${zeroY} ${x1},${topY} ${x2},${topY} ${x2},${zeroY}`;
  }

  if (segment.shapeType === 'triangle') {
    const apexX = Math.abs(y1 - zeroY) >= Math.abs(y2 - zeroY) ? x1 : x2;
    const apexY = Math.abs(y1 - zeroY) >= Math.abs(y2 - zeroY) ? y1 : y2;
    return `${x1},${zeroY} ${apexX},${apexY} ${x2},${zeroY}`;
  }

  if (segment.shapeType === 'above_time_axis' || segment.shapeType === 'below_time_axis') {
    return `${x1},${zeroY} ${x1},${y1} ${x2},${y2} ${x2},${zeroY}`;
  }

  if (startIsOnAxis || endIsOnAxis) {
    const apexX = startIsOnAxis ? x2 : x1;
    const apexY = startIsOnAxis ? y2 : y1;
    return `${x1},${zeroY} ${apexX},${apexY} ${x2},${zeroY}`;
  }

  return `${x1},${zeroY} ${x1},${y1} ${x2},${y2} ${x2},${zeroY}`;
}

function areaLabelPoint(segment: AreaSegment, x1: number, x2: number, y1: number, y2: number, zeroY: number, index: number) {
  const centerX = (x1 + x2) / 2;
  const topOrBottomY = Math.abs(y1 - zeroY) >= Math.abs(y2 - zeroY) ? y1 : y2;
  const insideY = (zeroY + topOrBottomY) / 2;
  const nudge = index * 8;
  if (segment.shapeType === 'triangle') return { x: centerX, y: insideY + nudge };
  if (segment.shapeType === 'below_time_axis') return { x: centerX, y: Math.max(y1, y2, zeroY) - 18 + nudge };
  return { x: centerX, y: Math.min(Math.min(y1, y2), zeroY) + 28 + nudge };
}

function GradientTriangle({ points, mapX, mapY, onSelect, isDemand }: { points: Point[]; mapX: (x: number) => number; mapY: (y: number) => number; onSelect: (id: string) => void; isDemand: boolean }) {
  const start = points[0];
  const end = points[points.length - 1];
  if (!start || !end || start[0] === end[0] || start[1] === end[1]) return null;
  const midX = start[0] + (end[0] - start[0]) * 0.38;
  const midY = start[1] + (end[1] - start[1]) * 0.38;
  const nextX = start[0] + (end[0] - start[0]) * 0.62;
  const nextY = start[1] + (end[1] - start[1]) * 0.62;
  return <g className="cursor-pointer" onClick={() => onSelect('gradient-triangle')}><path d={`M${mapX(midX)},${mapY(midY)} L${mapX(nextX)},${mapY(midY)} L${mapX(nextX)},${mapY(nextY)}`} fill="none" className="stroke-amber-600" strokeWidth="4" strokeDasharray="8 6" /><text x={mapX(nextX) + 12} y={mapY((midY + nextY) / 2)} className="fill-amber-700 text-[13px] font-bold">{isDemand ? 'negative slope' : 'gradient'}</text></g>;
}

function resolveGraphConfig(visual: SvgDiagramRendererProps['visual']): GraphConfig {
  const metadata = (visual.metadata ?? {}) as Record<string, unknown>;
  const graph = (metadata.graph && typeof metadata.graph === 'object' ? metadata.graph : {}) as Record<string, unknown>;
  const rawPoints = firstArray(graph.points, graph.dataPoints, graph.coordinates, metadata.points, metadata.dataPoints, metadata.coordinates, (visual as unknown as Record<string, unknown>).points);
  let points = normalizePoints(rawPoints);
  const xValues = firstArray(graph.xValues, metadata.xValues, graph.x, metadata.x);
  const yValues = firstArray(graph.yValues, metadata.yValues, graph.y, metadata.y);
  if (!points.length && xValues && yValues) points = zipPoints(xValues, yValues);
  if (!points.length) {
    const objects = Array.isArray(visual.objects) ? visual.objects : [];
    points = objects.map((object) => object as Record<string, unknown>).filter((object) => object.type === 'point' || object.kind === 'point').map((object) => [Number(object.x), Number(object.y)] as Point).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  }
  const title = stringValue(graph.title ?? metadata.title ?? visual.metadata?.name) || 'Line graph';
  const xLabel = stringValue(graph.xLabel ?? graph.xAxisLabel ?? metadata.xLabel ?? metadata.xAxisLabel) || (/time|velocity|acceleration|kinematic/i.test(`${title} ${visual.template}`) ? 'time / s' : 'x');
  const yLabel = stringValue(graph.yLabel ?? graph.yAxisLabel ?? metadata.yLabel ?? metadata.yAxisLabel) || (/velocity/i.test(title) ? 'velocity / m/s' : /acceleration/i.test(title) ? 'acceleration / m/s²' : 'y');
  const isDemand = /demand|economic|quantity|price/i.test(`${title} ${xLabel} ${yLabel} ${visual.template}`);
  if (!points.length) points = isDemand ? [[1, 9], [9, 2]] : [[0, 6], [4, 6], [7, 0]];
  const areaSegments = normalizeAreaSegments(firstArray(graph.areaSegments, metadata.areaSegments));
  const xs = points.map(([x]) => x).concat(areaSegments.flatMap((s) => [s.startTime, s.endTime]));
  const ys = points.map(([, y]) => y).concat(areaSegments.flatMap((s) => [s.startValue, s.endValue, 0]));
  const computedXMin = Math.min(...xs);
  const computedXMax = Math.max(...xs);
  const computedYMin = Math.min(...ys);
  const computedYMax = Math.max(...ys);
  const xMin = numericValue(graph.xMin ?? metadata.xMin, Math.min(0, computedXMin));
  const xMax = numericValue(graph.xMax ?? metadata.xMax, padMax(computedXMax, xMin));
  const yMin = numericValue(graph.yMin ?? metadata.yMin, Math.min(0, computedYMin));
  const yMax = numericValue(graph.yMax ?? metadata.yMax, padMax(computedYMax, yMin));
  return { points, areaSegments, xMin, xMax, yMin, yMax, xLabel, yLabel, title, note: stringValue(graph.note ?? graph.description ?? metadata.note ?? metadata.description) || 'Read gradient for rate of change and shaded area for accumulated quantity.', summaryText: stringValue(graph.summaryText ?? metadata.summaryText ?? graph.summary ?? metadata.summary), showArea: Boolean(graph.showArea ?? metadata.showArea ?? areaSegments.length > 0), showGradient: Boolean(graph.showGradient ?? metadata.showGradient ?? true) };
}

function normalizeAreaSegments(value: unknown): AreaSegment[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    const shape = stringValue(record.shapeType) as AreaSegment['shapeType'];
    return { id: stringValue(record.id) || `area-${index + 1}`, label: stringValue(record.label) || String.fromCharCode(65 + index), shapeType: ['rectangle', 'triangle', 'trapezium', 'above_time_axis', 'below_time_axis'].includes(shape) ? shape : 'trapezium', startTime: numericValue(record.startTime ?? record.x1, 0), endTime: numericValue(record.endTime ?? record.x2, 1), startValue: numericValue(record.startValue ?? record.y1, 0), endValue: numericValue(record.endValue ?? record.y2, 0), formulaText: stringValue(record.formulaText ?? record.formula), calculationText: stringValue(record.calculationText ?? record.calculation), resultText: stringValue(record.resultText ?? record.result) };
  }).filter((segment) => Number.isFinite(segment.startTime) && Number.isFinite(segment.endTime));
}

function normalizePoints(value: unknown): Point[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (Array.isArray(item)) return [Number(item[0]), Number(item[1])] as Point;
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      return [Number(record.x ?? record.q ?? record.quantity ?? record.time ?? record.t), Number(record.y ?? record.p ?? record.price ?? record.value ?? record.v)] as Point;
    }
    return [NaN, NaN] as Point;
  }).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
}

function zipPoints(xValues: unknown[], yValues: unknown[]): Point[] { const count = Math.min(xValues.length, yValues.length); return Array.from({ length: count }, (_, index) => [Number(xValues[index]), Number(yValues[index])] as Point).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y)); }
function firstArray(...values: unknown[]) { return values.find((value): value is unknown[] => Array.isArray(value) && value.length > 0); }
function numericValue(value: unknown, fallback: number) { const number = Number(value); return Number.isFinite(number) ? number : fallback; }
function stringValue(value: unknown) { return typeof value === 'string' || typeof value === 'number' ? String(value) : ''; }
function padMax(max: number, min: number) { if (!Number.isFinite(max)) return min + 10; if (max === min) return max + 10; return max + Math.abs(max - min) * 0.15; }
function ticks(min: number, max: number, count: number) { const step = (max - min) / count || 1; return Array.from({ length: count + 1 }, (_, index) => min + step * index); }
function formatTick(value: number) { if (Math.abs(value) >= 100) return String(Math.round(value)); if (Number.isInteger(value)) return String(value); return value.toFixed(1); }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function nearlyEqual(a: number, b: number) { return Math.abs(a - b) < 0.001; }
