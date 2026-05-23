import type {
  PhysicsArrow,
  PhysicsDomain,
  PhysicsHotspot,
  PhysicsInteraction,
  PhysicsLabel,
  PhysicsLevel,
  PhysicsObject,
  PhysicsTeachingStep,
  PhysicsTemplate,
  PhysicsVisual,
  PhysicsVisualType,
} from '../physics/types';

export type ScientificSubject = 'physics' | 'engineering';

export type ScientificLevel = PhysicsLevel;

export type EngineeringDiscipline =
  | 'mechanical'
  | 'civil'
  | 'structural'
  | 'electrical'
  | 'electronics'
  | 'computer'
  | 'chemical'
  | 'aerospace'
  | 'mechatronics'
  | 'robotics'
  | 'biomedical'
  | 'mining'
  | 'environmental'
  | 'agricultural'
  | 'automotive'
  | 'marine'
  | 'industrial'
  | 'manufacturing';

export type EngineeringDomain =
  | 'statics'
  | 'dynamics'
  | 'machine_design'
  | 'structures'
  | 'geotechnical'
  | 'transportation'
  | 'hydraulics'
  | 'power_systems'
  | 'electronics'
  | 'digital_systems'
  | 'control_systems'
  | 'signals'
  | 'process_engineering'
  | 'reaction_engineering'
  | 'thermofluids'
  | 'aerodynamics'
  | 'robotics'
  | 'biomechanics'
  | 'mine_systems'
  | 'water_systems'
  | 'renewable_systems'
  | 'automotive_systems'
  | 'manufacturing_systems';

export type ScientificVisualType =
  | PhysicsVisualType
  | 'technical_drawing'
  | 'design_analysis'
  | 'lab_data'
  | 'process_flow'
  | 'control_system'
  | 'structural_analysis';

export type ScientificRenderMode = PhysicsVisual['renderMode'] | 'webgl';

export type ScientificParameter = {
  id: string;
  symbol: string;
  label: string;
  value?: number | string | boolean;
  unit?: string;
  description?: string;
  min?: number;
  max?: number;
};

export type Assumption = {
  id: string;
  text: string;
  required?: boolean;
};

export type BoundaryCondition = {
  id: string;
  label: string;
  type: 'fixed' | 'free' | 'pinned' | 'roller' | 'input' | 'output' | 'initial' | 'boundary' | 'environment';
  value?: string | number;
  unit?: string;
};

export type EquationBlock = {
  id: string;
  latex: string;
  description?: string;
  variables?: Array<{ symbol: string; meaning: string; unit?: string }>;
};

export type ValidationRule = {
  id: string;
  severity: 'info' | 'warning' | 'error';
  condition: string;
  message: string;
};

export type DesignConstraint = {
  id: string;
  label: string;
  target?: number | string;
  unit?: string;
  comparator?: '<' | '<=' | '=' | '>=' | '>' | 'range';
  required?: boolean;
};

export type ScientificObject = PhysicsObject & {
  engineering?: Record<string, unknown>;
  material?: string;
  safetyFactor?: number;
};

export type ScientificArrow = PhysicsArrow;
export type ScientificLabel = PhysicsLabel;
export type ScientificHotspot = PhysicsHotspot;
export type Interaction = PhysicsInteraction;
export type TeachingStep = PhysicsTeachingStep;

export type ScientificTemplateKey = PhysicsTemplate | string;

export type ScientificVisual = Omit<PhysicsVisual, 'subject' | 'visualType' | 'template' | 'renderMode' | 'objects' | 'arrows' | 'labels' | 'hotspots' | 'equations'> & {
  subject: ScientificSubject;
  discipline?: EngineeringDiscipline;
  physicsDomain?: PhysicsDomain;
  engineeringDomain?: EngineeringDomain;
  level?: ScientificLevel;
  visualType: ScientificVisualType;
  template: ScientificTemplateKey;
  renderMode: ScientificRenderMode;
  objects: ScientificObject[];
  arrows?: ScientificArrow[];
  labels?: ScientificLabel[];
  hotspots?: ScientificHotspot[];
  equations?: EquationBlock[];
  parameters?: ScientificParameter[];
  assumptions?: Assumption[];
  boundaryConditions?: BoundaryCondition[];
  validationRules?: ValidationRule[];
  designConstraints?: DesignConstraint[];
  metadata?: Record<string, unknown>;
};

export type ScientificTemplateDefinition = {
  key: ScientificTemplateKey;
  label: string;
  subject: ScientificSubject;
  domain: PhysicsDomain | EngineeringDomain;
  discipline?: EngineeringDiscipline;
  level: ScientificLevel;
  renderer: string;
  cardType: string;
  description: string;
  defaultVisual: ScientificVisual;
  requiredParameters: ScientificParameter[];
  commonMistakes: string[];
  recommendedInteractions: Interaction['type'][];
};

export function asPhysicsVisual(visual: ScientificVisual | PhysicsVisual): PhysicsVisual {
  return visual as unknown as PhysicsVisual;
}
