import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const graphingTypes = [
  'graph_intro', 'graph_equation_setup', 'graph_table_of_values', 'graph_point_plotter',
  'graph_axis_setup', 'graph_intercept_finder', 'graph_gradient_explainer',
  'graph_curve_explainer', 'graph_turning_point_explainer', 'graph_asymptote_explainer',
  'graph_domain_range_explainer', 'graph_transformation_step', 'graph_final_plot',
  'graph_interpretation_question', 'linear_graph_builder', 'quadratic_graph_builder',
  'exponential_graph_builder', 'logarithmic_graph_builder', 'trigonometric_graph_builder',
  'piecewise_graph_builder', 'inequality_graph_builder', 'scatter_plot_builder',
  'line_of_best_fit', 'graph_matching_activity', 'graph_error_finder',
  'graph_prediction_activity', 'graph_labeling_activity',
];

export const graphingBlockDefinitions = createBlockDefinitions(
  blockSpecs('graphing', 'graphing', graphingTypes, 'Graphing classroom process block'),
);
