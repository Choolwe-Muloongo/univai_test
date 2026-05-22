export type PhysicsCardType =
  | 'concept_card'
  | 'formula_card'
  | 'worked_example_card'
  | 'interactive_diagram_card'
  | 'free_body_diagram_card'
  | 'pulley_system_card'
  | 'kinematics_graph_card'
  | 'projectile_motion_card'
  | 'vector_diagram_card'
  | 'inclined_plane_card'
  | 'moments_lever_card'
  | 'circuit_diagram_card'
  | 'ray_diagram_card'
  | 'wave_diagram_card'
  | 'spring_hooke_law_card'
  | 'thermal_process_card'
  | 'lab_experiment_card'
  | 'simulation_card'
  | 'collision_simulation_card'
  | 'momentum_conservation_card'
  | 'elastic_collision_card'
  | 'inelastic_collision_card'
  | 'perfectly_inelastic_collision_card'
  | 'explosion_separation_card'
  | 'impulse_collision_card'
  | 'collision_graph_card'
  | 'collision_vector_diagram_card'
  | 'exam_question_card'
  | 'mistake_correction_card';

export type PhysicsVisualType = 'diagram' | 'graph' | 'simulation' | 'annotated_image' | 'lab_setup';

export type PhysicsTemplate =
  | 'free_body'
  | 'pulley'
  | 'kinematics_graph'
  | 'circuit'
  | 'ray_diagram'
  | 'wave'
  | 'projectile'
  | 'inclined_plane'
  | 'moments'
  | 'spring'
  | 'collision'
  | 'custom';

export type PhysicsObject = {
  id: string;
  type:
    | 'rectangle'
    | 'circle'
    | 'triangle'
    | 'pulley'
    | 'mass'
    | 'rope'
    | 'surface'
    | 'inclined_plane'
    | 'spring'
    | 'lens'
    | 'mirror'
    | 'ray'
    | 'circuit_component'
    | 'wave'
    | 'graph'
    | 'collision_object'
    | 'image'
    | 'custom_svg';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  label?: string;
  componentType?: string;
  path?: string;
  points?: Array<[number, number]>;
  style?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
  physics?: Record<string, unknown>;
  interactive?: boolean;
  accessibilityLabel?: string;
};

export type PhysicsArrow = {
  id: string;
  type: 'force' | 'velocity' | 'acceleration' | 'displacement' | 'ray' | 'field' | 'normal' | 'momentum' | 'impulse';
  from: { x: number; y: number };
  to: { x: number; y: number };
  label?: string;
  magnitude?: number;
  unit?: string;
  direction?: number;
  dashed?: boolean;
  colorRole?: 'force' | 'velocity' | 'acceleration' | 'tension' | 'weight' | 'normal' | 'friction' | 'momentum' | 'impulse' | 'ray';
  isInteractive?: boolean;
};

export type PhysicsLabel = {
  id: string;
  text: string;
  x: number;
  y: number;
  targetId?: string;
  role?: string;
};

export type PhysicsHotspot = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetId?: string;
  label?: string;
  feedback?: string;
};

export type PhysicsInteraction = {
  id?: string;
  type:
    | 'click_hotspot'
    | 'select_arrow'
    | 'drag_label'
    | 'drag_vector'
    | 'draw_vector'
    | 'match_force_to_object'
    | 'complete_graph'
    | 'read_graph_value'
    | 'calculate_from_diagram'
    | 'choose_correct_diagram'
    | 'sequence_steps'
    | 'balance_forces'
    | 'fill_formula'
    | 'enter_numeric_answer'
    | 'multi_step_solution'
    | 'calculate_initial_momentum'
    | 'calculate_final_momentum'
    | 'compare_momentum_before_after'
    | 'calculate_kinetic_energy_before'
    | 'calculate_kinetic_energy_after'
    | 'identify_collision_type'
    | 'calculate_unknown_velocity'
    | 'calculate_impulse'
    | 'read_force_time_graph'
    | 'draw_velocity_vector_after_collision'
    | 'choose_correct_after_collision_diagram';
  prompt: string;
  correctTargetId?: string;
  correctAnswer?: string | number | boolean;
  unit?: string;
  tolerance?: number;
  feedback?: {
    correct?: string;
    incorrect?: string;
  };
  hints?: string[];
  solutionSteps?: string[];
};

export type PhysicsTeachingStep = {
  id: string;
  title: string;
  explanation: string;
  highlightObjectIds: string[];
  hideObjectIds?: string[];
  showObjectIds?: string[];
  focusBox?: { x: number; y: number; width: number; height: number };
  equation?: string;
  narration?: string;
  checkpointQuestion?: PhysicsInteraction;
};

export type PhysicsVisual = {
  id: string;
  subject: 'physics';
  visualType: PhysicsVisualType;
  template: PhysicsTemplate;
  renderMode: 'svg' | 'canvas' | 'html_svg' | 'image_overlay';
  canvas: {
    width: number;
    height: number;
    background: 'plain' | 'grid' | 'graph_paper' | 'lab' | 'transparent';
    unitScale?: string;
  };
  objects: PhysicsObject[];
  labels?: PhysicsLabel[];
  arrows?: PhysicsArrow[];
  hotspots?: PhysicsHotspot[];
  steps?: PhysicsTeachingStep[];
  interactions?: PhysicsInteraction[];
  equations?: Array<{ id: string; latex: string; description?: string }>;
  metadata?: Record<string, unknown>;
};
