import type { PhysicsVisual } from '../types';

export const quantumWavefunctionVisual: PhysicsVisual = {
  id: 'advanced-quantum-wavefunction',
  subject: 'physics',
  physicsLevel: 'masters',
  physicsDomain: 'quantum',
  visualType: 'graph',
  template: 'quantum_wavefunction',
  renderMode: 'svg',
  canvas: { width: 900, height: 460, background: 'plain' },
  objects: [{ id: 'psi-plot', type: 'wavefunction', x: 90, y: 80, width: 700, height: 300, label: 'ψ(x)' }],
  labels: [{ id: 'q-title', text: 'Wavefunction and probability density', x: 95, y: 45 }],
  steps: [
    { id: 'q1', title: 'Interpret ψ(x)', explanation: 'The wavefunction can be positive or negative. Physical probability comes from |ψ|².', highlightObjectIds: ['psi-plot'], equation: '|\\psi(x)|^2' },
    { id: 'q2', title: 'Check nodes', explanation: 'Nodes are points where ψ(x)=0. They reveal the quantum number and allowed standing-wave pattern.', highlightObjectIds: ['psi-plot'] },
  ],
  interactions: [{ id: 'q-node-question', type: 'interpret_wavefunction', prompt: 'What physical quantity is represented by |ψ|²?', correctAnswer: 'probability density', feedback: { correct: 'Correct. |ψ|² represents probability density.', incorrect: 'ψ itself is not probability. Probability density is |ψ|².' } }],
  equations: [{ id: 'norm', latex: '\\int |\\psi(x)|^2 dx = 1', description: 'Normalization condition' }],
  metadata: { amplitude: 1, quantumNumber: 2, wellLength: 1, assumptions: ['one-dimensional infinite square well', 'non-relativistic particle'], parameters: { n: 2, L: '1 m' }, boundaryConditions: ['ψ(0)=0', 'ψ(L)=0'] },
};

export const potentialWellVisual: PhysicsVisual = {
  id: 'advanced-potential-well',
  subject: 'physics',
  physicsLevel: 'masters',
  physicsDomain: 'quantum',
  visualType: 'graph',
  template: 'potential_well',
  renderMode: 'svg',
  canvas: { width: 900, height: 440, background: 'plain' },
  objects: [{ id: 'barrier', type: 'potential_barrier', x: 250, y: 120, width: 120, height: 240, label: 'Barrier' }],
  labels: [{ id: 'pw-title', text: 'Potential barrier and energy level', x: 95, y: 45 }],
  steps: [
    { id: 'pw1', title: 'Compare E and V₀', explanation: 'Classically, a particle with E below V₀ cannot cross the barrier. Quantum mechanics permits a nonzero transmission probability.', highlightObjectIds: ['barrier'], equation: 'E < V_0' },
  ],
  interactions: [{ id: 'pw-question', type: 'interpret_wavefunction', prompt: 'If E is below the barrier height, what quantum effect may still occur?', correctAnswer: 'tunneling', feedback: { correct: 'Correct. Quantum tunneling may occur.', incorrect: 'Below a barrier, the quantum effect to discuss is tunneling.' } }],
  equations: [{ id: 'schrodinger', latex: '-\\frac{\\hbar^2}{2m}\\frac{d^2\\psi}{dx^2}+V(x)\\psi=E\\psi', description: 'Time-independent Schrödinger equation' }],
  metadata: { barrierHeightEv: 8, particleEnergyEv: 5, assumptions: ['one-dimensional potential barrier', 'stationary state'], parameters: { V0: '8 eV', E: '5 eV' }, boundaryConditions: ['ψ and dψ/dx continuous at boundaries'] },
};

export const spacetimeDiagramVisual: PhysicsVisual = {
  id: 'advanced-spacetime-diagram',
  subject: 'physics',
  physicsLevel: 'advanced_undergraduate',
  physicsDomain: 'relativity',
  visualType: 'diagram',
  template: 'spacetime_diagram',
  renderMode: 'svg',
  canvas: { width: 900, height: 520, background: 'plain' },
  objects: [{ id: 'worldline', type: 'worldline', x: 450, y: 250, width: 120, height: 320, label: 'Observer worldline' }],
  labels: [{ id: 'st-title', text: 'Minkowski spacetime diagram', x: 95, y: 45 }],
  steps: [{ id: 'st1', title: 'Read the axes', explanation: 'The vertical axis is ct and the horizontal axis is x. Light rays form 45-degree boundaries of the light cone.', highlightObjectIds: ['worldline'], equation: 's^2 = c^2t^2 - x^2' }],
  interactions: [{ id: 'st-question', type: 'read_spacetime_event', prompt: 'What does a worldline inside the light cone represent?', correctAnswer: 'slower than light motion', feedback: { correct: 'Correct. Timelike worldlines remain inside the light cone.', incorrect: 'Inside the light cone represents slower-than-light, physically possible motion.' } }],
  equations: [{ id: 'gamma', latex: '\\gamma=\\frac{1}{\\sqrt{1-v^2/c^2}}', description: 'Lorentz factor' }],
  metadata: { beta: 0.6, assumptions: ['flat spacetime', 'inertial frames'], parameters: { beta: 0.6 }, boundaryConditions: ['speed magnitude less than c'] },
};

