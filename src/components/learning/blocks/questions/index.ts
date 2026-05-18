import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const questionTypes = [
  'mini_quiz', 'timed_quiz', 'checkpoint_test', 'section_test', 'module_test',
  'diagnostic_test', 'placement_test', 'pre_test', 'post_test', 'mock_exam',
  'past_paper_question', 'case_assessment', 'scenario_assessment', 'rubric_assessment',
  'oral_assessment_prompt', 'peer_review_prompt', 'self_assessment',
  'teacher_marked_question', 'auto_marked_question', 'adaptive_question',
  'difficulty_scaled_question', 'randomized_question', 'question_bank_draw',
  'exam_unlock_question', 'certificate_requirement_question', 'exam_section_intro',
  'exam_timer_block', 'exam_review_block', 'exam_result_block', 'retake_prompt',
];

export const questionBlockDefinitions = createBlockDefinitions(
  blockSpecs('questions', 'questions', questionTypes, 'Assessment and practice block'),
);
