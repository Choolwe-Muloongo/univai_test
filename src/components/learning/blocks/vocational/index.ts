import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const vocationalTypes = [
  'circuit_builder', 'component_matching', 'component_labeling', 'arduino_code_activity',
  'sensor_data_table', 'robot_motion_simulation', 'logic_flow_builder', 'wiring_diagram',
  'mechanical_part_labeling', 'control_system_activity', 'signal_flow_diagram',
  'motor_control_activity', 'servo_angle_activity', 'resistor_color_code',
  'ohms_law_activity', 'breadboard_activity', 'input_output_mapping',
  'robot_path_planning', 'engineering_design_process', 'typography_pairing',
  'layout_builder', 'wireframe_activity', 'ui_critique', 'ux_flow_builder',
  'logo_concept_builder', 'brand_identity_builder', 'moodboard_builder',
  'storyboard_builder', 'content_calendar', 'social_post_builder',
  'photo_composition_activity', 'video_sequence_ordering', 'thumbnail_design_activity',
  'ad_copy_activity', 'poster_layout_activity', 'design_principle_match',
  'accessibility_check', 'contrast_checker',
];

export const vocationalBlockDefinitions = createBlockDefinitions(
  blockSpecs('vocational', 'vocational', vocationalTypes, 'Vocational, engineering, and design block'),
);
