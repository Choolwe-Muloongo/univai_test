'use client';

import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

type AnyBlock = Record<string, any>;

type PlotlyGraphProps = {
  block: AnyBlock;
};

export function PlotlyGraph({ block }: PlotlyGraphProps) {
  const graphType = block.graphType || 'function';
  const xMin = Number(block.xMin ?? -10);
  const xMax = Number(block.xMax ?? 10);
  const yMin = Number(block.yMin ?? -10);
  const yMax = Number(block.yMax ?? 10);
  const data = buildPlotData(block, graphType, xMin, xMax);

  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <Plot
        data={data}
        layout={{
          autosize: true,
          height: 360,
          margin: { l: 44, r: 20, t: 18, b: 44 },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          xaxis: {
            title: block.xLabel || 'x',
            range: graphType === 'pie' ? undefined : [xMin, xMax],
            zeroline: true,
            gridcolor: 'rgba(148, 163, 184, 0.25)',
          },
          yaxis: {
            title: block.yLabel || 'y',
            range: graphType === 'pie' || graphType === 'bar' ? undefined : [yMin, yMax],
            zeroline: true,
            gridcolor: 'rgba(148, 163, 184, 0.25)',
          },
          showlegend: true,
          legend: { orientation: 'h', y: -0.22 },
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </div>
  );
}

function buildPlotData(block: AnyBlock, graphType: string, xMin: number, xMax: number) {
  if (graphType === 'pie') {
    const rows = Array.isArray(block.data) ? block.data : [];
    return [{
      type: 'pie',
      labels: rows.map((row: AnyBlock) => String(row.x ?? row.label ?? 'Item')),
      values: rows.map((row: AnyBlock) => Number(row.y ?? 0)),
      textinfo: 'label+percent',
      hoverinfo: 'label+value+percent',
    }];
  }

  if (graphType === 'bar') {
    const rows = Array.isArray(block.data) ? block.data : [];
    return [{
      type: 'bar',
      x: rows.map((row: AnyBlock) => row.x),
      y: rows.map((row: AnyBlock) => Number(row.y ?? 0)),
      name: block.title || 'Data',
    }];
  }

  if (graphType === 'scatter' || graphType === 'line') {
    const rows = Array.isArray(block.data) ? block.data : [];
    return [{
      type: 'scatter',
      mode: graphType === 'line' ? 'lines+markers' : 'markers',
      x: rows.map((row: AnyBlock) => row.x),
      y: rows.map((row: AnyBlock) => Number(row.y ?? 0)),
      text: rows.map((row: AnyBlock) => row.label ?? ''),
      name: block.title || 'Data',
    }];
  }

  const functions = Array.isArray(block.functions) ? block.functions : [];
  return functions.map((fn: AnyBlock, index: number) => {
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
      type: 'scatter',
      mode: 'lines',
      x: xs,
      y: ys,
      name: fn.label || fn.expression || `f${index + 1}(x)`,
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
