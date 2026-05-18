import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const teachingTypes = [
  'explanation', 'example', 'summary', 'definition', 'key_point', 'note', 'tip', 'warning',
  'important_notice', 'concept_card', 'fact_card', 'story_card', 'scenario', 'case_study',
  'real_world_example', 'analogy', 'myth_vs_fact', 'common_mistake', 'best_practice',
  'quick_revision', 'recap', 'lesson_intro', 'lesson_objectives', 'lesson_outcomes',
  'lesson_checkpoint', 'lesson_wrap_up', 'prerequisite_reminder', 'background_context',
  'historical_context', 'industry_context', 'step_by_step', 'process_explanation',
  'workflow_explanation', 'comparison', 'pros_and_cons', 'cause_and_effect',
  'problem_solution', 'timeline', 'checklist', 'do_and_dont', 'teacher_note', 'learner_note',
];

const classroomBoardTypes = [
  'board_intro', 'board_problem', 'board_step', 'board_explanation', 'board_reveal',
  'board_highlight', 'board_annotation', 'board_question', 'board_missing_step',
  'board_side_note', 'board_common_error', 'board_final_answer', 'board_summary',
  'equation_board', 'algebra_step_board', 'proof_step_board', 'calculus_step_board',
  'geometry_step_board', 'formula_substitution_board', 'missing_math_step',
  'reveal_solution_step', 'compare_two_methods', 'mistake_correction_step',
  'transaction_board', 'account_identification_step', 'debit_credit_reasoning_step',
  'journal_entry_step', 'ledger_posting_step', 't_account_step', 'trial_balance_step',
  'financial_statement_step', 'accounting_error_step', 'accounting_final_explanation',
  'code_explanation_step', 'code_trace_step', 'output_prediction_step', 'bug_fix_step',
  'test_case_step', 'code_reveal_step',
];

export const teachingBlockDefinitions = [
  ...createBlockDefinitions(blockSpecs('teaching', 'teaching', teachingTypes, 'General teaching card')),
  ...createBlockDefinitions(blockSpecs('classroom_board', 'classroom_board', classroomBoardTypes, 'Classroom board step')),
];
