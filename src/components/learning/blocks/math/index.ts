import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const mathTypes = [
  'equation', 'formula', 'formula_sheet', 'worked_example', 'step_solution', 'missing_step',
  'proof_step', 'algebra_solver_step', 'factorization_activity', 'simplification_activity',
  'expansion_activity', 'equation_balancing', 'simultaneous_equation_activity',
  'quadratic_activity', 'function_plot', 'graph', 'graph_interpretation',
  'coordinate_plane', 'number_line', 'fraction_input', 'decimal_input',
  'percentage_activity', 'ratio_activity', 'proportion_activity', 'unit_conversion',
  'scientific_notation', 'matrix', 'determinant_activity', 'vector_activity',
  'trigonometry_activity', 'geometry_diagram', 'angle_finder', 'triangle_solver',
  'circle_activity', 'area_calculation', 'volume_calculation', 'calculus_limit',
  'derivative_activity', 'integration_activity', 'sequence_activity', 'series_activity',
  'statistics_table', 'mean_median_mode', 'standard_deviation_activity',
  'probability_tree', 'venn_diagram', 'set_notation_activity', 'truth_table',
  'logic_expression', 'logic_gate', 'math_error_correction', 'math_method_comparison',
  'formula_substitution', 'symbol_matching', 'math_word_problem',
];

export const mathBlockDefinitions = createBlockDefinitions(
  blockSpecs('math', 'math', mathTypes, 'Mathematics teaching and practice block'),
);
