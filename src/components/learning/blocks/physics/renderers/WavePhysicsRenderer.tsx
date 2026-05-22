import type { SvgDiagramRendererProps } from './SvgDiagramRenderer';

export function WavePhysicsRenderer(props: SvgDiagramRendererProps) {
  const { visual, highlightedIds, selectedTargetId, onSelect } = props;
  const wave = (visual.objects ?? []).find((object) => object.type === 'wave');
  const amplitude = Number(wave?.physics?.amplitude ?? 55);
  const cycles = Number(wave?.physics?.cycles ?? 3);
  const width = 620;
  const height = 180;
  const startX = 120;
  const startY = 100;
  const midY = startY + height / 2;
  const points = Array.from({ length: 140 }, (_, index) => {
    const progress = index / 139;
    const x = startX + progress * width;
    const y = midY - Math.sin(progress * Math.PI * 2 * cycles) * amplitude;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="space-y-3 rounded-2xl border bg-muted/10 p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Wave renderer</p>
        <p className="text-sm text-muted-foreground">Identify rest position, crest, trough, amplitude, and wavelength.</p>
      </div>
      <div className="overflow-auto rounded-2xl border bg-background p-2">
        <svg viewBox="0 0 900 420" className="h-auto w-full min-w-[640px]">
          <defs><marker id="wave-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 z" className="fill-current" /></marker></defs>
          <rect width="900" height="420" className="fill-background" />
          {Array.from({ length: 18 }, (_, i) => <line key={`wvx-${i}`} x1={70 + i * 45} x2={70 + i * 45} y1="65" y2="360" className="stroke-muted" />)}
          {Array.from({ length: 8 }, (_, i) => <line key={`wvy-${i}`} x1="70" x2="810" y1={80 + i * 40} y2={80 + i * 40} className="stroke-muted" />)}
          <line x1={startX} x2={startX + width} y1={midY} y2={midY} className="stroke-muted-foreground" strokeWidth="3" strokeDasharray="8 8" />
          <polyline points={points} fill="none" className={`stroke-blue-600 cursor-pointer ${highlightedIds.has('main-wave') || selectedTargetId === 'main-wave' ? 'stroke-[7]' : 'stroke-[5]'}`} strokeLinecap="round" strokeLinejoin="round" onClick={() => onSelect('main-wave')} />
          <g className="stroke-emerald-600 fill-emerald-600 cursor-pointer" onClick={() => onSelect('amplitude-arrow')}>
            <line x1="225" y1={midY} x2="225" y2={midY - amplitude} strokeWidth={highlightedIds.has('amplitude-arrow') || selectedTargetId === 'amplitude-arrow' ? 6 : 4} markerEnd="url(#wave-arrow)" />
            <text x="238" y={midY - amplitude / 2} className="fill-emerald-700 text-[14px] font-bold">Amplitude</text>
          </g>
          <g className="stroke-teal-600 fill-teal-600 cursor-pointer" onClick={() => onSelect('wavelength-arrow')}>
            <line x1="120" y1="330" x2="326" y2="330" strokeWidth={highlightedIds.has('wavelength-arrow') || selectedTargetId === 'wavelength-arrow' ? 6 : 4} markerEnd="url(#wave-arrow)" />
            <text x="175" y="355" className="fill-teal-700 text-[14px] font-bold">Wavelength λ</text>
          </g>
          <text x="220" y="55" className="fill-foreground text-[18px] font-semibold">Transverse wave diagram</text>
          <text x="640" y={midY - amplitude - 10} className="fill-muted-foreground text-[13px]">crest</text>
          <text x="535" y={midY + amplitude + 28} className="fill-muted-foreground text-[13px]">trough</text>
          <text x="620" y={midY - 10} className="fill-muted-foreground text-[13px]">rest position</text>
        </svg>
      </div>
    </div>
  );
}
