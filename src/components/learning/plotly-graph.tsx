"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Data } from 'plotly.js';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

type AnyBlock = Record<string, unknown>;

type PlotlyGraphProps = {
  block: AnyBlock;
};

export function PlotlyGraph({ block }: PlotlyGraphProps) {
  const [viewKey, setViewKey] = useState(0);
  const graphType = String(block.graphType || 'function');
  const hasXRange = isFiniteNumber(block.xMin) && isFiniteNumber(block.xMax);
  const hasYRange = isFiniteNumber(block.yMin) && isFiniteNumber(block.yMax);
  const xMin = hasXRange ? Number(block.xMin) : -10;
  const xMax = hasXRange ? Number(block.xMax) : 10;
  const yMin = hasYRange ? Number(block.yMin) : -10;
  const yMax = hasYRange ? Number(block.yMax) : 10;
  const data = buildPlotData(block, graphType, xMin, xMax);

  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <span>Drag to pan, use the toolbar to zoom, and reset if you zoom too far.</span>
        <button
          type="button"
          onClick={() => setViewKey((value) => value + 1)}
          className="rounded-full border bg-background px-3 py-1 font-medium text-foreground transition hover:border-primary/40"
        >
          Reset view
        </button>
      </div>
      <Plot
        key={viewKey}
        data={data}
        layout={{
          autosize: true,
          height: 360,
          margin: { l: 44, r: 20, t: 18, b: 44 },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          xaxis: {
            title: String(block.xLabel || 'x'),
            range: graphType !== 'pie' && hasXRange ? [xMin, xMax] : undefined,
            autorange: graphType !== 'pie' && !hasXRange ? true : undefined,
            zeroline: true,
            gridcolor: 'rgba(148, 163, 184, 0.25)',
          },
          yaxis: {
            title: String(block.yLabel || 'y'),
            range: graphType !== 'pie' && graphType !== 'bar' && hasYRange ? [yMin, yMax] : undefined,
            autorange: graphType !== 'pie' && graphType !== 'bar' && !hasYRange ? true : undefined,
            zeroline: true,
            gridcolor: 'rgba(148, 163, 184, 0.25)',
          },
          showlegend: true,
          legend: { orientation: 'h', y: -0.22 },
        }}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          scrollZoom: false,
          doubleClick: 'reset',
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </div>
  );
}

function isFiniteNumber(value: unknown) {
  if (value === null || typeof value === 'undefined' || value === '') return false;
  return Number.isFinite(Number(value));
}

function buildPlotData(block: AnyBlock, graphType: string, xMin: number, xMax: number): Data[] {
  if (graphType === 'pie') {
    const rows = Array.isArray(block.data) ? block.data as AnyBlock[] : [];
    return [{
      type: 'pie' as const,
      labels: rows.map((row) => String(row.x ?? row.label ?? 'Item')),
      values: rows.map((row) => Number(row.y ?? 0)),
      textinfo: 'label+percent',
      hoverinfo: 'label+value+percent',
    }];
  }

  if (graphType === 'bar') {
    const rows = Array.isArray(block.data) ? block.data as AnyBlock[] : [];
    return [{
      type: 'bar' as const,
      x: rows.map((row) => row.x as string | number),
      y: rows.map((row) => Number(row.y ?? 0)),
      name: String(block.title || 'Data'),
    }];
  }

  if (graphType === 'scatter' || graphType === 'line') {
    const rows = Array.isArray(block.data) ? block.data as AnyBlock[] : [];
    return [{
      type: 'scatter' as const,
      mode: graphType === 'line' ? 'lines+markers' as const : 'markers' as const,
      x: rows.map((row) => row.x as string | number),
      y: rows.map((row) => Number(row.y ?? 0)),
      text: rows.map((row) => String(row.label ?? '')),
      name: String(block.title || 'Data'),
    }];
  }

  const functions = Array.isArray(block.functions) ? block.functions as AnyBlock[] : [];
  return functions.map((fn, index): Data => {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i <= 240; i += 1) {
      const x = xMin + (i / 240) * (xMax - xMin);
      const y = evaluateExpression(String(fn.expression || 'x'), x);
      if (!Number.isFinite(y)) continue;
      xs.push(x);
      ys.push(y);
    }
    return {
      type: 'scatter' as const,
      mode: 'lines' as const,
      x: xs,
      y: ys,
      name: String(fn.label || fn.expression || `f${index + 1}(x)`),
    };
  });
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
