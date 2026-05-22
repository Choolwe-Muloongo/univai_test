export type ChemistryVisualType =
  | 'chemical_equation'
  | 'equation_balancer'
  | 'molecule_builder'
  | 'atom_structure'
  | 'electron_configuration'
  | 'periodic_table'
  | 'reaction_type'
  | 'stoichiometry'
  | 'titration'
  | 'ph_calculation'
  | 'organic_reaction'
  | 'lab_observation'
  | 'ion_charge'
  | 'redox'
  | 'gas_laws'
  | 'thermochemistry'
  | 'equilibrium'
  | 'rates'
  | 'electrochemistry'
  | 'qualitative_analysis';

export type ChemistryLevel =
  | 'junior_secondary'
  | 'senior_secondary'
  | 'igcse'
  | 'a_level'
  | 'ap'
  | 'first_year_university'
  | 'advanced_university';

export type ChemistryState = 's' | 'l' | 'g' | 'aq';

export type ChemistrySpecies = {
  id: string;
  formula: string;
  name?: string;
  state?: ChemistryState;
  charge?: string;
  coefficient?: number;
  molarMass?: number;
  role?: 'reactant' | 'product' | 'catalyst' | 'solvent' | 'spectator_ion';
  color?: string;
  notes?: string;
};

export type ChemistryEquation = {
  reactants: ChemistrySpecies[];
  products: ChemistrySpecies[];
  reversible?: boolean;
  conditions?: string[];
  balanced?: boolean;
  ionic?: boolean;
  netIonic?: boolean;
};

export type ChemistryTeachingStep = {
  id: string;
  title: string;
  explanation: string;
  equation?: string;
  formula?: string;
  substitution?: string;
  answer?: string;
  highlightSpeciesIds?: string[];
  hint?: string;
};

export type ChemistryTable = {
  id: string;
  title?: string;
  columns: string[];
  rows: Array<Array<string | number>>;
};

export type ChemistryParticle = {
  id: string;
  label: string;
  type: 'atom' | 'ion' | 'molecule' | 'electron' | 'proton' | 'neutron';
  elementSymbol?: string;
  charge?: string;
  count?: number;
};

export type ChemistryFeedback = {
  correct?: string;
  incorrect?: string;
};

export type ChemistryInteraction =
  | {
      id?: string;
      type: 'balance_equation';
      prompt: string;
      correctCoefficients: Record<string, number>;
      feedback?: ChemistryFeedback;
      hints?: string[];
    }
  | {
      id?: string;
      type: 'classify_reaction';
      prompt: string;
      correctAnswer: string;
      options: string[];
      feedback?: ChemistryFeedback;
      hints?: string[];
    }
  | {
      id?: string;
      type: 'numeric_answer';
      prompt: string;
      correctAnswer: number;
      tolerance?: number;
      unit?: string;
      feedback?: ChemistryFeedback;
      hints?: string[];
    }
  | {
      id?: string;
      type: 'fill_formula';
      prompt: string;
      correctAnswer: string;
      feedback?: ChemistryFeedback;
      hints?: string[];
    }
  | {
      id?: string;
      type: 'sequence_steps';
      prompt: string;
      correctOrder: string[];
      feedback?: ChemistryFeedback;
      hints?: string[];
    }
  | {
      id?: string;
      type: 'classify_particles';
      prompt: string;
      categories: string[];
      correctMap: Record<string, string>;
      feedback?: ChemistryFeedback;
      hints?: string[];
    };

export type ChemistryVisual = {
  id: string;
  subject: 'chemistry';
  level?: ChemistryLevel;
  visualType: ChemistryVisualType;
  template: string;
  title?: string;
  body?: string;
  equation?: ChemistryEquation;
  species?: ChemistrySpecies[];
  particles?: ChemistryParticle[];
  steps?: ChemistryTeachingStep[];
  tables?: ChemistryTable[];
  interactions?: ChemistryInteraction[];
  metadata?: Record<string, unknown>;
};
