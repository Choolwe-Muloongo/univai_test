import { clonePhysicsVisual, type PhysicsTemplateKey } from '../../physics/defaults';
import type { PhysicsVisual } from '../../physics/types';
import { scientificTemplateCatalog } from './catalog';

export type ScienceBuilderTemplateOption = {
  key: string;
  label: string;
  cardType: string;
  help: string;
  subject: 'physics' | 'engineering';
  domain: string;
  discipline?: string;
  source: 'legacy_physics' | 'science_catalog';
  createVisual: () => PhysicsVisual;
};

const legacyPhysicsTemplates: ScienceBuilderTemplateOption[] = [
  { key: 'free_body', label: 'Free-body', cardType: 'free_body_diagram_card', help: 'Forces on an object', subject: 'physics', domain: 'mechanics', source: 'legacy_physics', createVisual: () => clonePhysicsVisual('free_body') },
  { key: 'pulley', label: 'Pulley', cardType: 'pulley_system_card', help: 'Tension and weights', subject: 'physics', domain: 'mechanics', source: 'legacy_physics', createVisual: () => clonePhysicsVisual('pulley') },
  { key: 'collision', label: 'Collision', cardType: 'collision_simulation_card', help: 'Momentum lab', subject: 'physics', domain: 'mechanics', source: 'legacy_physics', createVisual: () => clonePhysicsVisual('collision') },
  { key: 'wave', label: 'Wave', cardType: 'wave_diagram_card', help: 'Amplitude and wavelength', subject: 'physics', domain: 'waves', source: 'legacy_physics', createVisual: () => clonePhysicsVisual('wave') },
  { key: 'kinematics_graph', label: 'Kinematics graph', cardType: 'kinematics_graph_card', help: 'Gradient and area', subject: 'physics', domain: 'mechanics', source: 'legacy_physics', createVisual: () => clonePhysicsVisual('kinematics_graph') },
  { key: 'circuit', label: 'Circuit', cardType: 'circuit_diagram_card', help: 'Current and voltage', subject: 'physics', domain: 'electromagnetism', source: 'legacy_physics', createVisual: () => clonePhysicsVisual('circuit') },
  { key: 'ray_diagram', label: 'Optics', cardType: 'ray_diagram_card', help: 'Lens and ray diagrams', subject: 'physics', domain: 'optics', source: 'legacy_physics', createVisual: () => clonePhysicsVisual('ray_diagram') },
];

const catalogTemplates: ScienceBuilderTemplateOption[] = scientificTemplateCatalog.map((template) => ({
  key: String(template.key),
  label: template.label,
  cardType: template.cardType,
  help: template.description,
  subject: template.subject,
  domain: String(template.domain),
  discipline: template.discipline,
  source: 'science_catalog',
  createVisual: () => template.defaultVisual as unknown as PhysicsVisual,
}));

export const scienceBuilderTemplateOptions: ScienceBuilderTemplateOption[] = [
  ...legacyPhysicsTemplates,
  ...catalogTemplates.filter((template) => !legacyPhysicsTemplates.some((legacy) => legacy.key === template.key)),
];

export function getScienceBuilderTemplateOption(key: string) {
  return scienceBuilderTemplateOptions.find((template) => template.key === key) ?? scienceBuilderTemplateOptions[0];
}

export function listScienceBuilderSubjects() {
  return Array.from(new Set(scienceBuilderTemplateOptions.map((template) => template.subject)));
}

export function listScienceBuilderDomains(subject?: string) {
  return Array.from(new Set(scienceBuilderTemplateOptions.filter((template) => !subject || template.subject === subject).map((template) => template.domain))).sort();
}

export function filterScienceBuilderTemplates(filters?: { subject?: string; domain?: string }) {
  return scienceBuilderTemplateOptions.filter((template) => {
    if (filters?.subject && template.subject !== filters.subject) return false;
    if (filters?.domain && template.domain !== filters.domain) return false;
    return true;
  });
}

export function createScienceTemplateVisual(key: string) {
  return getScienceBuilderTemplateOption(key).createVisual();
}

export function isLegacyPhysicsTemplate(key: string): key is PhysicsTemplateKey {
  return legacyPhysicsTemplates.some((template) => template.key === key);
}
