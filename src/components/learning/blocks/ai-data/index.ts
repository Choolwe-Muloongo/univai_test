import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const aiDataTypes = [
  'dataset_card', 'data_cleaning_step', 'data_labeling_activity', 'feature_selection_activity',
  'model_training_step', 'model_evaluation_step', 'confusion_matrix_activity',
  'precision_recall_activity', 'prompt_engineering_activity', 'ai_ethics_scenario',
  'bias_detection_activity', 'classification_activity', 'regression_activity',
  'clustering_activity', 'data_story', 'dashboard_insight_card', 'chart_interpretation',
  'sql_result_interpretation', 'ai_workflow_builder', 'automation_decision_card',
];

export const aiDataBlockDefinitions = createBlockDefinitions(
  blockSpecs('ai-data', 'ai-data', aiDataTypes, 'AI and data analytics learning block'),
);
