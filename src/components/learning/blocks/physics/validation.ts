import type { PhysicsVisual } from './types';

export type PhysicsValidationIssue = {
  severity: 'error' | 'warning';
  message: string;
};

export function validatePhysicsVisual(visual: PhysicsVisual): PhysicsValidationIssue[] {
  const issues: PhysicsValidationIssue[] = [];
  const objectIds = new Set((visual.objects ?? []).map((object) => object.id));
  const arrowIds = new Set((visual.arrows ?? []).map((arrow) => arrow.id));
  const knownIds = new Set([...objectIds, ...arrowIds, ...(visual.hotspots ?? []).map((hotspot) => hotspot.id)]);

  if (!visual.canvas || !visual.canvas.width || !visual.canvas.height) {
    issues.push({ severity: 'error', message: 'Canvas width and height are required.' });
  }

  if (!Array.isArray(visual.objects) || visual.objects.length === 0) {
    issues.push({ severity: 'warning', message: 'Add at least one physics object to the visual.' });
  }

  (visual.steps ?? []).forEach((step) => {
    step.highlightObjectIds.forEach((id) => {
      if (!knownIds.has(id)) issues.push({ severity: 'warning', message: `Step "${step.title}" highlights missing target "${id}".` });
    });
  });

  (visual.interactions ?? []).forEach((interaction) => {
    if (!interaction.correctTargetId && interaction.correctAnswer === undefined) {
      issues.push({ severity: 'error', message: `Interaction "${interaction.prompt}" needs a correctTargetId or correctAnswer.` });
    }
    if (interaction.correctTargetId && !knownIds.has(interaction.correctTargetId)) {
      issues.push({ severity: 'error', message: `Interaction target "${interaction.correctTargetId}" does not exist.` });
    }
  });

  if (visual.template === 'collision') {
    const collisionObjects = (visual.objects ?? []).filter((object) => object.type === 'collision_object');
    if (collisionObjects.length < 2) issues.push({ severity: 'error', message: 'Collision visuals need at least two collision objects.' });
    collisionObjects.forEach((object) => {
      if (object.physics?.massKg === undefined && object.physics?.mass === undefined) issues.push({ severity: 'error', message: `${object.label || object.id} needs massKg.` });
      if (object.physics?.initialVelocity === undefined) issues.push({ severity: 'warning', message: `${object.label || object.id} should include initialVelocity.` });
      if (object.physics?.finalVelocity === undefined && object.physics?.velocityAfter === undefined) issues.push({ severity: 'warning', message: `${object.label || object.id} should include finalVelocity.` });
    });
  }

  if (visual.template === 'kinematics_graph') {
    const hasAxisLabels = (visual.labels ?? []).some((label) => /velocity|time|axis|gradient|area/i.test(label.text));
    if (!hasAxisLabels) issues.push({ severity: 'warning', message: 'Graph visuals should include axis labels and units.' });
  }

  if (visual.template === 'circuit') {
    const components = (visual.objects ?? []).filter((object) => object.type === 'circuit_component' || object.type === 'circle');
    if (components.length < 2) issues.push({ severity: 'warning', message: 'Circuit visuals should include multiple connected components.' });
  }

  return issues;
}
