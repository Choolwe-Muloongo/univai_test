import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const spreadsheetTypes = [
  'spreadsheet_activity', 'editable_table', 'formula_cell', 'sum_activity',
  'average_activity', 'min_max_activity', 'count_activity', 'if_formula_activity',
  'lookup_activity', 'vlookup_activity', 'xlookup_activity', 'index_match_activity',
  'pivot_table_activity', 'sort_filter_activity', 'data_cleaning_activity',
  'conditional_formatting_activity', 'chart_builder', 'bar_chart_activity',
  'line_chart_activity', 'pie_chart_activity', 'scatter_plot_activity',
  'dashboard_builder', 'budget_spreadsheet', 'sales_report_table',
  'invoice_spreadsheet', 'inventory_table', 'gradebook_table', 'payroll_table',
  'financial_model_table', 'loan_amortization_table', 'forecasting_table',
  'what_if_analysis', 'scenario_table', 'data_validation_activity',
  'spreadsheet_error_finder', 'formula_debugging', 'cell_reference_activity',
  'relative_absolute_reference', 'spreadsheet_shortcut_tip', 'excel_case_task',
];

export const spreadsheetBlockDefinitions = createBlockDefinitions(
  blockSpecs('spreadsheet', 'spreadsheet', spreadsheetTypes, 'Spreadsheet and table activity block'),
);
