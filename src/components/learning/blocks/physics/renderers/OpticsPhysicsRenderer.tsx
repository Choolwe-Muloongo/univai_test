import type { SvgDiagramRendererProps } from './SvgDiagramRenderer';

export function OpticsPhysicsRenderer(props: SvgDiagramRendererProps) {
  const { highlightedIds, selectedTargetId, onSelect } = props;
  return (
    <div className="space-y-3 rounded-2xl border bg-muted/10 p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Optics renderer</p>
        <p className="text-sm text-muted-foreground">Follow the principal axis, parallel ray, and refracted ray through the lens.</p>
      </div>
      <div className="overflow-auto rounded-2xl border bg-background p-2">
        <svg viewBox="0 0 900 460" className="h-auto w-full min-w-[640px]">
          <defs><marker id="optics-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 z" className="fill-current" /></marker></defs>
          <rect width="900" height="460" className="fill-background" />
          <line x1="80" y1="230" x2="820" y2="230" className="stroke-muted-foreground" strokeWidth="3" strokeDasharray="8 8" />
          <ellipse cx="455" cy="230" rx="28" ry="130" className={`fill-sky-100 stroke-sky-700 dark:fill-sky-950/40 ${highlightedIds.has('lens') || selectedTargetId === 'lens' ? 'stroke-[7]' : 'stroke-[4]'}`} onClick={() => onSelect('lens')} />
          <line x1="220" y1="230" x2="220" y2="135" className="stroke-slate-900 dark:stroke-slate-100" strokeWidth="6" />
          <polygon points="220,125 208,145 232,145" className="fill-slate-900 dark:fill-slate-100" />
          <g className="stroke-amber-600 fill-amber-600 cursor-pointer" onClick={() => onSelect('ray-1')}><line x1="220" y1="145" x2="455" y2="145" strokeWidth={highlightedIds.has('ray-1') || selectedTargetId === 'ray-1' ? 6 : 4} markerEnd="url(#optics-arrow)" /></g>
          <g className="stroke-amber-600 fill-amber-600 cursor-pointer" onClick={() => onSelect('ray-2')}><line x1="455" y1="145" x2="690" y2="230" strokeWidth={highlightedIds.has('ray-2') || selectedTargetId === 'ray-2' ? 6 : 4} markerEnd="url(#optics-arrow)" /></g>
          <g className="stroke-emerald-600 fill-emerald-600 cursor-pointer" onClick={() => onSelect('ray-centre')}><line x1="220" y1="145" x2="690" y2="300" strokeWidth={highlightedIds.has('ray-centre') || selectedTargetId === 'ray-centre' ? 6 : 3} markerEnd="url(#optics-arrow)" /></g>
          <circle cx="610" cy="230" r="6" className="fill-primary" /><text x="610" y="258" textAnchor="middle" className="fill-foreground text-[15px] font-bold">F</text>
          <text x="405" y="385" className="fill-foreground text-[17px] font-semibold">Convex lens ray diagram</text>
          <text x="100" y="217" className="fill-muted-foreground text-[13px]">principal axis</text>
        </svg>
      </div>
    </div>
  );
}
