import type { ScientificTemplateDefinition } from '../../types';
import { createDefaultScientificVisual } from '../createDefaultVisual';

export const civilEngineeringTemplates: ScientificTemplateDefinition[] = [
  {
    key: 'beam_load',
    label: 'Beam Load',
    subject: 'engineering',
    domain: 'structures',
    discipline: 'civil',
    level: 'undergraduate',
    renderer: 'EngineeringSvgRenderer',
    cardType: 'beam_reaction_card',
    description: 'Teach supports, loads, reactions, and equilibrium on beams.',
    defaultVisual: createDefaultScientificVisual({ id: 'beam-load-template', subject: 'engineering', discipline: 'civil', engineeringDomain: 'structures', template: 'beam_load', title: 'Beam load', objective: 'Identify loads, supports, and reaction forces on a structural beam.' }),
    requiredParameters: [
      { id: 'span', symbol: 'L', label: 'Beam span', unit: 'm' },
      { id: 'load', symbol: 'W', label: 'Applied load', unit: 'N' }
    ],
    commonMistakes: ['wrong_sign', 'wrong_moment_arm', 'ignored_support_reaction'],
    recommendedInteractions: ['draw_vector', 'calculate_from_diagram', 'multi_step_solution']
  },
  {
    key: 'truss_analysis',
    label: 'Truss Analysis',
    subject: 'engineering',
    domain: 'structures',
    discipline: 'civil',
    level: 'advanced_undergraduate',
    renderer: 'EngineeringSvgRenderer',
    cardType: 'truss_member_force_card',
    description: 'Teach joints, members, compression, tension, and load paths.',
    defaultVisual: createDefaultScientificVisual({ id: 'truss-template', subject: 'engineering', discipline: 'civil', engineeringDomain: 'structures', template: 'truss_analysis', title: 'Truss analysis', objective: 'Trace how loads move through truss members.' }),
    requiredParameters: [
      { id: 'joint-load', symbol: 'P', label: 'Joint load', unit: 'N' }
    ],
    commonMistakes: ['wrong_sign', 'ignored_direction'],
    recommendedInteractions: ['select_arrow', 'draw_vector', 'multi_step_solution']
  }
];
