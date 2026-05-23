'use client';

import { Gauge, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { getScientificTemplate } from '../science-engine/templates/catalog';
import type { PhysicsVisual } from './types';

type Props = {
  visual: PhysicsVisual;
  updateMetadata: (patch: Record<string, unknown>) => void;
};

const HYDRAULICS_TEMPLATES = new Set([
  'fluid_pressure',
  'hydraulic_press',
  'pascal_principle',
  'bernoulli_flow',
  'continuity_equation',
  'pipe_flow',
  'buoyancy',
  'manometer',
  'hydraulic_cylinder',
  'hydraulic_brake',
  'brake_hydraulics',
  'pump_valve_circuit',
]);

function toInputValue(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value);
}

function parseParameterValue(raw: string, fallback: unknown) {
  if (typeof fallback === 'boolean') return raw === 'true';
  if (typeof fallback === 'number') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  const parsed = Number(raw);
  if (raw.trim() !== '' && Number.isFinite(parsed) && typeof fallback !== 'string') return parsed;
  return raw;
}

function formatUnit(unit?: string) {
  if (!unit) return 'unitless';
  return unit;
}

export function HydraulicsParameterEditor({ visual, updateMetadata }: Props) {
  const template = getScientificTemplate(String(visual.template));
  const isHydraulics = HYDRAULICS_TEMPLATES.has(String(visual.template));
  const parameters = template?.requiredParameters ?? [];

  if (!isHydraulics || !parameters.length) return null;

  return (
    <section className="rounded-2xl border bg-sky-50/60 p-3 dark:bg-sky-950/20">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="size-4 text-primary" />Hydraulics parameters</p>
          <p className="text-xs text-muted-foreground">Generated from the selected template. Change values here instead of editing JSON.</p>
        </div>
        <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">{parameters.length} controls</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {parameters.map((parameter) => {
          const metadataValue = visual.metadata?.[parameter.id];
          const value = metadataValue ?? parameter.value ?? '';
          const isText = typeof parameter.value === 'string' || parameter.id.toLowerCase().includes('state');

          return (
            <label key={parameter.id} className="rounded-2xl border bg-background p-3 shadow-sm">
              <span className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
                <span>{parameter.label}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono">{parameter.symbol}</span>
              </span>
              <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
                {parameter.id.toLowerCase().includes('state') ? (
                  <select
                    className="h-10 rounded-md border bg-background px-2 text-sm"
                    value={toInputValue(value)}
                    onChange={(event) => updateMetadata({ [parameter.id]: event.target.value })}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="neutral">Neutral</option>
                    <option value="extend">Extend</option>
                    <option value="retract">Retract</option>
                    <option value="relief">Relief</option>
                  </select>
                ) : (
                  <Input
                    type={isText ? 'text' : 'number'}
                    step="any"
                    min={parameter.min}
                    max={parameter.max}
                    value={toInputValue(value)}
                    onChange={(event) => updateMetadata({ [parameter.id]: parseParameterValue(event.target.value, parameter.value) })}
                  />
                )}
                <span className="rounded-md border bg-muted px-2 py-2 text-xs text-muted-foreground">{formatUnit(parameter.unit)}</span>
              </div>
              {parameter.description ? <span className="mt-2 block text-xs text-muted-foreground">{parameter.description}</span> : null}
            </label>
          );
        })}
      </div>

      <div className="mt-3 rounded-2xl border bg-background/80 p-3 text-xs text-muted-foreground">
        <p className="flex items-center gap-2 font-semibold text-foreground"><Gauge className="size-4 text-primary" />Advanced teaching tip</p>
        <p className="mt-1">Use extreme values deliberately: high velocity for pressure loss, large output piston area for force multiplication, and valve state changes for circuit-reading lessons.</p>
      </div>
    </section>
  );
}
