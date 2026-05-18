import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const businessTypes = [
  'business_model_canvas', 'swot_analysis', 'pestle_analysis', 'market_segmentation',
  'customer_persona_builder', 'value_proposition_builder', 'pricing_strategy_activity',
  'break_even_activity', 'marketing_plan_builder', 'sales_funnel_activity',
  'pitch_deck_builder', 'competitor_analysis', 'business_case_study', 'decision_matrix',
  'risk_matrix', 'budget_planning', 'operations_flowchart', 'business_process_mapping',
  'customer_journey_map', 'brand_positioning_activity', 'mission_vision_builder',
  'startup_cost_calculator', 'revenue_model_builder', 'cash_flow_planning',
  'sales_script_builder', 'negotiation_scenario', 'customer_service_scenario',
  'hr_policy_activity', 'recruitment_plan_builder', 'performance_review_activity',
  'business_pitch_activity', 'business_plan_section',
];

export const businessBlockDefinitions = createBlockDefinitions(
  blockSpecs('business', 'business', businessTypes, 'Business and entrepreneurship block'),
);
