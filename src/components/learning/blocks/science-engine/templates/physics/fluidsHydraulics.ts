import type { ScientificTemplateDefinition } from '../../types';
import { createDefaultScientificVisual } from '../createDefaultVisual';

export const fluidsHydraulicsTemplates: ScientificTemplateDefinition[] = [
  {
    key: 'fluid_pressure',
    label: 'Fluid Pressure',
    subject: 'physics',
    domain: 'fluids',
    level: 'first_year_university',
    renderer: 'FluidFlowRenderer',
    cardType: 'fluid_pressure_card',
    description: 'Visual card for density, depth, and pressure relationships.',
    defaultVisual: createDefaultScientificVisual({ id: 'fluid-pressure-template', subject: 'physics', physicsDomain: 'fluids', template: 'fluid_pressure', title: 'Fluid pressure', objective: 'Explore how liquid depth and density affect pressure.' }),
    requiredParameters: [
      { id: 'density', symbol: 'rho', label: 'Fluid density', unit: 'kg/m3' },
      { id: 'depth', symbol: 'h', label: 'Depth', unit: 'm' }
    ],
    commonMistakes: ['wrong_unit', 'forgot_density_in_pressure'],
    recommendedInteractions: ['calculate_pressure', 'enter_numeric_answer']
  },
  {
    key: 'bernoulli_flow',
    label: 'Bernoulli Flow',
    subject: 'physics',
    domain: 'fluids',
    level: 'advanced_undergraduate',
    renderer: 'FluidFlowRenderer',
    cardType: 'bernoulli_flow_card',
    description: 'Visual card for pressure, speed, and height along a streamline.',
    defaultVisual: createDefaultScientificVisual({ id: 'bernoulli-template', subject: 'physics', physicsDomain: 'fluids', template: 'bernoulli_flow', title: 'Bernoulli flow', objective: 'Compare pressure, velocity, and height along a pipe.' }),
    requiredParameters: [
      { id: 'pressure', symbol: 'P', label: 'Pressure', unit: 'Pa' },
      { id: 'velocity', symbol: 'v', label: 'Flow speed', unit: 'm/s' }
    ],
    commonMistakes: ['wrong_unit', 'confused_pressure_with_force'],
    recommendedInteractions: ['calculate_pressure', 'read_graph_value']
  }
];
