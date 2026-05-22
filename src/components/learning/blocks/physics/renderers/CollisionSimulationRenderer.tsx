'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Turtle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PhysicsObject, PhysicsVisual } from '../types';
import { kineticEnergy, momentum } from './physicsRuntime';

type Props = {
  visual: PhysicsVisual;
};

type CollisionObjectState = {
  id: string;
  label: string;
  mass: number;
  initialVelocity: number;
  finalVelocity: number;
  fill: string;
  stroke: string;
};

export function CollisionSimulationRenderer({ visual }: Props) {
  const objects = useMemo(() => collisionObjectsFromVisual(visual), [visual]);
  const [phase, setPhase] = useState<'before' | 'during' | 'after'>('before');
  const [playing, setPlaying] = useState(false);
  const [slowMotion, setSlowMotion] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, []);

  const totalInitialMomentum = objects.reduce((sum, object) => sum + momentum(object.mass, object.initialVelocity), 0);
  const totalFinalMomentum = objects.reduce((sum, object) => sum + momentum(object.mass, object.finalVelocity), 0);
  const totalInitialKe = objects.reduce((sum, object) => sum + kineticEnergy(object.mass, object.initialVelocity), 0);
  const totalFinalKe = objects.reduce((sum, object) => sum + kineticEnergy(object.mass, object.finalVelocity), 0);
  const collisionType = String(visual.metadata?.collisionType ?? 'inelastic').replace(/_/g, ' ');

  function clearPendingTimeout() {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  function play() {
    clearPendingTimeout();
    setPlaying(true);
    setPhase('during');
    timeoutRef.current = window.setTimeout(() => {
      setPhase('after');
      setPlaying(false);
      timeoutRef.current = null;
    }, slowMotion ? 1800 : 850);
  }

  function pause() {
    clearPendingTimeout();
    setPlaying(false);
  }

  function reset() {
    clearPendingTimeout();
    setPlaying(false);
    setPhase('before');
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-muted/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Collision simulation</p>
          <h4 className="font-semibold">Before · During · After</h4>
          <p className="mt-1 text-xs text-muted-foreground">Type: {collisionType}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={play} disabled={playing}><Play className="mr-2 size-4" />Play</Button>
          <Button type="button" size="sm" variant="outline" onClick={pause}><Pause className="mr-2 size-4" />Pause</Button>
          <Button type="button" size="sm" variant="outline" onClick={reset}><RotateCcw className="mr-2 size-4" />Reset</Button>
          <Button type="button" size="sm" variant={slowMotion ? 'default' : 'outline'} onClick={() => setSlowMotion((value) => !value)}><Turtle className="mr-2 size-4" />Slow</Button>
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border bg-background p-2">
        <svg viewBox="0 0 900 360" className="h-auto w-full min-w-[640px]">
          <defs>
            <marker id="collision-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 z" className="fill-current" /></marker>
          </defs>
          <line x1="80" y1="250" x2="820" y2="250" className="stroke-muted-foreground" strokeWidth="4" />
          <text x="80" y="55" className="fill-foreground text-[17px] font-semibold">{phase === 'before' ? 'Before collision' : phase === 'during' ? 'During collision' : 'After collision'}</text>
          {objects.map((object, index) => {
            const beforeX = index === 0 ? 160 : 580;
            const afterX = index === 0 ? 330 : 480;
            const duringX = index === 0 ? 380 : 430;
            const x = phase === 'before' ? beforeX : phase === 'during' ? duringX : afterX;
            const velocity = phase === 'after' ? object.finalVelocity : object.initialVelocity;
            return <CollisionCart key={object.id} object={object} x={x} y={185} velocity={velocity} />;
          })}
          {phase === 'during' ? <circle cx="450" cy="220" r="28" className="fill-orange-500/20 stroke-orange-600" strokeWidth="4" /> : null}
        </svg>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <MomentumTable title="Momentum" before={totalInitialMomentum} after={totalFinalMomentum} unit="kg m/s" />
        <MomentumTable title="Kinetic energy" before={totalInitialKe} after={totalFinalKe} unit="J" />
      </div>
      <p className="rounded-2xl border bg-background p-3 text-sm text-muted-foreground">
        Momentum should stay nearly the same for a closed system. Kinetic energy only stays the same in an elastic collision.
      </p>
    </div>
  );
}

