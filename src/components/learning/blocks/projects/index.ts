import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const projectTypes = [
  'project_intro', 'project_step', 'project_stage', 'project_checklist', 'milestone',
  'build_task', 'mini_project', 'portfolio_item', 'project_reflection', 'rubric_check',
  'stage_complete', 'project_preview', 'project_validation', 'project_score',
  'project_hint', 'project_unlock', 'project_required_gate', 'final_project_stage',
  'project_showcase', 'project_export',
];

export const projectBlockDefinitions = createBlockDefinitions(
  blockSpecs('projects', 'projects', projectTypes, 'Project builder and portfolio block'),
);
