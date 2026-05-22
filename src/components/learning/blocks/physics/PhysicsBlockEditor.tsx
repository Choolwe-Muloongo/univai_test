'use client';

import { useMemo, useState } from 'react';
import { FileJson, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { BlockEditorProps, LearningBlockPayload } from '../schemas';
import { clonePhysicsVisual } from './defaults';
import { PhysicsVisualRenderer } from './PhysicsVisualRenderer';
import type { PhysicsVisual } from './types';

export function PhysicsBlockEditor({ payload, onChange }: BlockEditorProps) {
  const visual = useMemo(() => resolveVisual(payload), [payload]);
  const [json, setJson] = useState(() => JSON.stringify(visual, null, 2));

  function applyTemplate(template: 'free_body' | 'pulley' | 'collision') {
    const nextVisual = clonePhysicsVisual(template);
    setJson(JSON.stringify(nextVisual, null, 2));
    onChange({
      ...payload,
      type: 'physics_visual',
      physicsTemplate: template,
      physicsCardType: template === 'pulley' ? 'pulley_system_card' : template === 'collision' ? 'collision_simulation_card' : 'free_body_diagram_card',
      visual: nextVisual,
    });
  }

  function applyJson() {
    try {
      const nextVisual = JSON.parse(json) as PhysicsVisual;
      onChange({ ...payload, type: 'physics_visual', visual: nextVisual });
    } catch {
      // Keep editing local JSON. The builder can show validation later.
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border p-4">
      <div>
        <p className="font-semibold">Physics Visual Learning Engine</p>
        <p className="text-sm text-muted-foreground">Pick a template or paste full PhysicsVisual JSON. The same renderer is used in preview and student lessons.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => applyTemplate('free_body')}><Sparkles className="mr-2 size-4" />Free-body</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => applyTemplate('pulley')}><Sparkles className="mr-2 size-4" />Pulley</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => applyTemplate('collision')}><Sparkles className="mr-2 size-4" />Collision</Button>
      </div>
      <PhysicsVisualRenderer visual={visual} mode="builder" />
      <div className="space-y-2">
        <p className="text-sm font-semibold">Physics visual JSON</p>
        <Textarea value={json} onChange={(event) => setJson(event.target.value)} rows={14} spellCheck={false} className="font-mono text-xs" />
        <Button type="button" size="sm" onClick={applyJson}><FileJson className="mr-2 size-4" />Apply physics JSON</Button>
      </div>
    </div>
  );
}

function resolveVisual(payload: LearningBlockPayload): PhysicsVisual {
  const visual = payload.visual;
  if (visual && typeof visual === 'object' && !Array.isArray(visual)) return visual as PhysicsVisual;
  const template = typeof payload.physicsTemplate === 'string' ? payload.physicsTemplate : 'free_body';
  if (template === 'pulley') return clonePhysicsVisual('pulley');
  if (template === 'collision') return clonePhysicsVisual('collision');
  return clonePhysicsVisual('free_body');
}
