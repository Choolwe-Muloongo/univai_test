import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const codingTypes = [
  'code_snippet', 'code_activity', 'code_output_prediction', 'debug_code', 'fix_the_bug',
  'fill_missing_code', 'complete_function', 'complete_class', 'complete_loop',
  'complete_condition', 'reorder_code', 'code_multiple_choice', 'code_trace',
  'code_explanation', 'code_review', 'unit_test_activity', 'function_test',
  'input_output_test', 'algorithm_challenge', 'pseudocode_activity', 'flowchart_to_code',
  'code_to_flowchart', 'terminal_command_activity', 'regex_activity', 'json_editor',
  'yaml_editor', 'markdown_editor', 'api_request_builder', 'sql_query_activity',
  'database_table_activity', 'database_schema_builder', 'crud_activity',
  'auth_logic_activity', 'error_message_interpretation', 'refactor_code',
  'optimize_code', 'security_code_review', 'code_explanation_step', 'code_trace_step',
  'output_prediction_step', 'bug_fix_step', 'test_case_step', 'code_reveal_step',
];

export const codingBlockDefinitions = createBlockDefinitions(
  blockSpecs('coding', 'coding', codingTypes, 'Programming lab block'),
);
