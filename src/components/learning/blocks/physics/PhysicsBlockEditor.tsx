'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FileJson, ListChecks, MousePointer2, Plus, Sparkles, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { BlockEditorProps, LearningBlockPayload } from '../schemas';
import { createScienceTemplateVisual, scienceBuilderTemplateOptions } from '../science-engine/templates/builderOptions';
import { PhysicsVisualRenderer } from './PhysicsVisualRenderer';
import type { PhysicsArrow, PhysicsHotspot, PhysicsInteraction, PhysicsLabel, PhysicsObject, PhysicsTeachingStep, PhysicsVisual } from './types';
import { validatePhysicsVisual } from './validation';

function cloneVisual<T>(visual: T): T {
  return JSON.parse(JSON.stringify(visual)) as T;
}

export function PhysicsBlockEditor({ payload, onChange }: BlockEditorProps) {
  const visual = useMemo(() => resolveVisual(payload), [payload]);
  const issues = useMemo(() => validatePhysicsVisual(visual), [visual]);
  const [selectedObjectId, setSelectedObjectId] = useState<string>(visual.objects[0]?.id ?? '');
  const [json, setJson] = useState(() => JSON.stringify(visual, null, 2));
  const selectedObject = visual.objects.find((object) => object.id === selectedObjectId) ?? visual.objects[0];
  const selectedTemplate = scienceBuilderTemplateOptions.find((template) => template.key === visual.template);

  useEffect(() => {
    setJson(JSON.stringify(visual, null, 2));
    if (!selectedObjectId && visual.objects[0]) setSelectedObjectId(visual.objects[0].id);
  }, [visual, selectedObjectId]);

  function updatePayload(nextVisual: PhysicsVisual, patch: Partial<LearningBlockPayload> = {}) {
    setJson(JSON.stringify(nextVisual, null, 2));
    onChange({ ...payload, type: 'physics_visual', visual: nextVisual, ...patch });
  }

  function applyTemplate(templateKey: string) {
    const option = scienceBuilderTemplateOptions.find((item) => item.key === templateKey);
    const nextVisual = cloneVisual(createScienceTemplateVisual(templateKey));
    setSelectedObjectId(nextVisual.objects[0]?.id ?? '');
    updatePayload(nextVisual, {
      physicsTemplate: templateKey,
      physicsCardType: option?.cardType ?? `${templateKey}_card`,
      title: option?.label ?? nextVisual.metadata?.title as string | undefined,
    });
  }

  function updateCanvas(patch: Partial<PhysicsVisual['canvas']>) { updatePayload({ ...visual, canvas: { ...visual.canvas, ...patch } }); }
  function updateMetadata(patch: Record<string, unknown>) { updatePayload({ ...visual, metadata: { ...(visual.metadata ?? {}), ...patch } }); }
  function updateObject(objectId: string, patch: Partial<PhysicsObject>) { updatePayload({ ...visual, objects: visual.objects.map((object) => object.id === objectId ? { ...object, ...patch } : object) }); }
  function updateArrow(arrowId: string, patch: Partial<PhysicsArrow>) { updatePayload({ ...visual, arrows: (visual.arrows ?? []).map((arrow) => arrow.id === arrowId ? { ...arrow, ...patch } : arrow) }); }
  function updateStep(stepId: string, patch: Partial<PhysicsTeachingStep>) { updatePayload({ ...visual, steps: (visual.steps ?? []).map((step) => step.id === stepId ? { ...step, ...patch } : step) }); }
  function updateInteraction(interactionId: string, patch: Partial<PhysicsInteraction>) { updatePayload({ ...visual, interactions: (visual.interactions ?? []).map((interaction) => interaction.id === interactionId ? { ...interaction, ...patch } : interaction) }); }
  function updateLabel(labelId: string, patch: Partial<PhysicsLabel>) { updatePayload({ ...visual, labels: (visual.labels ?? []).map((label) => label.id === labelId ? { ...label, ...patch } : label) }); }
  function updateHotspot(hotspotId: string, patch: Partial<PhysicsHotspot>) { updatePayload({ ...visual, hotspots: (visual.hotspots ?? []).map((hotspot) => hotspot.id === hotspotId ? { ...hotspot, ...patch } : hotspot) }); }

  function addObject() {
    const id = `object-${Date.now().toString(36).slice(-5)}`;
    const nextObject: PhysicsObject = { id, type: 'rectangle', x: 220, y: 180, width: 120, height: 80, label: 'New object', interactive: true, style: { fill: '#f8fafc', stroke: '#0f172a', strokeWidth: 2 } };
    setSelectedObjectId(id);
    updatePayload({ ...visual, objects: [...visual.objects, nextObject] });
  }

  function addArrow() { const id = `arrow-${Date.now().toString(36).slice(-5)}`; updatePayload({ ...visual, arrows: [...(visual.arrows ?? []), { id, type: 'force', from: { x: 300, y: 220 }, to: { x: 420, y: 220 }, label: 'F', colorRole: 'force', isInteractive: true }] }); }
  function addStep() { const id = `step-${Date.now().toString(36).slice(-5)}`; updatePayload({ ...visual, steps: [...(visual.steps ?? []), { id, title: 'New teaching step', explanation: 'Explain what the student should notice.', highlightObjectIds: visual.objects[0]?.id ? [visual.objects[0].id] : [] }] }); }
  function addInteraction() { const id = `interaction-${Date.now().toString(36).slice(-5)}`; updatePayload({ ...visual, interactions: [...(visual.interactions ?? []), { id, type: 'click_hotspot', prompt: 'Tap the correct part of the diagram.', correctTargetId: visual.objects[0]?.id, feedback: { correct: 'Correct.', incorrect: 'Not quite. Check the diagram again.' } }] }); }
  function addLabel() { const id = `label-${Date.now().toString(36).slice(-5)}`; updatePayload({ ...visual, labels: [...(visual.labels ?? []), { id, text: 'New label', x: 120, y: 80 }] }); }
  function addHotspot() { const id = `hotspot-${Date.now().toString(36).slice(-5)}`; updatePayload({ ...visual, hotspots: [...(visual.hotspots ?? []), { id, x: 160, y: 160, width: 120, height: 80, targetId: visual.objects[0]?.id, label: 'Hotspot' }] }); }
  function addEquation() { const id = `equation-${Date.now().toString(36).slice(-5)}`; updatePayload({ ...visual, equations: [...(visual.equations ?? []), { id, latex: 'F = ma', description: 'Key equation' }] }); }

  function applyJson() {
    try { const nextVisual = JSON.parse(json) as PhysicsVisual; setSelectedObjectId(nextVisual.objects?.[0]?.id ?? ''); updatePayload(nextVisual, { physicsTemplate: nextVisual.template, physicsCardType: `${nextVisual.template}_card` }); } catch { /* keep editing local JSON */ }
  }

  return (
    <div className="space-y-5 rounded-2xl border p-4">
      <div>
        <p className="font-semibold">Physics Visual Studio</p>
        <p className="text-sm text-muted-foreground">Build physics, fluids, hydraulics, engineering diagrams, simulations, steps, and diagram-based questions. Templates now come from the shared science catalog.</p>
      </div>
      <ValidationPanel issues={issues} />
      <section className="rounded-2xl border bg-muted/20 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Template picker</p>
            {selectedTemplate ? <p className="text-xs text-muted-foreground">{selectedTemplate.domain.replace(/_/g, ' ')} · {selectedTemplate.source.replace(/_/g, ' ')}</p> : null}
          </div>
          <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">{scienceBuilderTemplateOptions.length} templates available</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {scienceBuilderTemplateOptions.map((template) => (
            <button key={template.key} type="button" onClick={() => applyTemplate(template.key)} className={`rounded-xl border p-3 text-left text-sm transition ${visual.template === template.key ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:border-primary/50'}`}>
              <span className="flex items-center gap-2 font-semibold"><Sparkles className="size-4" />{template.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{template.help}</span>
            </button>
          ))}
        </div>
      </section>
      <CanvasSettings visual={visual} updateCanvas={updateCanvas} updateMetadata={updateMetadata} />
      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <section className="rounded-2xl border p-3"><div className="mb-3 flex items-center justify-between gap-2"><p className="flex items-center gap-2 text-sm font-semibold"><MousePointer2 className="size-4 text-primary" />Objects</p><Button type="button" size="sm" variant="outline" onClick={addObject}><Plus className="mr-1 size-3" />Add</Button></div><div className="space-y-2">{visual.objects.map((object) => <button key={object.id} type="button" onClick={() => setSelectedObjectId(object.id)} className={`w-full rounded-xl border p-2 text-left text-xs ${selectedObject?.id === object.id ? 'border-primary bg-primary/10' : 'bg-background'}`}><b>{object.label || object.id}</b><span className="ml-2 text-muted-foreground">{object.type}</span></button>)}</div>{selectedObject ? <ObjectProperties object={selectedObject} updateObject={(patch) => updateObject(selectedObject.id, patch)} /> : null}</section>
          <section className="rounded-2xl border p-3"><div className="mb-3 flex items-center justify-between gap-2"><p className="flex items-center gap-2 text-sm font-semibold"><Target className="size-4 text-primary" />Arrows / vectors</p><Button type="button" size="sm" variant="outline" onClick={addArrow}><Plus className="mr-1 size-3" />Add</Button></div><div className="space-y-2">{(visual.arrows ?? []).map((arrow) => <ArrowRow key={arrow.id} arrow={arrow} updateArrow={(patch) => updateArrow(arrow.id, patch)} />)}</div></section>
          <LabelsPanel labels={visual.labels ?? []} addLabel={addLabel} updateLabel={updateLabel} />
          <HotspotsPanel hotspots={visual.hotspots ?? []} addHotspot={addHotspot} updateHotspot={updateHotspot} />
          <EquationsPanel equations={visual.equations ?? []} addEquation={addEquation} updateEquation={(id, patch) => updatePayload({ ...visual, equations: (visual.equations ?? []).map((equation) => equation.id === id ? { ...equation, ...patch } : equation) })} />
        </div>
        <div className="space-y-4"><PhysicsVisualRenderer visual={visual} mode="builder" /><section className="grid gap-4 lg:grid-cols-2"><StepsPanel steps={visual.steps ?? []} addStep={addStep} updateStep={updateStep} /><InteractionsPanel interactions={visual.interactions ?? []} addInteraction={addInteraction} updateInteraction={updateInteraction} /></section></div>
      </div>
      <details className="rounded-2xl border bg-background"><summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Advanced JSON editor</summary><div className="space-y-2 border-t p-4"><Textarea value={json} onChange={(event) => setJson(event.target.value)} rows={16} spellCheck={false} className="font-mono text-xs" /><Button type="button" size="sm" onClick={applyJson}><FileJson className="mr-2 size-4" />Apply physics JSON</Button></div></details>
    </div>
  );
}

