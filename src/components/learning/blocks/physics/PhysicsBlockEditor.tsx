'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileJson, ListChecks, MousePointer2, Plus, Sparkles, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { BlockEditorProps, LearningBlockPayload } from '../schemas';
import { clonePhysicsVisual, physicsTemplateVisuals, type PhysicsTemplateKey } from './defaults';
import { PhysicsVisualRenderer } from './PhysicsVisualRenderer';
import type { PhysicsArrow, PhysicsInteraction, PhysicsObject, PhysicsTeachingStep, PhysicsVisual } from './types';

const templateOptions: Array<{ key: PhysicsTemplateKey; label: string; cardType: string; help: string }> = [
  { key: 'free_body', label: 'Free-body', cardType: 'free_body_diagram_card', help: 'Forces on an object' },
  { key: 'pulley', label: 'Pulley', cardType: 'pulley_system_card', help: 'Tension and weights' },
  { key: 'collision', label: 'Collision', cardType: 'collision_simulation_card', help: 'Momentum lab' },
  { key: 'wave', label: 'Wave', cardType: 'wave_diagram_card', help: 'Amplitude and wavelength' },
  { key: 'kinematics_graph', label: 'Kinematics graph', cardType: 'kinematics_graph_card', help: 'Gradient and area' },
  { key: 'circuit', label: 'Circuit', cardType: 'circuit_diagram_card', help: 'Current and voltage' },
  { key: 'ray_diagram', label: 'Optics', cardType: 'ray_diagram_card', help: 'Lens and ray diagrams' },
];

