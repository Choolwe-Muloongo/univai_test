'use client';

import { useState } from 'react';
import type { BlockEditorProps, LearningBlockPayload } from '../schemas';
import { ChemistryVisualRenderer } from './ChemistryVisualRenderer';
import { chemistryTemplateIds, cloneChemistryVisual } from './defaults';
import type { ChemistryVisual } from './types';

const templateLabels: Record<string, string> = {
  equation_balancer: 'Equation balancer',
  stoichiometry: 'Stoichiometry',
  atom_structure: 'Atom structure',
  lab_observation: 'Lab observation',
};

export function ChemistryBlockEditor({ payload, onChange }: BlockEditorProps) {
  const visual = resolveVisual(payload);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(visual, null, 2));
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = typeof payload.chemistryTemplate === 'string' ? payload.chemistryTemplate : visual.template;

  function updatePayload(patch: Partial<LearningBlockPayload>) {
    onChange({ ...payload, ...patch, type: 'chemistry_visual' });
  }

  function applyTemplate(template: string) {
    const nextVisual = cloneChemistryVisual(template);
    setJsonText(JSON.stringify(nextVisual, null, 2));
    setError(null);
    updatePayload({ chemistryTemplate: template, visual: nextVisual });
  }

  function applyJson() {
    try {
      const parsed = JSON.parse(jsonText) as ChemistryVisual;
      if (!parsed || typeof parsed !== 'object') throw new Error('Chemistry visual must be an object.');
      if (parsed.subject !== 'chemistry') throw new Error('Chemistry visual subject must be chemistry.');
      if (!parsed.visualType) throw new Error('Chemistry visual must include visualType.');
      updatePayload({ visual: parsed, chemistryTemplate: parsed.template || selectedTemplate });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid chemistry JSON.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Title</span>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2"
            value={String(payload.title ?? '')}
            onChange={(event) => updatePayload({ title: event.target.value })}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Template</span>
          <select
            className="w-full rounded-xl border bg-background px-3 py-2"
            value={selectedTemplate}
            onChange={(event) => applyTemplate(event.target.value)}
          >
            {chemistryTemplateIds.map((template) => (
              <option key={template} value={template}>{templateLabels[template] ?? template.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="font-medium">Body</span>
        <textarea
          className="min-h-24 w-full rounded-xl border bg-background px-3 py-2"
          value={String(payload.body ?? '')}
          onChange={(event) => updatePayload({ body: event.target.value })}
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Structured Chemistry JSON</p>
          <textarea
            className="min-h-[420px] w-full rounded-xl border bg-background p-3 font-mono text-xs"
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
          />
          <button type="button" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={applyJson}>
            Apply JSON
          </button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Live preview</p>
          <ChemistryVisualRenderer visual={visual} mode="editor" />
        </div>
      </div>
    </div>
  );
}

function resolveVisual(payload: LearningBlockPayload): ChemistryVisual {
  const visual = payload.visual;
  if (visual && typeof visual === 'object' && !Array.isArray(visual)) return visual as ChemistryVisual;
  const template = typeof payload.chemistryTemplate === 'string' ? payload.chemistryTemplate : 'equation_balancer';
  return cloneChemistryVisual(template);
}
