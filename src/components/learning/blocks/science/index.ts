import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const scienceTypes = [
  'lab_simulation', 'experiment_steps', 'hypothesis_builder', 'observation_table',
  'results_table', 'scientific_method_activity', 'chemical_equation_balancer',
  'periodic_table_activity', 'molecule_builder', 'atom_structure_activity',
  'reaction_type_activity', 'circuit_diagram', 'force_diagram', 'energy_calculation',
  'motion_graph_activity', 'wave_diagram', 'optics_diagram', 'biology_label_diagram',
  'body_system_labeling', 'cell_labeling', 'genetics_cross_activity',
  'classification_tree', 'food_chain_activity', 'ecosystem_activity',
  'climate_data_activity', 'lab_safety_check', 'scientific_graph_builder',
  'experiment_error_analysis',
];

export const scienceBlockDefinitions = createBlockDefinitions(
  blockSpecs('science', 'science', scienceTypes, 'Science experiment, diagram, and simulation block'),
);
