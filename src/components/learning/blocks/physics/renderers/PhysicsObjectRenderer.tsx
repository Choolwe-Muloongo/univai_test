import type { PhysicsObject } from '../types';

type Props = {
  object: PhysicsObject;
  highlighted: boolean;
  onSelect: (id: string) => void;
};

export function PhysicsObjectRenderer({ object, highlighted, onSelect }: Props) {
  const strokeWidth = highlighted ? 5 : object.style?.strokeWidth ?? 2;
  const fill = object.style?.fill || '#f8fafc';
  const stroke = object.style?.stroke || '#0f172a';
  const className = `${object.interactive ? 'cursor-pointer' : ''} ${highlighted ? 'drop-shadow-sm' : ''}`;
  const common = { onClick: () => onSelect(object.id), className, transform: object.rotation ? `rotate(${object.rotation} ${object.x} ${object.y})` : undefined };

  if (object.type === 'wave') return <WaveObject object={object} highlighted={highlighted} onSelect={onSelect} />;
  if (object.type === 'ray') return <RayObject object={object} highlighted={highlighted} onSelect={onSelect} />;
  if (object.type === 'circuit_component') return <CircuitComponent object={object} highlighted={highlighted} onSelect={onSelect} />;
  if (object.type === 'spring') return <SpringObject object={object} highlighted={highlighted} onSelect={onSelect} />;

  if (object.type === 'circle' || object.type === 'pulley') {
    const radius = object.radius ?? Math.min(object.width ?? 80, object.height ?? 80) / 2;
    return (
      <g {...common}>
        <circle cx={object.x} cy={object.y} r={radius} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        {object.type === 'pulley' ? <circle cx={object.x} cy={object.y} r={Math.max(4, radius * 0.18)} fill="none" stroke={stroke} strokeWidth="2" /> : null}
        {object.label ? <SvgMultilineText text={object.label} x={object.x} y={object.y + radius + 24} /> : null}
      </g>
    );
  }

  if (object.type === 'rope') {
    const x2 = object.x + (object.width ?? 120);
    const y2 = object.y + (object.height ?? 0);
    return (
      <g {...common}>
        <path d={`M${object.x},${object.y} Q${(object.x + x2) / 2},${object.y - 80} ${x2},${object.y}`} fill="none" stroke={stroke} strokeWidth={object.style?.strokeWidth ?? 4} strokeLinecap="round" />
        <line x1={object.x} y1={object.y} x2={object.x} y2={y2} stroke={stroke} strokeWidth={object.style?.strokeWidth ?? 4} />
        <line x1={x2} y1={object.y} x2={x2} y2={y2} stroke={stroke} strokeWidth={object.style?.strokeWidth ?? 4} />
      </g>
    );
  }

  if (object.type === 'triangle' || object.type === 'inclined_plane') {
    const width = object.width ?? 180;
    const height = object.height ?? 100;
    const points = `${object.x},${object.y + height} ${object.x + width},${object.y + height} ${object.x + width},${object.y}`;
    return <g {...common}><polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />{object.label ? <SvgMultilineText text={object.label} x={object.x + width / 2} y={object.y + height + 24} /> : null}</g>;
  }

  if (object.type === 'lens') {
    const width = object.width ?? 46;
    const height = object.height ?? 210;
    return <g {...common}><ellipse cx={object.x + width / 2} cy={object.y + height / 2} rx={width / 2} ry={height / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />{object.label ? <SvgMultilineText text={object.label} x={object.x + width / 2} y={object.y + height + 22} /> : null}</g>;
  }

  if (object.type === 'mirror') {
    const width = object.width ?? 20;
    const height = object.height ?? 190;
    return <g {...common}><rect x={object.x} y={object.y} width={width} height={height} fill={fill} stroke={stroke} strokeWidth={strokeWidth} /><path d={`M${object.x + width},${object.y} l35,20 M${object.x + width},${object.y + 45} l35,20 M${object.x + width},${object.y + 90} l35,20 M${object.x + width},${object.y + 135} l35,20`} className="stroke-muted-foreground" strokeWidth="2" />{object.label ? <SvgMultilineText text={object.label} x={object.x + width / 2} y={object.y + height + 22} /> : null}</g>;
  }

  const width = object.width ?? 100;
  const height = object.height ?? 70;
  return (
    <g {...common}>
      <rect x={object.x} y={object.y} width={width} height={height} rx={object.type === 'surface' ? 3 : 12} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      {object.label ? <SvgMultilineText text={object.label} x={object.x + width / 2} y={object.y + height / 2 - 6} /> : null}
    </g>
  );
}

function WaveObject({ object, highlighted, onSelect }: Props) {
  const width = object.width ?? 520;
  const height = object.height ?? 160;
  const amplitude = Number(object.physics?.amplitude ?? height / 3);
  const cycles = Math.max(1, Number(object.physics?.cycles ?? 3));
  const points = Array.from({ length: 121 }, (_, index) => {
    const progress = index / 120;
    const x = object.x + progress * width;
    const y = object.y + height / 2 - Math.sin(progress * Math.PI * 2 * cycles) * amplitude;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <g onClick={() => onSelect(object.id)} className={object.interactive ? 'cursor-pointer' : undefined}>
      <line x1={object.x} x2={object.x + width} y1={object.y + height / 2} y2={object.y + height / 2} className="stroke-muted-foreground" strokeWidth="2" strokeDasharray="8 8" />
      <polyline points={points} fill="none" stroke={object.style?.stroke || '#2563eb'} strokeWidth={highlighted ? 6 : object.style?.strokeWidth ?? 4} strokeLinecap="round" strokeLinejoin="round" />
      {object.label ? <SvgMultilineText text={object.label} x={object.x + width / 2} y={object.y + height + 28} /> : null}
    </g>
  );
}

function RayObject({ object, highlighted, onSelect }: Props) {
  const width = object.width ?? 180;
  const height = object.height ?? 0;
  return <g onClick={() => onSelect(object.id)} className={object.interactive ? 'cursor-pointer' : undefined}><line x1={object.x} y1={object.y} x2={object.x + width} y2={object.y + height} stroke={object.style?.stroke || '#ca8a04'} strokeWidth={highlighted ? 5 : object.style?.strokeWidth ?? 3} strokeDasharray={object.style?.strokeDasharray} markerEnd="url(#physics-arrow)" />{object.label ? <SvgMultilineText text={object.label} x={object.x + width / 2} y={object.y + height / 2 - 10} /> : null}</g>;
}

function SpringObject({ object, highlighted, onSelect }: Props) {
  const width = object.width ?? 260;
  const height = object.height ?? 70;
  const turns = Number(object.physics?.turns ?? 8);
  const points = Array.from({ length: turns * 2 + 1 }, (_, i) => {
    const x = object.x + (i / (turns * 2)) * width;
    const y = object.y + height / 2 + (i % 2 === 0 ? -height / 3 : height / 3);
    return `${x},${y}`;
  }).join(' ');
  return <g onClick={() => onSelect(object.id)} className={object.interactive ? 'cursor-pointer' : undefined}><polyline points={points} fill="none" stroke={object.style?.stroke || '#334155'} strokeWidth={highlighted ? 5 : object.style?.strokeWidth ?? 3} strokeLinecap="round" strokeLinejoin="round" />{object.label ? <SvgMultilineText text={object.label} x={object.x + width / 2} y={object.y + height + 22} /> : null}</g>;
}

function CircuitComponent({ object, highlighted, onSelect }: Props) {
  const width = object.width ?? 100;
  const height = object.height ?? 60;
  const stroke = object.style?.stroke || '#0f172a';
  const strokeWidth = highlighted ? 5 : object.style?.strokeWidth ?? 3;
  const type = object.componentType || object.physics?.componentType || 'resistor';
  return (
    <g onClick={() => onSelect(object.id)} className={object.interactive ? 'cursor-pointer' : undefined}>
      {type === 'battery' ? <><line x1={object.x + 35} y1={object.y} x2={object.x + 35} y2={object.y + height} stroke={stroke} strokeWidth={strokeWidth} /><line x1={object.x + 60} y1={object.y + 12} x2={object.x + 60} y2={object.y + height - 12} stroke={stroke} strokeWidth={strokeWidth} /></> : null}
      {type === 'bulb' ? <><circle cx={object.x + width / 2} cy={object.y + height / 2} r={Math.min(width, height) / 2 - 5} fill="none" stroke={stroke} strokeWidth={strokeWidth} /><line x1={object.x + 28} y1={object.y + 15} x2={object.x + width - 28} y2={object.y + height - 15} stroke={stroke} strokeWidth="2" /><line x1={object.x + width - 28} y1={object.y + 15} x2={object.x + 28} y2={object.y + height - 15} stroke={stroke} strokeWidth="2" /></> : null}
      {type !== 'battery' && type !== 'bulb' ? <rect x={object.x} y={object.y + height / 3} width={width} height={height / 3} fill="none" stroke={stroke} strokeWidth={strokeWidth} /> : null}
      {object.label ? <SvgMultilineText text={object.label} x={object.x + width / 2} y={object.y + height + 20} /> : null}
    </g>
  );
}

export function SvgMultilineText({ text, x, y }: { text: string; x: number; y: number }) {
  const parts = text.split('\n');
  return (
    <text x={x} y={y} textAnchor="middle" className="fill-foreground text-[15px] font-semibold">
      {parts.map((part, index) => <tspan key={`${part}-${index}`} x={x} dy={index === 0 ? 0 : 18}>{part}</tspan>)}
    </text>
  );
}
