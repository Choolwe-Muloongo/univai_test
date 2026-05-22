import type { ChemistryVisual } from './types';

const periodicElements = [
  { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, group: 1, period: 1, category: 'nonmetal' },
  { symbol: 'He', name: 'Helium', atomicNumber: 2, group: 18, period: 1, category: 'noble gas' },
  { symbol: 'Li', name: 'Lithium', atomicNumber: 3, group: 1, period: 2, category: 'alkali metal' },
  { symbol: 'Be', name: 'Beryllium', atomicNumber: 4, group: 2, period: 2, category: 'alkaline earth metal' },
  { symbol: 'B', name: 'Boron', atomicNumber: 5, group: 13, period: 2, category: 'metalloid' },
  { symbol: 'C', name: 'Carbon', atomicNumber: 6, group: 14, period: 2, category: 'nonmetal' },
  { symbol: 'N', name: 'Nitrogen', atomicNumber: 7, group: 15, period: 2, category: 'nonmetal' },
  { symbol: 'O', name: 'Oxygen', atomicNumber: 8, group: 16, period: 2, category: 'nonmetal' },
  { symbol: 'F', name: 'Fluorine', atomicNumber: 9, group: 17, period: 2, category: 'halogen' },
  { symbol: 'Ne', name: 'Neon', atomicNumber: 10, group: 18, period: 2, category: 'noble gas' },
  { symbol: 'Na', name: 'Sodium', atomicNumber: 11, group: 1, period: 3, category: 'alkali metal' },
  { symbol: 'Mg', name: 'Magnesium', atomicNumber: 12, group: 2, period: 3, category: 'alkaline earth metal' },
  { symbol: 'Al', name: 'Aluminium', atomicNumber: 13, group: 13, period: 3, category: 'post-transition metal' },
  { symbol: 'Si', name: 'Silicon', atomicNumber: 14, group: 14, period: 3, category: 'metalloid' },
  { symbol: 'P', name: 'Phosphorus', atomicNumber: 15, group: 15, period: 3, category: 'nonmetal' },
  { symbol: 'S', name: 'Sulfur', atomicNumber: 16, group: 16, period: 3, category: 'nonmetal' },
  { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, group: 17, period: 3, category: 'halogen' },
  { symbol: 'Ar', name: 'Argon', atomicNumber: 18, group: 18, period: 3, category: 'noble gas' },
  { symbol: 'K', name: 'Potassium', atomicNumber: 19, group: 1, period: 4, category: 'alkali metal' },
  { symbol: 'Ca', name: 'Calcium', atomicNumber: 20, group: 2, period: 4, category: 'alkaline earth metal' },
  { symbol: 'Fe', name: 'Iron', atomicNumber: 26, group: 8, period: 4, category: 'transition metal' },
  { symbol: 'Cu', name: 'Copper', atomicNumber: 29, group: 11, period: 4, category: 'transition metal' },
  { symbol: 'Zn', name: 'Zinc', atomicNumber: 30, group: 12, period: 4, category: 'transition metal' },
  { symbol: 'Br', name: 'Bromine', atomicNumber: 35, group: 17, period: 4, category: 'halogen' },
  { symbol: 'Ag', name: 'Silver', atomicNumber: 47, group: 11, period: 5, category: 'transition metal' },
  { symbol: 'I', name: 'Iodine', atomicNumber: 53, group: 17, period: 5, category: 'halogen' },
];

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
      { id: 'count-atoms', title: 'Count atoms', explanation: 'Hydrogen and oxygen atoms must be equal on both sides of the equation.' },
      { id: 'balance-hydrogen', title: 'Balance hydrogen', explanation: 'Place 2 before H₂O so the hydrogen atoms match.' },
      { id: 'check-oxygen', title: 'Check oxygen', explanation: 'Now oxygen also has two atoms on both sides.' },
    ],
    interactions: [
      { id: 'balance-check', type: 'balance_equation', prompt: 'Enter the correct coefficients.', correctCoefficients: { h2: 2, o2: 1, h2o: 2 }, feedback: { correct: 'Correct. The equation is balanced.', incorrect: 'Check the number of H and O atoms on both sides.' } },
    ],
  },

  molecule_builder: {
    id: 'chemistry-molecule-builder-default',
    subject: 'chemistry',
    level: 'senior_secondary',
    visualType: 'molecule_builder',
    template: 'molecule_builder',
    title: 'Build a water molecule',
    body: 'Use atoms and bonds to understand how a molecule is assembled from elements.',
    species: [{ id: 'h2o', formula: 'H₂O', name: 'Water', state: 'l', molarMass: 18 }],
    particles: [
      { id: 'oxygen', label: 'O', type: 'atom', elementSymbol: 'O', count: 1 },
      { id: 'hydrogen-1', label: 'H', type: 'atom', elementSymbol: 'H', count: 1 },
      { id: 'hydrogen-2', label: 'H', type: 'atom', elementSymbol: 'H', count: 1 },
    ],
    metadata: {
      bonds: [
        { from: 'oxygen', to: 'hydrogen-1', type: 'single' },
        { from: 'oxygen', to: 'hydrogen-2', type: 'single' },
      ],
      geometry: 'bent',
      bondAngle: 'about 104.5°',
    },
    steps: [
      { id: 'central-atom', title: 'Find the central atom', explanation: 'Oxygen sits in the centre because hydrogen usually forms one bond.' },
      { id: 'bonding', title: 'Connect atoms', explanation: 'Each hydrogen forms one single covalent bond with oxygen.' },
    ],
    interactions: [
      { id: 'formula-fill', type: 'fill_formula', prompt: 'Write the formula for water.', correctAnswer: 'H2O', feedback: { correct: 'Correct. Water has two hydrogen atoms and one oxygen atom.', incorrect: 'Remember: two H atoms and one O atom.' } },
    ],
  },

  periodic_table: {
    id: 'chemistry-periodic-table-default',
    subject: 'chemistry',
    level: 'senior_secondary',
    visualType: 'periodic_table',
    template: 'periodic_table',
    title: 'Explore the periodic table',
    body: 'Click element tiles, compare groups and periods, and classify elements by family.',
    metadata: {
      elements: periodicElements,
      focus: ['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'],
      prompt: 'Compare Period 3 elements from sodium to argon.',
    },
    interactions: [
      { id: 'classify-elements', type: 'classify_particles', prompt: 'Classify the selected particles.', categories: ['metal', 'nonmetal', 'metalloid', 'noble gas', 'halogen'], correctMap: { Na: 'metal', Mg: 'metal', Si: 'metalloid', Cl: 'halogen', Ar: 'noble gas' }, feedback: { correct: 'Correct. You used periodic families properly.', incorrect: 'Check group position and element family.' } },
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
      { id: 'ratio', title: 'Use mole ratio', explanation: 'The balanced equation gives the conversion ratio.', equation: '1 mol N₂ : 2 mol NH₃' },
      { id: 'answer', title: 'Calculate', explanation: 'Multiply by the correct mole ratio and include units.', substitution: '2 mol N₂ × (2 mol NH₃ / 1 mol N₂) = 4 mol NH₃', answer: '4 mol NH₃' },
    ],
    interactions: [
      { id: 'stoich-answer', type: 'numeric_answer', prompt: 'How many moles of NH₃ form from 2 mol of N₂?', correctAnswer: 4, tolerance: 0.01, unit: 'mol', feedback: { correct: 'Correct. 1 mol N₂ produces 2 mol NH₃, so 2 mol N₂ produces 4 mol NH₃.', incorrect: 'Use the ratio N₂:NH₃ = 1:2.' } },
    ],
  },

  titration: {
    id: 'chemistry-titration-default',
    subject: 'chemistry',
    level: 'first_year_university',
    visualType: 'titration',
    template: 'titration',
    title: 'Acid-base titration',
    body: 'Use titre volume and concentration to calculate the unknown concentration.',
    equation: { reactants: [{ id: 'hcl', formula: 'HCl', state: 'aq', coefficient: 1 }, { id: 'naoh', formula: 'NaOH', state: 'aq', coefficient: 1 }], products: [{ id: 'nacl', formula: 'NaCl', state: 'aq', coefficient: 1 }, { id: 'water', formula: 'H₂O', state: 'l', coefficient: 1 }], balanced: true },
    tables: [{ id: 'titration-readings', title: 'Titration readings', columns: ['Trial', 'Initial / cm³', 'Final / cm³', 'Titre / cm³'], rows: [['Rough', 0, 24.9, 24.9], ['1', 0, 25.0, 25.0], ['2', 0, 24.8, 24.8], ['Mean', '-', '-', 24.9]] }],
    metadata: { analyte: '25.0 cm³ NaOH', titrant: '0.100 mol dm⁻³ HCl', indicator: 'phenolphthalein', endpoint: 'pink to colourless' },
    steps: [
      { id: 'moles-acid', title: 'Find moles of acid', explanation: 'Convert volume to dm³ and multiply by concentration.', formula: 'n = cV' },
      { id: 'ratio', title: 'Use reaction ratio', explanation: 'HCl and NaOH react in a 1:1 mole ratio.' },
      { id: 'concentration', title: 'Calculate concentration', explanation: 'Divide moles of NaOH by its volume in dm³.', formula: 'c = n / V' },
    ],
    interactions: [{ id: 'titration-answer', type: 'numeric_answer', prompt: 'Using a 24.9 cm³ mean titre of 0.100 mol dm⁻³ HCl, find the NaOH concentration in 25.0 cm³.', correctAnswer: 0.0996, tolerance: 0.0005, unit: 'mol dm⁻³', feedback: { correct: 'Correct. The concentration is about 0.0996 mol dm⁻³.', incorrect: 'Convert cm³ to dm³ before calculating.' } }],
  },

  ph_calculation: {
    id: 'chemistry-ph-default',
    subject: 'chemistry',
    level: 'first_year_university',
    visualType: 'ph_calculation',
    template: 'ph_calculation',
    title: 'Calculate pH',
    body: 'Use hydrogen ion concentration to calculate pH.',
    metadata: { hydrogenIonConcentration: '1.0 × 10⁻³ mol dm⁻³', formula: 'pH = -log₁₀[H⁺]', scale: ['strong acid', 'weak acid', 'neutral', 'weak alkali', 'strong alkali'] },
    steps: [
      { id: 'formula', title: 'Choose formula', explanation: 'For acids, pH depends on hydrogen ion concentration.', formula: 'pH = -log₁₀[H⁺]' },
      { id: 'substitution', title: 'Substitute', explanation: 'Put [H⁺] = 1.0 × 10⁻³ into the formula.', substitution: 'pH = -log₁₀(1.0 × 10⁻³)' },
      { id: 'answer', title: 'Answer', explanation: 'The pH is 3.', answer: 'pH = 3' },
    ],
    interactions: [{ id: 'ph-answer', type: 'numeric_answer', prompt: 'What is the pH of 1.0 × 10⁻³ mol dm⁻³ HCl?', correctAnswer: 3, tolerance: 0.01, feedback: { correct: 'Correct. pH = 3.', incorrect: 'Use pH = -log₁₀[H⁺].' } }],
  },

  organic_reaction: {
    id: 'chemistry-organic-default',
    subject: 'chemistry',
    level: 'a_level',
    visualType: 'organic_reaction',
    template: 'organic_reaction',
    title: 'Organic functional group reaction',
    body: 'Track reagent, condition, functional group change, and product.',
    equation: { reactants: [{ id: 'ethene', formula: 'C₂H₄', name: 'Ethene', coefficient: 1 }, { id: 'hydrogen', formula: 'H₂', name: 'Hydrogen', coefficient: 1 }], products: [{ id: 'ethane', formula: 'C₂H₆', name: 'Ethane', coefficient: 1 }], conditions: ['Ni catalyst', 'heat'], balanced: true },
    metadata: { reactionFamily: 'addition', functionalGroupChange: 'alkene → alkane', reagent: 'H₂', condition: 'Ni catalyst and heat' },
    steps: [
      { id: 'identify', title: 'Identify the functional group', explanation: 'Ethene contains a carbon-carbon double bond, so it is an alkene.' },
      { id: 'add-hydrogen', title: 'Add hydrogen', explanation: 'Hydrogen adds across the double bond.' },
      { id: 'product', title: 'Name the product', explanation: 'The product is ethane, an alkane.' },
    ],
    interactions: [{ id: 'reaction-type', type: 'classify_reaction', prompt: 'What type of organic reaction is this?', options: ['addition', 'substitution', 'elimination', 'oxidation'], correctAnswer: 'addition', feedback: { correct: 'Correct. Hydrogen adds across the double bond.', incorrect: 'Look at what happens to the C=C bond.' } }],
  },

  redox: {
    id: 'chemistry-redox-default',
    subject: 'chemistry',
    level: 'a_level',
    visualType: 'redox',
    template: 'redox',
    title: 'Redox and oxidation numbers',
    body: 'Identify oxidation, reduction, electron loss, and electron gain.',
    equation: { reactants: [{ id: 'zn', formula: 'Zn', state: 's', coefficient: 1 }, { id: 'cu2', formula: 'Cu', charge: '2+', state: 'aq', coefficient: 1 }], products: [{ id: 'zn2', formula: 'Zn', charge: '2+', state: 'aq', coefficient: 1 }, { id: 'cu', formula: 'Cu', state: 's', coefficient: 1 }], balanced: true, ionic: true },
    metadata: { oxidation: 'Zn → Zn²⁺ + 2e⁻', reduction: 'Cu²⁺ + 2e⁻ → Cu', electronFlow: 'from Zn to Cu²⁺' },
    steps: [
      { id: 'oxidation', title: 'Oxidation', explanation: 'Zinc loses electrons and becomes Zn²⁺.', equation: 'Zn → Zn²⁺ + 2e⁻' },
      { id: 'reduction', title: 'Reduction', explanation: 'Copper(II) ions gain electrons and become copper metal.', equation: 'Cu²⁺ + 2e⁻ → Cu' },
    ],
    interactions: [{ id: 'redox-sequence', type: 'sequence_steps', prompt: 'Put the redox reasoning in order.', correctOrder: ['identify-changing-species', 'write-oxidation-half-equation', 'write-reduction-half-equation', 'combine-electrons'], feedback: { correct: 'Correct. That is the redox pathway.', incorrect: 'Start with species that change oxidation number.' } }],
  },

  equilibrium: {
    id: 'chemistry-equilibrium-default',
    subject: 'chemistry',
    level: 'a_level',
    visualType: 'equilibrium',
    template: 'equilibrium',
    title: 'Dynamic equilibrium',
    body: 'Predict how equilibrium shifts when conditions change.',
    equation: { reactants: [{ id: 'n2', formula: 'N₂', state: 'g', coefficient: 1 }, { id: 'h2', formula: 'H₂', state: 'g', coefficient: 3 }], products: [{ id: 'nh3', formula: 'NH₃', state: 'g', coefficient: 2 }], reversible: true, conditions: ['high pressure', 'iron catalyst'], balanced: true },
    metadata: { change: 'increase pressure', shift: 'towards fewer gas molecules', favouredSide: 'products', equilibriumConstant: 'Kc' },
    steps: [
      { id: 'count-moles', title: 'Count gas moles', explanation: 'Reactants have 4 moles of gas; products have 2 moles of gas.' },
      { id: 'shift', title: 'Apply Le Chatelier', explanation: 'Increasing pressure favours the side with fewer gas moles.' },
    ],
    interactions: [{ id: 'equilibrium-classify', type: 'classify_reaction', prompt: 'If pressure increases, which side is favoured?', options: ['reactants', 'products', 'no change'], correctAnswer: 'products', feedback: { correct: 'Correct. The product side has fewer gas moles.', incorrect: 'Compare total gas moles on each side.' } }],
  },

  electrochemistry: {
    id: 'chemistry-electrochemistry-default',
    subject: 'chemistry',
    level: 'first_year_university',
    visualType: 'electrochemistry',
    template: 'electrochemistry',
    title: 'Electrochemical cell',
    body: 'Follow electron flow, oxidation, reduction, anode, and cathode.',
    equation: { reactants: [{ id: 'zn', formula: 'Zn', state: 's', coefficient: 1 }, { id: 'cu2', formula: 'Cu', charge: '2+', state: 'aq', coefficient: 1 }], products: [{ id: 'zn2', formula: 'Zn', charge: '2+', state: 'aq', coefficient: 1 }, { id: 'cu', formula: 'Cu', state: 's', coefficient: 1 }], balanced: true, ionic: true },
    metadata: { anode: 'Zn/Zn²⁺', cathode: 'Cu²⁺/Cu', electronFlow: 'Zn electrode → Cu electrode', saltBridge: 'Maintains charge balance', cellNotation: 'Zn(s) | Zn²⁺(aq) || Cu²⁺(aq) | Cu(s)' },
    steps: [
      { id: 'anode', title: 'Anode', explanation: 'Oxidation occurs at the zinc electrode.', equation: 'Zn → Zn²⁺ + 2e⁻' },
      { id: 'cathode', title: 'Cathode', explanation: 'Reduction occurs at the copper electrode.', equation: 'Cu²⁺ + 2e⁻ → Cu' },
      { id: 'flow', title: 'Electron flow', explanation: 'Electrons move through the wire from zinc to copper.' },
    ],
    interactions: [{ id: 'electro-fill', type: 'fill_formula', prompt: 'Write the cell notation.', correctAnswer: 'Zn|Zn2+||Cu2+|Cu', feedback: { correct: 'Correct cell notation structure.', incorrect: 'Use anode | ion || ion | cathode.' } }],
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
      { id: 'electron-count', type: 'numeric_answer', prompt: 'How many electrons are in a neutral carbon atom?', correctAnswer: 6, tolerance: 0, feedback: { correct: 'Correct. Neutral carbon has 6 electrons.', incorrect: 'A neutral atom has the same number of electrons as protons.' } },
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
      { id: 'observations', title: 'Reaction observations', columns: ['Stage', 'Observation', 'Inference'], rows: [['Before', 'Clear solution', 'Reactants are dissolved'], ['During', 'Bubbles form', 'A gas may be produced'], ['After', 'Temperature increases', 'The reaction may be exothermic']] },
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
export const chemistryTemplatePreviews = Object.entries(templates).map(([id, visual]) => ({ id, title: visual.title ?? id, visualType: visual.visualType }));
