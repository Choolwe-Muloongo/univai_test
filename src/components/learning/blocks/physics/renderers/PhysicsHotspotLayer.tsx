import type { PhysicsHotspot } from '../types';

type Props = {
  hotspots: PhysicsHotspot[];
  onSelect: (id: string) => void;
};

export function PhysicsHotspotLayer({ hotspots, onSelect }: Props) {
  return (
    <>
      {hotspots.map((hotspot) => (
        <rect
          key={hotspot.id}
          x={hotspot.x}
          y={hotspot.y}
          width={hotspot.width}
          height={hotspot.height}
          rx="10"
          className="cursor-pointer fill-primary/5 stroke-primary/40 transition hover:fill-primary/15"
          strokeDasharray="8 6"
          onClick={() => onSelect(hotspot.targetId || hotspot.id)}
        />
      ))}
    </>
  );
}
