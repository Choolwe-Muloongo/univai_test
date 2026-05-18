import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const certificateTypes = [
  'certificate_checkpoint', 'required_activity', 'optional_activity',
  'exam_unlock_requirement', 'project_required', 'practice_required',
  'completion_gate', 'access_locked_card', 'premium_activity',
  'certificate_fee_notice', 'exam_ready_card', 'certificate_ready_card',
  'course_completion_card', 'admin_warning', 'grading_rubric', 'learning_outcome',
  'prerequisite_card', 'course_rule', 'assessment_instruction',
  'submission_instruction', 'review_note', 'publish_warning', 'quality_check',
  'content_gap_warning', 'difficulty_warning', 'accessibility_note',
];

export const certificateBlockDefinitions = createBlockDefinitions(
  blockSpecs('certificate', 'certificate', certificateTypes, 'Certificate, access, and publishing requirement block'),
);
