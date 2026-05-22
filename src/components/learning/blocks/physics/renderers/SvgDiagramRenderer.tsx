import type { PhysicsVisual } from '../types';
import { PhysicsArrowRenderer } from './PhysicsArrowRenderer';
import { PhysicsHotspotLayer } from './PhysicsHotspotLayer';
import { PhysicsObjectRenderer } from './PhysicsObjectRenderer';

export type SvgDiagramRendererProps = {
  visual: PhysicsVisual;
  highlightedIds: Set<string>;
  hiddenIds: Set<string>;
  selectedTargetId?: string | null;
  onSelect: (id: string) => void;
};

export function SvgDiagramRenderer({ visual, highlightedIds, hiddenIds, selectedTargetId, onSelect }: SvgDiagramRendererProps) {
  const width = visual.canvas?.width || 800;
  const height = visual.canvas?.height || 500;
  return (
    <div className="overflow-auto rounded-2xl border bg-muted/20 p-2">
      <svg role="img" aria-label="Interactive physics diagram" viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[620px] rounded-xl bg-background">
        <defs>
          <marker id="physics-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
            <path d="M2,2 L10,6 L2,10 z" className="fill-current" />
          </marker>
        </defs>
        <CanvasBackground width={width} height={height} background={visual.canvas?.background} />
        {(visual.objects ?? []).filter((object) => !hiddenIds.has(object.id)).map((object) => (
          <PhysicsObjectRenderer key={object.id} object={object} highlighted={highlightedIds.has(object.id) || selectedTargetId === object.id} onSelect={onSelect} />
        ))}
        {(visual.arrows ?? []).filter((arrow) => !hiddenIds.has(arrow.id)).map((arrow) => (
          <PhysicsArrowRenderer key={arrow.id} arrow={arrow} highlighted={highlightedIds.has(arrow.id) || selectedTargetId === arrow.id} onSelect={onSelect} />
        ))}
        {(visual.labels ?? []).map((label) => (
          <text key={label.id} x={label.x} y={label.y} className="fill-foreground text-[18px] font-semibold">{label.text}</text>
        ))}
        <PhysicsHotspotLayer hotspots={visual.hotspots ?? []} onSelect={onSelect} />
        <FocusBox visual={visual} highlightedIds={highlightedIds} />
      </svg>
    </div>
  );
}

function CanvasBackground({ width, height, background }: { width: number; height: number; background?: string }) {
  if (background !== 'grid' && background !== 'graph_paper') return <rect x="0" y="0" width={width} height={height} className="fill-background" />;
  const spacing = background === 'graph_paper' ? 25 : 40;
  return (
    <g>
      <rect x="0" y="0" width={width} height={height} className="fill-background" />
      {Array.from({ length: Math.floor(width / spacing) + 1 }, (_, index) => <line key={`v-${index}`} x1={index * spacing} x2={index * spacing} y1="0" y2={height} className="stroke-muted" strokeWidth="1" />)}
      {Array.from({ length: Math.floor(height / spacing) + 1 }, (_, index) => <line key={`h-${index}`} x1="0" x2={width} y1={index * spacing} y2={index * spacing} className="stroke-muted" strokeWidth="1" />)}
    </g>
  );
}

function FocusBox({ visual, highlightedIds }: { visual: PhysicsVisual; highlightedIds: Set<string> }) {
  const active = (visual.steps ?? []).find((step) => step.focusBox && step.highlightObjectIds.some((id) => highlightedIds.has(id)));
  const box = active?.focusBox;
  if (!box) return null;
  return <rect x={box.x} y={box.y} width={box.width} height={box.height} rx="18" className="fill-transparent stroke-primary" strokeWidth="4" strokeDasharray="10 8" />;
}