function ValidationPanel({ issues }: { issues: ReturnType<typeof validatePhysicsVisual> }) { if (!issues.length) return <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">Physics card looks valid.</div>; return <div className="space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200"><p className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" />Validation warnings</p>{issues.map((issue, index) => <p key={`${issue.message}-${index}`}>• {issue.severity.toUpperCase()}: {issue.message}</p>)}</div>; }
function CanvasSettings({ visual, updateCanvas, updateMetadata }: { visual: PhysicsVisual; updateCanvas: (patch: Partial<PhysicsVisual['canvas']>) => void; updateMetadata: (patch: Record<string, unknown>) => void }) { return <section className="rounded-2xl border p-3"><p className="mb-3 text-sm font-semibold">Canvas and simulation settings</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Input type="number" value={visual.canvas.width} onChange={(event) => updateCanvas({ width: Number(event.target.value) || 800 })} placeholder="Width" /><Input type="number" value={visual.canvas.height} onChange={(event) => updateCanvas({ height: Number(event.target.value) || 500 })} placeholder="Height" /><select className="h-10 rounded-md border bg-background px-2 text-sm" value={visual.canvas.background} onChange={(event) => updateCanvas({ background: event.target.value as PhysicsVisual['canvas']['background'] })}><option value="plain">Plain</option><option value="grid">Grid</option><option value="graph_paper">Graph paper</option><option value="lab">Lab</option><option value="transparent">Transparent</option></select><select className="h-10 rounded-md border bg-background px-2 text-sm" value={String(visual.metadata?.collisionType ?? visual.metadata?.valveState ?? 'default')} onChange={(event) => updateMetadata({ collisionType: event.target.value, valveState: event.target.value })}><option value="default">Default</option><option value="elastic">Elastic</option><option value="inelastic">Inelastic</option><option value="perfectly_inelastic">Perfectly inelastic</option><option value="explosion">Explosion</option><option value="open">Valve open</option><option value="closed">Valve closed</option><option value="relief">Relief path</option></select></div></section>; }

