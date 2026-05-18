import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const webTypes = [
  'html_preview', 'html_structure_activity', 'html_tag_match', 'html_attribute_activity',
  'semantic_html_activity', 'form_builder_activity', 'css_selector_activity',
  'css_box_model', 'css_specificity_activity', 'flexbox_activity', 'grid_layout_activity',
  'responsive_design_activity', 'media_query_activity', 'color_palette_activity',
  'typography_activity', 'ui_component_builder', 'dom_manipulation_activity',
  'event_listener_activity', 'javascript_console_task', 'form_validation_activity',
  'fetch_api_activity', 'local_storage_activity', 'component_builder',
  'props_state_activity', 'route_builder', 'database_crud_activity',
  'api_integration_activity', 'auth_flow_activity', 'session_cookie_activity',
  'file_upload_activity', 'ui_clone_activity', 'landing_page_builder',
  'portfolio_section_builder', 'navbar_builder', 'card_layout_builder',
  'dashboard_layout_builder', 'responsive_preview', 'accessibility_check_web',
  'seo_basics_activity',
];

export const webBlockDefinitions = createBlockDefinitions(
  blockSpecs('web', 'web', webTypes, 'Web development interactive block'),
);
