import type { ScientificTemplateDefinition } from '../types';
import { fluidsHydraulicsTemplates } from './physics/fluidsHydraulics';
import { civilEngineeringTemplates } from './engineering/civil';

export const scientificTemplateCatalog: ScientificTemplateDefinition[] = [
  ...fluidsHydraulicsTemplates,
  ...civilEngineeringTemplates,
];

export function getScientificTemplate(key: string) {
  return scientificTemplateCatalog.find((template) => template.key === key) ?? null;
}

export function listScientificTemplates(filters?: { subject?: string; domain?: string; discipline?: string }) {
  return scientificTemplateCatalog.filter((template) => {
    if (filters?.subject && template.subject !== filters.subject) return false;
    if (filters?.domain && template.domain !== filters.domain) return false;
    if (filters?.discipline && template.discipline !== filters.discipline) return false;
    return true;
  });
}