function ObjectProperties({ object, updateObject }: { object: PhysicsObject; updateObject: (patch: Partial<PhysicsObject>) => void }) { const physics = object.physics ?? {}; return <div className="mt-3 grid gap-2 text-xs"><Input value={object.label || ''} onChange={(event) => updateObject({ label: event.target.value })} placeholder="Label" /><select className="h-9 rounded-md border bg-background px-2" value={object.type} onChange={(event) => updateObject({ type: event.target.value as PhysicsObject['type'] })}><option value="rectangle">Rectangle/mass</option><option value="circle">Circle</option><option value="wave">Wave</option><option value="spring">Spring</option><option value="lens">Lens</option><option value="mirror">Mirror</option><option value="ray">Ray</option><option value="circuit_component">Circuit component</option><option value="collision_object">Collision object</option><option value="fluid_container">Fluid container</option><option value="piston">Piston</option><option value="pipe">Pipe</option><option value="valve">Valve</option><option value="pump">Pump</option><option value="reservoir">Reservoir</option><option value="manometer_tube">Manometer tube</option><option value="hydraulic_cylinder">Hydraulic cylinder</option><option value="brake_caliper">Brake caliper</option><option value="directional_valve">Directional valve</option><option value="relief_valve">Relief valve</option></select><div className="grid grid-cols-2 gap-2"><Input type="number" value={object.x} onChange={(event) => updateObject({ x: Number(event.target.value) || 0 })} placeholder="x" /><Input type="number" value={object.y} onChange={(event) => updateObject({ y: Number(event.target.value) || 0 })} placeholder="y" /><Input type="number" value={object.width ?? ''} onChange={(event) => updateObject({ width: Number(event.target.value) || undefined })} placeholder="width" /><Input type="number" value={object.height ?? ''} onChange={(event) => updateObject({ height: Number(event.target.value) || undefined })} placeholder="height" /></div>{object.type === 'collision_object' ? <div className="rounded-xl border bg-muted/30 p-2"><p className="mb-2 font-semibold">Collision physics</p><div className="grid grid-cols-3 gap-2"><Input type="number" value={Number(physics.massKg ?? physics.mass ?? '')} onChange={(event) => updateObject({ physics: { ...physics, massKg: Number(event.target.value) || 0 } })} placeholder="mass kg" /><Input type="number" value={Number(physics.initialVelocity ?? '')} onChange={(event) => updateObject({ physics: { ...physics, initialVelocity: Number(event.target.value) || 0 } })} placeholder="u m/s" /><Input type="number" value={Number(physics.finalVelocity ?? '')} onChange={(event) => updateObject({ physics: { ...physics, finalVelocity: Number(event.target.value) || 0 } })} placeholder="v m/s" /></div></div> : null}</div>; }
function ArrowRow({ arrow, updateArrow }: { arrow: PhysicsArrow; updateArrow: (patch: Partial<PhysicsArrow>) => void }) { return <div className="rounded-xl border bg-background p-2 text-xs"><Input value={arrow.label || ''} onChange={(event) => updateArrow({ label: event.target.value })} placeholder="Arrow label" /><div className="mt-2 grid grid-cols-2 gap-2"><Input type="number" value={arrow.from.x} onChange={(event) => updateArrow({ from: { ...arrow.from, x: Number(event.target.value) || 0 } })} placeholder="from x" /><Input type="number" value={arrow.from.y} onChange={(event) => updateArrow({ from: { ...arrow.from, y: Number(event.target.value) || 0 } })} placeholder="from y" /><Input type="number" value={arrow.to.x} onChange={(event) => updateArrow({ to: { ...arrow.to, x: Number(event.target.value) || 0 } })} placeholder="to x" /><Input type="number" value={arrow.to.y} onChange={(event) => updateArrow({ to: { ...arrow.to, y: Number(event.target.value) || 0 } })} placeholder="to y" /></div></div>; }
function LabelsPanel({ labels, addLabel, updateLabel }: { labels: PhysicsLabel[]; addLabel: () => void; updateLabel: (id: string, patch: Partial<PhysicsLabel>) => void }) { return <section className="rounded-2xl border p-3"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Labels</p><Button type="button" size="sm" variant="outline" onClick={addLabel}><Plus className="mr-1 size-3" />Add</Button></div>{labels.map((label) => <div key={label.id} className="mb-2 grid grid-cols-[1fr_70px_70px] gap-2"><Input value={label.text} onChange={(event) => updateLabel(label.id, { text: event.target.value })} /><Input type="number" value={label.x} onChange={(event) => updateLabel(label.id, { x: Number(event.target.value) || 0 })} /><Input type="number" value={label.y} onChange={(event) => updateLabel(label.id, { y: Number(event.target.value) || 0 })} /></div>)}</section>; }
function HotspotsPanel({ hotspots, addHotspot, updateHotspot }: { hotspots: PhysicsHotspot[]; addHotspot: () => void; updateHotspot: (id: string, patch: Partial<PhysicsHotspot>) => void }) { return <section className="rounded-2xl border p-3"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Hotspots</p><Button type="button" size="sm" variant="outline" onClick={addHotspot}><Plus className="mr-1 size-3" />Add</Button></div>{hotspots.map((hotspot) => <div key={hotspot.id} className="mb-2 rounded-xl border p-2"><Input value={hotspot.targetId || ''} onChange={(event) => updateHotspot(hotspot.id, { targetId: event.target.value })} placeholder="Target ID" /><div className="mt-2 grid grid-cols-4 gap-2"><Input type="number" value={hotspot.x} onChange={(event) => updateHotspot(hotspot.id, { x: Number(event.target.value) || 0 })} /><Input type="number" value={hotspot.y} onChange={(event) => updateHotspot(hotspot.id, { y: Number(event.target.value) || 0 })} /><Input type="number" value={hotspot.width} onChange={(event) => updateHotspot(hotspot.id, { width: Number(event.target.value) || 0 })} /><Input type="number" value={hotspot.height} onChange={(event) => updateHotspot(hotspot.id, { height: Number(event.target.value) || 0 })} /></div></div>)}</section>; }
function EquationsPanel({ equations, addEquation, updateEquation }: { equations: NonNullable<PhysicsVisual['equations']>; addEquation: () => void; updateEquation: (id: string, patch: Partial<NonNullable<PhysicsVisual['equations']>[number]>) => void }) { return <section className="rounded-2xl border p-3"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Equations</p><Button type="button" size="sm" variant="outline" onClick={addEquation}><Plus className="mr-1 size-3" />Add</Button></div>{equations.map((equation) => <div key={equation.id} className="mb-2 space-y-2 rounded-xl border p-2"><Input value={equation.latex} onChange={(event) => updateEquation(equation.id, { latex: event.target.value })} placeholder="LaTeX" /><Input value={equation.description || ''} onChange={(event) => updateEquation(equation.id, { description: event.target.value })} placeholder="Description" /></div>)}</section>; }
function StepsPanel({ steps, addStep, updateStep }: { steps: PhysicsTeachingStep[]; addStep: () => void; updateStep: (id: string, patch: Partial<PhysicsTeachingStep>) => void }) { return <section className="rounded-2xl border p-3"><div className="mb-3 flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-semibold"><ListChecks className="size-4 text-primary" />Teaching steps</p><Button type="button" size="sm" variant="outline" onClick={addStep}><Plus className="mr-1 size-3" />Add</Button></div><div className="space-y-2">{steps.map((step) => <div key={step.id} className="rounded-xl border bg-background p-2"><Input value={step.title} onChange={(event) => updateStep(step.id, { title: event.target.value })} /><Textarea className="mt-2 text-xs" rows={2} value={step.explanation} onChange={(event) => updateStep(step.id, { explanation: event.target.value })} /><Input className="mt-2" value={step.highlightObjectIds.join(', ')} onChange={(event) => updateStep(step.id, { highlightObjectIds: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="Highlight target IDs" /></div>)}</div></section>; }
function InteractionsPanel({ interactions, addInteraction, updateInteraction }: { interactions: PhysicsInteraction[]; addInteraction: () => void; updateInteraction: (id: string, patch: Partial<PhysicsInteraction>) => void }) { return <section className="rounded-2xl border p-3"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Questions / feedback</p><Button type="button" size="sm" variant="outline" onClick={addInteraction}><Plus className="mr-1 size-3" />Add</Button></div><div className="space-y-2">{interactions.map((interaction) => <div key={interaction.id} className="rounded-xl border bg-background p-2"><Input value={interaction.prompt} onChange={(event) => updateInteraction(interaction.id || '', { prompt: event.target.value })} /><div className="mt-2 grid gap-2 sm:grid-cols-2"><Input value={interaction.correctTargetId || ''} onChange={(event) => updateInteraction(interaction.id || '', { correctTargetId: event.target.value })} placeholder="Correct target ID" /><Input value={String(interaction.correctAnswer ?? '')} onChange={(event) => updateInteraction(interaction.id || '', { correctAnswer: event.target.value })} placeholder="Numeric/text answer" /></div><Textarea className="mt-2 text-xs" rows={2} value={interaction.feedback?.incorrect || ''} onChange={(event) => updateInteraction(interaction.id || '', { feedback: { ...interaction.feedback, incorrect: event.target.value } })} placeholder="Incorrect feedback" /></div>)}</div></section>; }
function resolveVisual(payload: LearningBlockPayload): PhysicsVisual { const visual = payload.visual; if (visual && typeof visual === 'object' && !Array.isArray(visual)) return visual as PhysicsVisual; const template = typeof payload.physicsTemplate === 'string' ? payload.physicsTemplate : 'free_body'; return cloneVisual(createScienceTemplateVisual(template)); }
