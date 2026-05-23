'use client';

import { Gauge, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { getScientificTemplate } from '../science-engine/templates/catalog';
import type { PhysicsVisual } from './types';

type Props = {
  visual: PhysicsVisual;
  updateMetadata: (patch: Record<string, unknown>) => void;
};

type ExtraControl = {
  id: string;
  symbol: string;
  label: string;
  value: string | number | boolean;
  unit?: string;
  kind?: 'select' | 'boolean' | 'number' | 'text';
  options?: string[];
  description?: string;
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

const CIRCUIT_EXTRA_CONTROLS: ExtraControl[] = [
  { id: 'visualMode', symbol: 'mode', label: 'Circuit visual mode', value: 'schematic', kind: 'select', options: ['schematic', 'pictorial'], description: 'Schematic mode teaches industrial hydraulic symbols; pictorial mode teaches physical layout.' },
  { id: 'showPressureLine', symbol: 'P-line', label: 'Show pressure line', value: true, kind: 'boolean', description: 'Highlights the high-pressure supply path.' },
  { id: 'showReturnLine', symbol: 'T-line', label: 'Show return line', value: true, kind: 'boolean', description: 'Highlights the tank/return path.' },
  { id: 'showPilotLine', symbol: 'pilot', label: 'Show pilot/gauge signal line', value: true, kind: 'boolean', description: 'Shows dashed pilot or measurement signal lines.' },
  { id: 'faultMode', symbol: 'fault', label: 'Fault diagnosis mode', value: 'none', kind: 'select', options: ['none', 'blocked_filter', 'relief_open', 'cylinder_stalled'], description: 'Adds a troubleshooting condition for industrial training scenarios.' },
  { id: 'animationMode', symbol: 'anim', label: 'Animation mode', value: 'flow', kind: 'select', options: ['off', 'flow', 'pressure_pulse', 'valve_switch', 'cylinder_motion'], description: 'Controls the training animation layer used by the renderer.' },
  { id: 'branchMode', symbol: 'branch', label: 'Circuit branch mode', value: 'single_branch', kind: 'select', options: ['single_branch', 'dual_branch', 'relief_branch'], description: 'Adds branches for more advanced circuit-reading lessons.' },
];

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

function renderControl(control: ExtraControl, currentValue: unknown, updateMetadata: (patch: Record<string, unknown>) => void) {
  const value = currentValue ?? control.value;
  const kind = control.kind ?? (typeof control.value === 'number' ? 'number' : 'text');

  return (
    <label key={control.id} className="rounded-2xl border bg-background p-3 shadow-sm">
      <span className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
        <span>{control.label}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono">{control.symbol}</span>
      </span>
      <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
        {kind === 'select' ? (
          <select className="h-10 rounded-md border bg-background px-2 text-sm" value={toInputValue(value)} onChange={(event) => updateMetadata({ [control.id]: event.target.value })}>
            {(control.options ?? []).map((option) => <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>)}
          </select>
        ) : kind === 'boolean' ? (
          <select className="h-10 rounded-md border bg-background px-2 text-sm" value={String(value)} onChange={(event) => updateMetadata({ [control.id]: event.target.value === 'true' })}>
            <option value="true">Show</option>
            <option value="false">Hide</option>
          </select>
        ) : (
          <Input type={kind === 'number' ? 'number' : 'text'} step="any" value={toInputValue(value)} onChange={(event) => updateMetadata({ [control.id]: parseParameterValue(event.target.value, control.value) })} />
        )}
        <span className="rounded-md border bg-muted px-2 py-2 text-xs text-muted-foreground">{formatUnit(control.unit)}</span>
      </div>
      {control.description ? <span className="mt-2 block text-xs text-muted-foreground">{control.description}</span> : null}
    </label>
  );
}

export function HydraulicsParameterEditor({ visual, updateMetadata }: Props) {
  const template = getScientificTemplate(String(visual.template));
  const isHydraulics = HYDRAULICS_TEMPLATES.has(String(visual.template));
  const parameters = template?.requiredParameters ?? [];
  const isCircuit = String(visual.template) === 'pump_valve_circuit';

  if (!isHydraulics || (!parameters.length && !isCircuit)) return null;

  return (
    <section className="space-y-3 rounded-2xl border bg-sky-50/60 p-3 dark:bg-sky-950/20">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="size-4 text-primary" />Hydraulics parameters</p>
          <p className="text-xs text-muted-foreground">Generated from the selected template. Change values here instead of editing JSON.</p>
        </div>
        <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">{parameters.length + (isCircuit ? CIRCUIT_EXTRA_CONTROLS.length : 0)} controls</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {parameters.map((parameter) => {
          const metadataValue = visual.metadata?.[parameter.id];
          const value = metadataValue ?? parameter.value ?? '';
          const id = parameter.id.toLowerCase();
          const isState = id.includes('state');
          const isBoolean = typeof parameter.value === 'boolean';
          const isText = typeof parameter.value === 'string' || isState;

          return (
            <label key={parameter.id} className="rounded-2xl border bg-background p-3 shadow-sm">
              <span className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
                <span>{parameter.label}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono">{parameter.symbol}</span>
              </span>
              <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
                {isState ? (
                  <select className="h-10 rounded-md border bg-background px-2 text-sm" value={toInputValue(value)} onChange={(event) => updateMetadata({ [parameter.id]: event.target.value })}>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="neutral">Neutral</option>
                    <option value="extend">Extend</option>
                    <option value="retract">Retract</option>
                    <option value="relief">Relief</option>
                  </select>
                ) : isBoolean ? (
                  <select className="h-10 rounded-md border bg-background px-2 text-sm" value={String(value)} onChange={(event) => updateMetadata({ [parameter.id]: event.target.value === 'true' })}>
                    <option value="true">Show</option>
                    <option value="false">Hide</option>
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

      {isCircuit ? (
        <div className="rounded-2xl border bg-background/60 p-3">
          <p className="mb-3 text-sm font-semibold">Industrial circuit-symbol mode</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {CIRCUIT_EXTRA_CONTROLS.map((control) => renderControl(control, visual.metadata?.[control.id], updateMetadata))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border bg-background/80 p-3 text-xs text-muted-foreground">
        <p className="flex items-center gap-2 font-semibold text-foreground"><Gauge className="size-4 text-primary" />Advanced teaching tip</p>
        <p className="mt-1">Use extreme values deliberately: high velocity for pressure loss, large output piston area for force multiplication, and valve/fault changes for circuit-reading lessons.</p>
      </div>
    </section>
  );
}