function CollisionCart({ object, x, y, velocity }: { object: CollisionObjectState; x: number; y: number; velocity: number }) {
  const arrowLength = Math.max(0, Math.min(130, Math.abs(velocity) * 18));
  const direction = velocity >= 0 ? 1 : -1;
  const arrowStart = direction > 0 ? x + 125 : x - 10;
  const arrowEnd = arrowStart + direction * arrowLength;
  return (
    <g>
      <rect x={x} y={y} width="120" height="65" rx="12" fill={object.fill} stroke={object.stroke} strokeWidth="3" />
      <circle cx={x + 28} cy={y + 68} r="9" className="fill-slate-700" />
      <circle cx={x + 92} cy={y + 68} r="9" className="fill-slate-700" />
      <text x={x + 60} y={y + 28} textAnchor="middle" className="fill-foreground text-[14px] font-bold">{object.label}</text>
      <text x={x + 60} y={y + 47} textAnchor="middle" className="fill-muted-foreground text-[12px]">m={object.mass}kg</text>
      {arrowLength > 0 ? <g className="stroke-emerald-600 fill-emerald-600"><line x1={arrowStart} y1={y + 28} x2={arrowEnd} y2={y + 28} strokeWidth="4" strokeLinecap="round" markerEnd="url(#collision-arrow)" /><text x={(arrowStart + arrowEnd) / 2} y={y + 16} textAnchor="middle" className="fill-emerald-700 text-[12px] font-bold">v={velocity}m/s</text></g> : <text x={x + 60} y={y - 12} textAnchor="middle" className="fill-muted-foreground text-[12px]">stationary</text>}
    </g>
  );
}

function MomentumTable({ title, before, after, unit }: { title: string; before: number; after: number; unit: string }) {
  return (
    <div className="rounded-2xl border bg-background p-3 text-sm">
      <p className="font-semibold">{title}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-muted/40 p-2"><span className="block text-xs text-muted-foreground">Before</span><b>{before.toFixed(2)} {unit}</b></div>
        <div className="rounded-xl bg-muted/40 p-2"><span className="block text-xs text-muted-foreground">After</span><b>{after.toFixed(2)} {unit}</b></div>
      </div>
    </div>
  );
}

function collisionObjectsFromVisual(visual: PhysicsVisual): CollisionObjectState[] {
  const collisionObjects = (visual.objects ?? []).filter((object) => object.type === 'collision_object');
  const fallbackObjects: PhysicsObject[] = [
    { id: 'cart-a', type: 'collision_object', x: 0, y: 0, label: 'Cart A', physics: { massKg: 2, initialVelocity: 6, finalVelocity: 2 }, style: { fill: '#dbeafe', stroke: '#1d4ed8' } },
    { id: 'cart-b', type: 'collision_object', x: 0, y: 0, label: 'Cart B', physics: { massKg: 3, initialVelocity: 0, finalVelocity: 2.67 }, style: { fill: '#dcfce7', stroke: '#15803d' } },
  ];
  const sourceObjects = collisionObjects.length >= 2 ? collisionObjects : fallbackObjects;

  return sourceObjects.slice(0, 2).map((object, index) => ({
    id: object.id || `cart-${index}`,
    label: object.label || `Cart ${index + 1}`,
    mass: Number(object.physics?.massKg ?? object.physics?.mass ?? 1),
    initialVelocity: Number(object.physics?.initialVelocity ?? 0),
    finalVelocity: Number(object.physics?.finalVelocity ?? object.physics?.velocityAfter ?? 0),
    fill: object.style?.fill || (index === 0 ? '#dbeafe' : '#dcfce7'),
    stroke: object.style?.stroke || (index === 0 ? '#1d4ed8' : '#15803d'),
  }));
}