export function PhysicsBlockEditor({ payload, onChange }: BlockEditorProps) {
  const visual = useMemo(() => resolveVisual(payload), [payload]);
  const [selectedObjectId, setSelectedObjectId] = useState<string>(visual.objects[0]?.id ?? '');
  const [json, setJson] = useState(() => JSON.stringify(visual, null, 2));
  const selectedObject = visual.objects.find((object) => object.id === selectedObjectId) ?? visual.objects[0];

  useEffect(() => {
    setJson(JSON.stringify(visual, null, 2));
    if (!selectedObjectId && visual.objects[0]) setSelectedObjectId(visual.objects[0].id);
  }, [visual, selectedObjectId]);

  function updatePayload(nextVisual: PhysicsVisual, patch: Partial<LearningBlockPayload> = {}) {
    setJson(JSON.stringify(nextVisual, null, 2));
    onChange({ ...payload, type: 'physics_visual', visual: nextVisual, ...patch });
  }

  function applyTemplate(template: PhysicsTemplateKey) {
    const nextVisual = clonePhysicsVisual(template);
    const option = templateOptions.find((item) => item.key === template);
    setSelectedObjectId(nextVisual.objects[0]?.id ?? '');
    updatePayload(nextVisual, { physicsTemplate: template, physicsCardType: option?.cardType ?? `${template}_card` });
  }

  function updateVisualPatch(patch: Partial<PhysicsVisual>) {
    updatePayload({ ...visual, ...patch });
  }

  function updateObject(objectId: string, patch: Partial<PhysicsObject>) {
    updatePayload({ ...visual, objects: visual.objects.map((object) => object.id === objectId ? { ...object, ...patch } : object) });
  }

  function updateArrow(arrowId: string, patch: Partial<PhysicsArrow>) {
    updatePayload({ ...visual, arrows: (visual.arrows ?? []).map((arrow) => arrow.id === arrowId ? { ...arrow, ...patch } : arrow) });
  }

  function updateStep(stepId: string, patch: Partial<PhysicsTeachingStep>) {
    updatePayload({ ...visual, steps: (visual.steps ?? []).map((step) => step.id === stepId ? { ...step, ...patch } : step) });
  }

  function updateInteraction(interactionId: string, patch: Partial<PhysicsInteraction>) {
    updatePayload({ ...visual, interactions: (visual.interactions ?? []).map((interaction) => interaction.id === interactionId ? { ...interaction, ...patch } : interaction) });
  }

  function addObject() {
    const id = `object-${Date.now().toString(36).slice(-5)}`;
    const nextObject: PhysicsObject = { id, type: 'rectangle', x: 220, y: 180, width: 120, height: 80, label: 'New object', interactive: true, style: { fill: '#f8fafc', stroke: '#0f172a', strokeWidth: 2 } };
    setSelectedObjectId(id);
    updatePayload({ ...visual, objects: [...visual.objects, nextObject] });
  }

  function addArrow() {
    const id = `arrow-${Date.now().toString(36).slice(-5)}`;
    const nextArrow: PhysicsArrow = { id, type: 'force', from: { x: 300, y: 220 }, to: { x: 420, y: 220 }, label: 'F', colorRole: 'force', isInteractive: true };
    updatePayload({ ...visual, arrows: [...(visual.arrows ?? []), nextArrow] });
  }

  function addStep() {
    const id = `step-${Date.now().toString(36).slice(-5)}`;
    updatePayload({ ...visual, steps: [...(visual.steps ?? []), { id, title: 'New teaching step', explanation: 'Explain what the student should notice.', highlightObjectIds: visual.objects[0]?.id ? [visual.objects[0].id] : [] }] });
  }

  function addInteraction() {
    const id = `interaction-${Date.now().toString(36).slice(-5)}`;
    updatePayload({ ...visual, interactions: [...(visual.interactions ?? []), { id, type: 'click_hotspot', prompt: 'Tap the correct part of the diagram.', correctTargetId: visual.objects[0]?.id, feedback: { correct: 'Correct.', incorrect: 'Not quite. Check the diagram again.' } }] });
  }

  function applyJson() {
    try {
      const nextVisual = JSON.parse(json) as PhysicsVisual;
      setSelectedObjectId(nextVisual.objects?.[0]?.id ?? '');
      updatePayload(nextVisual);
    } catch {
      // Keep editing local JSON. The builder can show validation later.
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border p-4">
      <div>
        <p className="font-semibold">Physics Visual Studio</p>
        <p className="text-sm text-muted-foreground">Build physics diagrams, simulations, steps, and diagram-based questions. Advanced JSON is still available below.</p>
      </div>

      <section className="rounded-2xl border bg-muted/20 p-3">
        <p className="mb-3 text-sm font-semibold">Template picker</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {templateOptions.map((template) => (
            <button key={template.key} type="button" onClick={() => applyTemplate(template.key)} className={`rounded-xl border p-3 text-left text-sm transition ${visual.template === template.key ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:border-primary/50'}`}>
              <span className="flex items-center gap-2 font-semibold"><Sparkles className="size-4" />{template.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{template.help}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <section className="rounded-2xl border p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold"><MousePointer2 className="size-4 text-primary" />Objects</p>
              <Button type="button" size="sm" variant="outline" onClick={addObject}><Plus className="mr-1 size-3" />Add</Button>
            </div>
            <div className="space-y-2">
              {visual.objects.map((object) => <button key={object.id} type="button" onClick={() => setSelectedObjectId(object.id)} className={`w-full rounded-xl border p-2 text-left text-xs ${selectedObject?.id === object.id ? 'border-primary bg-primary/10' : 'bg-background'}`}><b>{object.label || object.id}</b><span className="ml-2 text-muted-foreground">{object.type}</span></button>)}
            </div>
            {selectedObject ? <ObjectProperties object={selectedObject} updateObject={(patch) => updateObject(selectedObject.id, patch)} /> : null}
          </section>

          <section className="rounded-2xl border p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold"><Target className="size-4 text-primary" />Arrows / vectors</p>
              <Button type="button" size="sm" variant="outline" onClick={addArrow}><Plus className="mr-1 size-3" />Add</Button>
            </div>
            <div className="space-y-2">
              {(visual.arrows ?? []).map((arrow) => <ArrowRow key={arrow.id} arrow={arrow} updateArrow={(patch) => updateArrow(arrow.id, patch)} />)}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <PhysicsVisualRenderer visual={visual} mode="builder" />
          <section className="grid gap-4 lg:grid-cols-2">
            <StepsPanel steps={visual.steps ?? []} addStep={addStep} updateStep={updateStep} />
            <InteractionsPanel interactions={visual.interactions ?? []} addInteraction={addInteraction} updateInteraction={updateInteraction} />
          </section>
        </div>
      </div>

      <details className="rounded-2xl border bg-background">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Advanced JSON editor</summary>
        <div className="space-y-2 border-t p-4">
          <Textarea value={json} onChange={(event) => setJson(event.target.value)} rows={16} spellCheck={false} className="font-mono text-xs" />
          <Button type="button" size="sm" onClick={applyJson}><FileJson className="mr-2 size-4" />Apply physics JSON</Button>
        </div>
      </details>
    </div>
  );
}

function ObjectProperties({ object, updateObject }: { object: PhysicsObject; updateObject: (patch: Partial<PhysicsObject>) => void }) {
  return <div className="mt-3 grid gap-2 text-xs"><Input value={object.label || ''} onChange={(event) => updateObject({ label: event.target.value })} placeholder="Label" /><select className="h-9 rounded-md border bg-background px-2" value={object.type} onChange={(event) => updateObject({ type: event.target.value as PhysicsObject['type'] })}><option value="rectangle">Rectangle/mass</option><option value="circle">Circle</option><option value="wave">Wave</option><option value="spring">Spring</option><option value="lens">Lens</option><option value="mirror">Mirror</option><option value="ray">Ray</option><option value="circuit_component">Circuit component</option><option value="collision_object">Collision object</option></select><div className="grid grid-cols-2 gap-2"><Input type="number" value={object.x} onChange={(event) => updateObject({ x: Number(event.target.value) || 0 })} placeholder="x" /><Input type="number" value={object.y} onChange={(event) => updateObject({ y: Number(event.target.value) || 0 })} placeholder="y" /><Input type="number" value={object.width ?? ''} onChange={(event) => updateObject({ width: Number(event.target.value) || undefined })} placeholder="width" /><Input type="number" value={object.height ?? ''} onChange={(event) => updateObject({ height: Number(event.target.value) || undefined })} placeholder="height" /></div></div>;
}

function ArrowRow({ arrow, updateArrow }: { arrow: PhysicsArrow; updateArrow: (patch: Partial<PhysicsArrow>) => void }) {
  return <div className="rounded-xl border bg-background p-2 text-xs"><Input value={arrow.label || ''} onChange={(event) => updateArrow({ label: event.target.value })} placeholder="Arrow label" /><div className="mt-2 grid grid-cols-2 gap-2"><Input type="number" value={arrow.from.x} onChange={(event) => updateArrow({ from: { ...arrow.from, x: Number(event.target.value) || 0 } })} placeholder="from x" /><Input type="number" value={arrow.from.y} onChange={(event) => updateArrow({ from: { ...arrow.from, y: Number(event.target.value) || 0 } })} placeholder="from y" /><Input type="number" value={arrow.to.x} onChange={(event) => updateArrow({ to: { ...arrow.to, x: Number(event.target.value) || 0 } })} placeholder="to x" /><Input type="number" value={arrow.to.y} onChange={(event) => updateArrow({ to: { ...arrow.to, y: Number(event.target.value) || 0 } })} placeholder="to y" /></div></div>;
}

function StepsPanel({ steps, addStep, updateStep }: { steps: PhysicsTeachingStep[]; addStep: () => void; updateStep: (id: string, patch: Partial<PhysicsTeachingStep>) => void }) {
  return <section className="rounded-2xl border p-3"><div className="mb-3 flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-semibold"><ListChecks className="size-4 text-primary" />Teaching steps</p><Button type="button" size="sm" variant="outline" onClick={addStep}><Plus className="mr-1 size-3" />Add</Button></div><div className="space-y-2">{steps.map((step) => <div key={step.id} className="rounded-xl border bg-background p-2"><Input value={step.title} onChange={(event) => updateStep(step.id, { title: event.target.value })} /><Textarea className="mt-2 text-xs" rows={2} value={step.explanation} onChange={(event) => updateStep(step.id, { explanation: event.target.value })} /></div>)}</div></section>;
}

function InteractionsPanel({ interactions, addInteraction, updateInteraction }: { interactions: PhysicsInteraction[]; addInteraction: () => void; updateInteraction: (id: string, patch: Partial<PhysicsInteraction>) => void }) {
  return <section className="rounded-2xl border p-3"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Questions / feedback</p><Button type="button" size="sm" variant="outline" onClick={addInteraction}><Plus className="mr-1 size-3" />Add</Button></div><div className="space-y-2">{interactions.map((interaction) => <div key={interaction.id} className="rounded-xl border bg-background p-2"><Input value={interaction.prompt} onChange={(event) => updateInteraction(interaction.id || '', { prompt: event.target.value })} /><div className="mt-2 grid gap-2 sm:grid-cols-2"><Input value={interaction.correctTargetId || ''} onChange={(event) => updateInteraction(interaction.id || '', { correctTargetId: event.target.value })} placeholder="Correct target ID" /><Input value={String(interaction.correctAnswer ?? '')} onChange={(event) => updateInteraction(interaction.id || '', { correctAnswer: event.target.value })} placeholder="Numeric/text answer" /></div><Textarea className="mt-2 text-xs" rows={2} value={interaction.feedback?.incorrect || ''} onChange={(event) => updateInteraction(interaction.id || '', { feedback: { ...interaction.feedback, incorrect: event.target.value } })} placeholder="Incorrect feedback" /></div>)}</div></section>;
}

function resolveVisual(payload: LearningBlockPayload): PhysicsVisual {
  const visual = payload.visual;
  if (visual && typeof visual === 'object' && !Array.isArray(visual)) return visual as PhysicsVisual;
  const template = typeof payload.physicsTemplate === 'string' && payload.physicsTemplate in physicsTemplateVisuals ? payload.physicsTemplate as PhysicsTemplateKey : 'free_body';
  return clonePhysicsVisual(template);
}
