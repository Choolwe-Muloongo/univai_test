import type { ChemistryVisual } from './types';

const templates: Record<string, ChemistryVisual> = {
  equation_balancer: {
    id: 'chemistry-equation-balancer-default',
    subject: 'chemistry',
    level: 'senior_secondary',
    visualType: 'equation_balancer',
    template: 'equation_balancer',
    title: 'Balance a chemical equation',
    body: 'Adjust the coefficients so that each element has the same number of atoms on both sides.',
    equation: {
      reactants: [
        { id: 'h2', formula: 'H₂', name: 'Hydrogen gas', state: 'g', coefficient: 2 },
        { id: 'o2', formula: 'O₂', name: 'Oxygen gas', state: 'g', coefficient: 1 },
      ],
      products: [{ id: 'h2o', formula: 'H₂O', name: 'Water', state: 'l', coefficient: 2 }],
      balanced: true,
    },
    steps: [
      {
        id: 'count-atoms',
        title: 'Count atoms',
        explanation: 'Hydrogen and oxygen atoms must be equal on both sides of the equation.',
      },
      {
        id: 'balance-hydrogen',
        title: 'Balance hydrogen',
        explanation: 'Place 2 before H₂O so the hydrogen atoms match.',
      },
      {
        id: 'check-oxygen',
        title: 'Check oxygen',
        explanation: 'Now oxygen also has two atoms on both sides.',
      },
    ],
    interactions: [
      {
        id: 'balance-check',
        type: 'balance_equation',
        prompt: 'Enter the correct coefficients.',
        correctCoefficients: { h2: 2, o2: 1, h2o: 2 },
        feedback: {
          correct: 'Correct. The equation is balanced.',
          incorrect: 'Check the number of H and O atoms on both sides.',
        },
      },
    ],
  },

  stoichiometry: {
    id: 'chemistry-stoichiometry-default',
    subject: 'chemistry',
    level: 'first_year_university',
    visualType: 'stoichiometry',
    template: 'stoichiometry',
    title: 'Stoichiometry from balanced equations',
    body: 'Use mole ratios from the balanced equation to calculate an unknown quantity.',
    equation: {
      reactants: [
        { id: 'n2', formula: 'N₂', state: 'g', coefficient: 1 },
        { id: 'h2', formula: 'H₂', state: 'g', coefficient: 3 },
      ],
      products: [{ id: 'nh3', formula: 'NH₃', state: 'g', coefficient: 2 }],
      balanced: true,
    },
    steps: [
      { id: 'given', title: 'Given', explanation: 'Start with the known amount of reactant.' },
      {
        id: 'ratio',
        title: 'Use mole ratio',
        explanation: 'The balanced equation gives the conversion ratio.',
        equation: '1 mol N₂ : 2 mol NH₃',
      },
      {
        id: 'answer',
        title: 'Calculate',
        explanation: 'Multiply by the correct mole ratio and include units.',
        substitution: '2 mol N₂ × (2 mol NH₃ / 1 mol N₂) = 4 mol NH₃',
        answer: '4 mol NH₃',
      },
    ],
    interactions: [
      {
        id: 'stoich-answer',
        type: 'numeric_answer',
        prompt: 'How many moles of NH₃ form from 2 mol of N₂?',
        correctAnswer: 4,
        tolerance: 0.01,
        unit: 'mol',
        feedback: {
          correct: 'Correct. 1 mol N₂ produces 2 mol NH₃, so 2 mol N₂ produces 4 mol NH₃.',
          incorrect: 'Use the ratio N₂:NH₃ = 1:2.',
        },
      },
    ],
  },

  atom_structure: {
    id: 'chemistry-atom-structure-default',
    subject: 'chemistry',
    level: 'senior_secondary',
    visualType: 'atom_structure',
    template: 'atom_structure',
    title: 'Atomic structure',
    body: 'Identify protons, neutrons, and electrons from atomic number and mass number.',
    particles: [
      { id: 'protons', label: 'Protons', type: 'proton', count: 6 },
      { id: 'neutrons', label: 'Neutrons', type: 'neutron', count: 6 },
      { id: 'electrons', label: 'Electrons', type: 'electron', count: 6 },
    ],
    steps: [
      { id: 'atomic-number', title: 'Atomic number', explanation: 'The atomic number tells you the number of protons.' },
      { id: 'neutral-atom', title: 'Neutral atom', explanation: 'In a neutral atom, electrons equal protons.' },
    ],
    interactions: [
      {
        id: 'electron-count',
        type: 'numeric_answer',
        prompt: 'How many electrons are in a neutral carbon atom?',
        correctAnswer: 6,
        tolerance: 0,
        feedback: {
          correct: 'Correct. Neutral carbon has 6 electrons.',
          incorrect: 'A neutral atom has the same number of electrons as protons.',
        },
      },
    ],
  },

  lab_observation: {
    id: 'chemistry-lab-observation-default',
    subject: 'chemistry',
    level: 'senior_secondary',
    visualType: 'lab_observation',
    template: 'lab_observation',
    title: 'Lab observation table',
    body: 'Record observations before, during, and after a reaction.',
    tables: [
      {
        id: 'observations',
        title: 'Reaction observations',
        columns: ['Stage', 'Observation', 'Inference'],
        rows: [
          ['Before', 'Clear solution', 'Reactants are dissolved'],
          ['During', 'Bubbles form', 'A gas may be produced'],
          ['After', 'Temperature increases', 'The reaction may be exothermic'],
        ],
      },
    ],
    steps: [
      { id: 'observe', title: 'Observe carefully', explanation: 'Look for colour change, gas formation, precipitate, and temperature change.' },
      { id: 'infer', title: 'Infer cautiously', explanation: 'An observation is what you see. An inference is what it may mean chemically.' },
    ],
  },
};

export function cloneChemistryVisual(template = 'equation_balancer'): ChemistryVisual {
  const selected = templates[template] ?? templates.equation_balancer;
  return JSON.parse(JSON.stringify(selected)) as ChemistryVisual;
}

export const chemistryTemplateIds = Object.keys(templates);
