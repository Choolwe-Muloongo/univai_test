import type { PhysicsArrow } from '../types';

const arrowRoleClass: Record<string, string> = {
  force: 'stroke-sky-600 fill-sky-600',
  velocity: 'stroke-emerald-600 fill-emerald-600',
  acceleration: 'stroke-purple-600 fill-purple-600',
  tension: 'stroke-blue-600 fill-blue-600',
  weight: 'stroke-red-600 fill-red-600',
  normal: 'stroke-violet-600 fill-violet-600',
  friction: 'stroke-amber-600 fill-amber-600',
  momentum: 'stroke-teal-600 fill-teal-600',
  impulse: 'stroke-orange-600 fill-orange-600',
  ray: 'stroke-yellow-600 fill-yellow-600',
};

type Props = {
  arrow: PhysicsArrow;
  highlighted: boolean;
  onSelect: (id: string) => void;
};

export function PhysicsArrowRenderer({ arrow, highlighted, onSelect }: Props) {
  const roleClass = arrowRoleClass[arrow.colorRole || arrow.type] ?? 'stroke-slate-700 fill-slate-700';
  const midX = (arrow.from.x + arrow.to.x) / 2;
  const midY = (arrow.from.y + arrow.to.y) / 2;
  return (
    <g className={`cursor-pointer ${roleClass}`} onClick={() => onSelect(arrow.id)}>
      <line
        x1={arrow.from.x}
        y1={arrow.from.y}
        x2={arrow.to.x}
        y2={arrow.to.y}
        strokeWidth={highlighted ? 6 : 4}
        strokeDasharray={arrow.dashed ? '8 8' : undefined}
        strokeLinecap="round"
        markerEnd="url(#physics-arrow)"
      />
      {arrow.label ? <text x={midX + 8} y={midY - 8} className="fill-current text-[16px] font-bold">{arrow.label}</text> : null}
    </g>
  );
}
