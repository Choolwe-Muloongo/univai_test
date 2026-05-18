import { blockSpecs, createBlockDefinitions } from '../shared/factory';

const simulationTypes = [
  'business_simulation', 'budget_simulation', 'market_simulation', 'pricing_simulation',
  'physics_simulation', 'chemistry_simulation', 'network_simulation', 'robot_simulation',
  'accounting_cycle_simulation', 'customer_service_simulation', 'decision_simulation',
  'cash_flow_simulation', 'stock_inventory_simulation', 'project_management_simulation',
  'supply_chain_simulation', 'emergency_response_simulation',
];

export const simulationBlockDefinitions = createBlockDefinitions(
  blockSpecs('simulations', 'simulations', simulationTypes, 'Simulation and scenario engine block'),
);
