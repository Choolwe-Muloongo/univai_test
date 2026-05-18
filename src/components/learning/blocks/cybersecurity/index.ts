import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const cybersecurityTypes = [
  'phishing_detection', 'password_strength_checker', 'security_scenario',
  'threat_classification', 'attack_defense_matching', 'network_diagram',
  'port_matching', 'protocol_matching', 'encryption_activity', 'hashing_activity',
  'secure_password_activity', 'incident_response_scenario', 'risk_assessment_matrix',
  'vulnerability_classification', 'secure_code_review', 'access_control_activity',
  'permission_matching', 'social_engineering_scenario', 'malware_classification',
  'security_policy_review', 'firewall_rule_activity', 'log_analysis_activity',
  'authentication_flow_activity', 'authorization_scenario', 'data_privacy_scenario',
  'backup_recovery_activity', 'security_awareness_quiz',
];

export const cybersecurityBlockDefinitions = createBlockDefinitions(
  blockSpecs('cybersecurity', 'cybersecurity', cybersecurityTypes, 'Cybersecurity scenario and practice block'),
);
