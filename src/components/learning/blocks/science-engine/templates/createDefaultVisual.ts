import type { ScientificTemplateKey, ScientificVisual, ScientificVisualType } from '../types';

export function createDefaultScientificVisual(options: {
  id: string;
  subject: ScientificVisual['subject'];
  template: ScientificTemplateKey;
  visualType?: ScientificVisualType;
  physicsDomain?: ScientificVisual['physicsDomain'];
  engineeringDomain?: ScientificVisual['engineeringDomain'];
  discipline?: ScientificVisual['discipline'];
  title: string;
  objective: string;
}): ScientificVisual {
  return {
    id: options.id,
    subject: options.subject,
    template: options.template,
    visualType: options.visualType ?? 'diagram',
    renderMode: 'svg',
    physicsDomain: options.physicsDomain,
    engineeringDomain: options.engineeringDomain,
    discipline: options.discipline,
    level: 'undergraduate',
    canvas: { width: 900, height: 520, background: 'grid', unitScale: 'conceptual' },
    objects: [
      {
        id: 'main-system',
        type: 'rectangle',
        x: 320,
        y: 190,
        width: 260,
        height: 130,
        label: options.title,
        style: { fill: 'rgba(59,130,246,0.08)', stroke: 'currentColor', strokeWidth: 2 },
        accessibilityLabel: options.title,
      },
    ],
    labels: [
      { id: 'objective-label', text: options.objective, x: 40, y: 60, role: 'objective' },
    ],
    arrows: [],
    hotspots: [
      { id: 'main-hotspot', x: 320, y: 190, width: 260, height: 130, targetId: 'main-system', label: options.title, feedback: options.objective },
    ],
    steps: [
      {
        id: 'observe-system',
        title: 'Observe the system',
        explanation: options.objective,
        highlightObjectIds: ['main-system'],
      },
    ],
    interactions: [
      {
        id: 'identify-main-system',
        type: 'click_hotspot',
        prompt: `Select the main ${options.title.toLowerCase()} region.`,
        correctTargetId: 'main-system',
        feedback: { correct: 'Correct. You identified the main system.', incorrect: 'Look for the labelled main system area.' },
      },
    ],
    equations: [],
    parameters: [],
    assumptions: [{ id: 'conceptual-model', text: 'This first template is a conceptual visual and can be upgraded with precise parameters.', required: false }],
    boundaryConditions: [],
    validationRules: [],
    metadata: { title: options.title, objective: options.objective },
  };
}