export const electricFieldVisual: PhysicsVisual = {
  id: 'advanced-electric-field',
  subject: 'physics',
  physicsLevel: 'undergraduate',
  physicsDomain: 'electromagnetism',
  visualType: 'field_visualization',
  template: 'electric_field',
  renderMode: 'svg',
  canvas: { width: 900, height: 480, background: 'plain' },
  objects: [{ id: 'source-charge', type: 'charge', x: 450, y: 240, radius: 34, label: '+q' }],
  labels: [{ id: 'ef-title', text: 'Electric field vectors around a point charge', x: 95, y: 45 }],
  steps: [{ id: 'ef1', title: 'Direction of the field', explanation: 'For a positive source charge, electric field vectors point outward.', highlightObjectIds: ['source-charge'], equation: 'E = kq/r^2' }],
  interactions: [{ id: 'ef-question', type: 'calculate_field_strength', prompt: 'Which direction do field arrows point around a positive charge?', correctAnswer: 'outward', feedback: { correct: 'Correct. Electric field lines point away from positive charge.', incorrect: 'For a positive charge, the field points outward.' } }],
  equations: [{ id: 'coulomb-field', latex: 'E = \\frac{kq}{r^2}', description: 'Electric field strength' }],
  metadata: { chargeC: 1e-9, assumptions: ['point charge', 'vacuum approximation'], parameters: { q: '1 nC' } },
};

export const thermodynamicCycleVisual: PhysicsVisual = {
  id: 'advanced-thermodynamic-cycle',
  subject: 'physics',
  physicsLevel: 'undergraduate',
  physicsDomain: 'thermodynamics',
  visualType: 'graph',
  template: 'thermodynamic_cycle',
  renderMode: 'svg',
  canvas: { width: 900, height: 500, background: 'plain' },
  objects: [{ id: 'pv-cycle', type: 'engine_cycle', x: 120, y: 100, width: 500, height: 300, label: 'PV cycle' }],
  labels: [{ id: 'pv-title', text: 'PV cycle and work area', x: 95, y: 45 }],
  steps: [{ id: 'pv1', title: 'Interpret enclosed area', explanation: 'The area enclosed by a PV cycle represents net work done over one complete cycle.', highlightObjectIds: ['pv-cycle'], equation: 'W=\\oint P\\,dV' }],
  interactions: [{ id: 'pv-question', type: 'calculate_from_diagram', prompt: 'What does the area enclosed by a PV cycle represent?', correctAnswer: 'work', feedback: { correct: 'Correct. Enclosed PV area represents net work.', incorrect: 'The enclosed area on a PV diagram represents work.' } }],
  equations: [{ id: 'work-cycle', latex: 'W=\\oint P\\,dV', description: 'Net work over a cycle' }],
  metadata: { cyclePoints: [[1, 1], [3, 1], [3, 3], [1, 3], [1, 1]], assumptions: ['quasi-static cycle'], parameters: { axes: 'P-V' } },
};

export const bernoulliFlowVisual: PhysicsVisual = {
  id: 'advanced-bernoulli-flow',
  subject: 'physics',
  physicsLevel: 'undergraduate',
  physicsDomain: 'fluids',
  visualType: 'diagram',
  template: 'bernoulli_flow',
  renderMode: 'svg',
  canvas: { width: 900, height: 420, background: 'plain' },
  objects: [{ id: 'pipe', type: 'pipe', x: 90, y: 150, width: 720, height: 120, label: 'Pipe' }],
  labels: [{ id: 'bf-title', text: 'Bernoulli flow through a narrowing pipe', x: 95, y: 45 }],
  steps: [{ id: 'bf1', title: 'Compare pressure and speed', explanation: 'For ideal steady flow, the narrower region has higher speed and often lower static pressure.', highlightObjectIds: ['pipe'], equation: 'P + \\frac{1}{2}\\rho v^2 + \\rho gh = constant' }],
  interactions: [{ id: 'bf-question', type: 'identify_fluid_principle', prompt: 'In the narrow section, what usually happens to fluid speed?', correctAnswer: 'increases', feedback: { correct: 'Correct. Speed increases in the narrow region for steady incompressible flow.', incorrect: 'Use continuity: narrowing the pipe increases speed.' } }],
  equations: [{ id: 'bernoulli', latex: 'P + \\frac{1}{2}\\rho v^2 + \\rho gh = constant', description: 'Bernoulli equation' }],
  metadata: { pressure1Pa: 120000, pressure2Pa: 85000, velocity1Ms: 2, velocity2Ms: 5, assumptions: ['steady flow', 'incompressible fluid', 'negligible viscosity'] },
};

export const advancedPhysicsTemplateVisuals = {
  quantum_wavefunction: quantumWavefunctionVisual,
  potential_well: potentialWellVisual,
  spacetime_diagram: spacetimeDiagramVisual,
  electric_field: electricFieldVisual,
  thermodynamic_cycle: thermodynamicCycleVisual,
  bernoulli_flow: bernoulliFlowVisual,
} as const;
