export type AnswerChecker =
  | 'exact'
  | 'numeric_tolerance'
  | 'unit_aware'
  | 'symbolic_equivalence'
  | 'vector_equivalence'
  | 'graph_feature'
  | 'diagram_target'
  | 'sequence_order'
  | 'design_rubric'
  | 'multi_step_working';

export type MistakePattern = {
  id: string;
  condition: string;
  feedback: string;
  remediationStep: string;
  relatedConcept: string;
};

export const coreScienceMistakePatterns: MistakePattern[] = [
  {
    id: 'wrong_unit',
    condition: 'submitted unit is not compatible with expected unit',
    feedback: 'Your number may be close, but the unit does not match the physical quantity.',
    remediationStep: 'Check the required unit before substituting values.',
    relatedConcept: 'unit analysis',
  },
  {
    id: 'wrong_sign',
    condition: 'answer has correct magnitude but wrong direction or sign',
    feedback: 'The size looks right, but the direction/sign is wrong.',
    remediationStep: 'Define a positive direction before solving.',
    relatedConcept: 'vectors',
  },
  {
    id: 'gradient_instead_of_area',
    condition: 'student used slope where area under graph is required',
    feedback: 'This graph question needs area, not gradient.',
    remediationStep: 'Ask what the y-axis multiplied by the x-axis represents.',
    relatedConcept: 'graph interpretation',
  },
];
