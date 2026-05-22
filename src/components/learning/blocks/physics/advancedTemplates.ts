import type { PhysicsVisual } from './types';

export const angleVectorResolutionVisual: PhysicsVisual = {
  id: 'physics-angle-vector-resolution',
  subject: 'physics',
  physicsLevel: 'first_year_university',
  physicsDomain: 'mechanics',
  visualType: 'diagram',
  template: 'angle_vector_resolution',
  renderMode: 'svg',
  canvas: { width: 900, height: 520, background: 'grid' },
  objects: [
    { id: 'inclined-plane', type: 'inclined_plane', x: 180, y: 230, width: 420, height: 190, label: 'Inclined plane', style: { fill: '#f8fafc', stroke: '#0f172a', strokeWidth: 3 }, interactive: true },
    { id: 'block', type: 'rectangle', x: 390, y: 245, width: 110, height: 70, rotation: -25, label: 'm', style: { fill: '#e0f2fe', stroke: '#0369a1', strokeWidth: 3 }, physics: { massKg: 8 }, interactive: true },
    { id: 'theta', type: 'angle_arc', x: 190, y: 420, radius: 72, label: 'θ = 25°', physics: { startAngle: 0, endAngle: 25, degrees: 25 }, interactive: true },
  ],
  arrows: [
    { id: 'weight', type: 'force', from: { x: 445, y: 315 }, to: { x: 445, y: 455 }, label: 'mg', colorRole: 'weight', isInteractive: true },
    { id: 'normal', type: 'normal', from: { x: 445, y: 280 }, to: { x: 505, y: 165 }, label: 'N', colorRole: 'normal', isInteractive: true },
    { id: 'parallel-component', type: 'force', from: { x: 445, y: 315 }, to: { x: 550, y: 365 }, label: 'mg sinθ', colorRole: 'force', isInteractive: true },
    { id: 'perpendicular-component', type: 'force', from: { x: 445, y: 315 }, to: { x: 390, y: 210 }, label: 'mg cosθ', colorRole: 'friction', isInteractive: true },
  ],
  labels: [{ id: 'title', text: 'Resolve weight into components on an inclined plane', x: 160, y: 60 }],
  steps: [
    { id: 'a1', title: 'Identify the angle', explanation: 'The angle of the plane controls how weight splits into parallel and perpendicular components.', highlightObjectIds: ['theta'], equation: '\\theta = 25^\\circ' },
    { id: 'a2', title: 'Resolve the weight', explanation: 'The component down the slope is mg sinθ. The component into the plane is mg cosθ.', highlightObjectIds: ['parallel-component', 'perpendicular-component'], equation: 'W_{\\parallel}=mg\\sin\\theta,\\quad W_{\\perp}=mg\\cos\\theta' },
  ],
  interactions: [{ id: 'angle-component-q', type: 'select_arrow', prompt: 'Which arrow shows the force component pulling the block down the slope?', correctTargetId: 'parallel-component', feedback: { correct: 'Correct. The parallel component is mg sinθ.', incorrect: 'Not quite. The down-slope component is parallel to the plane.' } }],
};

export const hydraulicPressVisual: PhysicsVisual = {
  id: 'physics-hydraulic-press',
  subject: 'physics',
  physicsLevel: 'undergraduate',
  physicsDomain: 'fluids',
  visualType: 'diagram',
  template: 'hydraulic_press',
  renderMode: 'svg',
  canvas: { width: 900, height: 520, background: 'plain' },
  objects: [
    { id: 'small-piston', type: 'piston', x: 150, y: 170, width: 120, height: 210, label: 'A₁', style: { fill: '#dbeafe', stroke: '#1d4ed8', strokeWidth: 3 }, physics: { area: 0.02 }, interactive: true },
    { id: 'large-piston', type: 'piston', x: 560, y: 110, width: 180, height: 270, label: 'A₂', style: { fill: '#dcfce7', stroke: '#15803d', strokeWidth: 3 }, physics: { area: 0.12 }, interactive: true },
    { id: 'fluid', type: 'fluid_container', x: 120, y: 270, width: 660, height: 135, label: 'Incompressible fluid', style: { fill: '#bae6fd', stroke: '#0284c7', strokeWidth: 3 }, physics: { density: 1000 }, interactive: true },
  ],
  arrows: [
    { id: 'input-force', type: 'pressure', from: { x: 210, y: 90 }, to: { x: 210, y: 170 }, label: 'F₁', colorRole: 'pressure', magnitude: 200, unit: 'N', isInteractive: true },
    { id: 'output-force', type: 'pressure', from: { x: 650, y: 110 }, to: { x: 650, y: 35 }, label: 'F₂', colorRole: 'fluid', isInteractive: true },
  ],
  labels: [{ id: 'hydraulic-title', text: "Pascal's principle: pressure is transmitted through the fluid", x: 120, y: 55 }],
  steps: [
    { id: 'h1', title: 'Pressure is shared', explanation: 'In a hydraulic press, pressure applied to one piston is transmitted through the fluid.', highlightObjectIds: ['small-piston', 'fluid'], equation: 'P=\\frac{F}{A}' },
    { id: 'h2', title: 'Use equal pressure', explanation: 'Since pressure is transmitted, F₁/A₁ = F₂/A₂.', highlightObjectIds: ['input-force', 'output-force'], equation: '\\frac{F_1}{A_1}=\\frac{F_2}{A_2}' },
  ],
  interactions: [{ id: 'hydraulic-force-q', type: 'calculate_hydraulic_force', prompt: 'If F₁ = 200 N, A₁ = 0.02 m², and A₂ = 0.12 m², calculate F₂.', correctAnswer: 1200, unit: 'N', tolerance: 1, feedback: { correct: 'Correct. Same pressure gives F₂ = F₁(A₂/A₁) = 1200 N.', incorrect: 'Use equal pressure: F₁/A₁ = F₂/A₂.' } }],
};

export const electricFieldVisual: PhysicsVisual = {
  id: 'physics-electric-field',
  subject: 'physics',
  physicsLevel: 'advanced_undergraduate',
  physicsDomain: 'electromagnetism',
  visualType: 'field_visualization',
  template: 'electric_field',
  renderMode: 'svg',
  canvas: { width: 900, height: 520, background: 'grid' },
  objects: [
    { id: 'positive-charge', type: 'charge', x: 280, y: 250, radius: 34, label: '+Q', style: { fill: '#fee2e2', stroke: '#dc2626', strokeWidth: 3 }, physics: { chargeC: 1e-6 }, interactive: true },
    { id: 'negative-charge', type: 'charge', x: 620, y: 250, radius: 34, label: '-Q', style: { fill: '#dbeafe', stroke: '#2563eb', strokeWidth: 3 }, physics: { chargeC: -1e-6 }, interactive: true },
    { id: 'field-lines', type: 'field_line', x: 300, y: 250, width: 300, height: 0, label: 'E-field', style: { stroke: '#9333ea', strokeWidth: 3 }, interactive: true },
  ],
  arrows: [
    { id: 'e-direction', type: 'field', from: { x: 330, y: 250 }, to: { x: 570, y: 250 }, label: 'E', colorRole: 'electric', isInteractive: true },
  ],
  labels: [{ id: 'em-title', text: 'Electric field lines point from positive to negative charge', x: 130, y: 55 }],
  steps: [
    { id: 'em1', title: 'Field direction', explanation: 'Electric field direction is the direction a positive test charge would move.', highlightObjectIds: ['e-direction'], equation: 'E=\\frac{F}{q}' },
    { id: 'em2', title: 'Inverse-square field', explanation: 'For a point charge, field strength decreases with distance squared.', highlightObjectIds: ['positive-charge', 'negative-charge'], equation: 'E=\\frac{kQ}{r^2}' },
  ],
  interactions: [{ id: 'field-direction-q', type: 'identify_field_direction', prompt: 'Which direction does the electric field point between +Q and -Q?', correctTargetId: 'e-direction', feedback: { correct: 'Correct. Field lines go from positive to negative.', incorrect: 'Remember: electric field direction follows a positive test charge.' } }],
};

export const quantumWavefunctionVisual: PhysicsVisual = {
  id: 'physics-quantum-wavefunction',
  subject: 'physics',
  physicsLevel: 'phd',
  physicsDomain: 'quantum',
  visualType: 'derivation',
  template: 'quantum_wavefunction',
  renderMode: 'svg',
  canvas: { width: 900, height: 520, background: 'graph_paper' },
  objects: [
    { id: 'potential-well', type: 'potential_barrier', x: 170, y: 120, width: 560, height: 300, label: 'Infinite potential well', style: { fill: '#f8fafc', stroke: '#0f172a', strokeWidth: 3 }, physics: { length: 'L' }, interactive: true },
    { id: 'psi-1', type: 'wavefunction', x: 190, y: 230, width: 520, height: 90, label: 'ψ₁(x)', style: { stroke: '#2563eb', strokeWidth: 4 }, physics: { mode: 1 }, interactive: true },
    { id: 'psi-2', type: 'wavefunction', x: 190, y: 155, width: 520, height: 80, label: 'ψ₂(x)', style: { stroke: '#9333ea', strokeWidth: 4 }, physics: { mode: 2 }, interactive: true },
  ],
  arrows: [],
  labels: [{ id: 'quantum-title', text: 'Quantum particle in a box: boundary conditions quantize energy', x: 95, y: 55 }],
  equations: [
    { id: 'schrodinger', latex: '-\\frac{\\hbar^2}{2m}\\frac{d^2\\psi}{dx^2}=E\\psi', description: 'Time-independent Schrödinger equation inside the well' },
    { id: 'energy-levels', latex: 'E_n=\\frac{n^2h^2}{8mL^2}', description: 'Allowed energy levels' },
  ],
  steps: [
    { id: 'q1', title: 'Apply boundary conditions', explanation: 'The wavefunction must vanish at x = 0 and x = L for an infinite well.', highlightObjectIds: ['potential-well'], equation: '\\psi(0)=\\psi(L)=0' },
    { id: 'q2', title: 'Quantized modes', explanation: 'Only standing-wave modes that fit inside the box are allowed.', highlightObjectIds: ['psi-1', 'psi-2'], equation: '\\psi_n(x)=\\sqrt{\\frac{2}{L}}\\sin\\left(\\frac{n\\pi x}{L}\\right)' },
  ],
  interactions: [{ id: 'energy-level-q', type: 'calculate_energy_level', prompt: 'If n doubles from 1 to 2, how many times larger is E₂ than E₁?', correctAnswer: 4, tolerance: 0, feedback: { correct: 'Correct. Energy is proportional to n².', incorrect: 'Energy levels scale as n², so doubling n multiplies energy by 4.' } }],
};

export const spacetimeDiagramVisual: PhysicsVisual = {
  id: 'physics-spacetime-diagram',
  subject: 'physics',
  physicsLevel: 'phd',
  physicsDomain: 'relativity',
  visualType: 'diagram',
  template: 'spacetime_diagram',
  renderMode: 'svg',
  canvas: { width: 900, height: 520, background: 'graph_paper' },
  objects: [
    { id: 'ct-axis', type: 'spacetime_axis', x: 450, y: 430, width: 0, height: -330, label: 'ct', style: { stroke: '#0f172a', strokeWidth: 3 }, interactive: true },
    { id: 'x-axis', type: 'spacetime_axis', x: 160, y: 430, width: 580, height: 0, label: 'x', style: { stroke: '#0f172a', strokeWidth: 3 }, interactive: true },
    { id: 'light-cone-left', type: 'worldline', x: 450, y: 430, width: -260, height: -260, label: 'light', style: { stroke: '#f59e0b', strokeWidth: 3 }, interactive: true },
    { id: 'light-cone-right', type: 'worldline', x: 450, y: 430, width: 260, height: -260, label: 'light', style: { stroke: '#f59e0b', strokeWidth: 3 }, interactive: true },
    { id: 'observer-worldline', type: 'worldline', x: 450, y: 430, width: 85, height: -315, label: 'observer', style: { stroke: '#2563eb', strokeWidth: 4 }, interactive: true },
  ],
  arrows: [],
  labels: [{ id: 'rel-title', text: 'Minkowski spacetime diagram with light cone and observer worldline', x: 95, y: 55 }],
  equations: [{ id: 'interval', latex: 's^2=c^2t^2-x^2-y^2-z^2', description: 'Invariant spacetime interval' }],
  steps: [
    { id: 'r1', title: 'Light cone boundary', explanation: 'Worldlines of light form 45° boundaries in ct-x diagrams when c = 1 units are used.', highlightObjectIds: ['light-cone-left', 'light-cone-right'], equation: 'x=\\pm ct' },
    { id: 'r2', title: 'Timelike worldline', explanation: 'Massive observers remain inside the light cone.', highlightObjectIds: ['observer-worldline'] },
  ],
  interactions: [{ id: 'spacetime-event-q', type: 'read_spacetime_event', prompt: 'Which line represents the massive observer worldline?', correctTargetId: 'observer-worldline', feedback: { correct: 'Correct. The observer worldline stays inside the light cone.', incorrect: 'A massive object cannot follow the light-cone boundary; it must stay inside it.' } }],
};

export const tensorFieldVisual: PhysicsVisual = {
  id: 'physics-tensor-field',
  subject: 'physics',
  physicsLevel: 'phd',
  physicsDomain: 'mathematical_physics',
  visualType: 'field_visualization',
  template: 'tensor_field',
  renderMode: 'svg',
  canvas: { width: 900, height: 520, background: 'grid' },
  objects: [
    { id: 'tensor-grid', type: 'tensor_grid', x: 150, y: 100, width: 600, height: 320, label: 'Tensor field grid', style: { fill: '#ffffff00', stroke: '#475569', strokeWidth: 2 }, physics: { rank: 2 }, interactive: true },
    { id: 'curvature-region', type: 'circle', x: 450, y: 260, radius: 58, label: 'curvature', style: { fill: '#fef3c7', stroke: '#d97706', strokeWidth: 3 }, interactive: true },
  ],
  arrows: [
    { id: 'basis-vector-1', type: 'field', from: { x: 450, y: 260 }, to: { x: 560, y: 240 }, label: 'e₁', colorRole: 'relativity', isInteractive: true },
    { id: 'basis-vector-2', type: 'field', from: { x: 450, y: 260 }, to: { x: 430, y: 145 }, label: 'e₂', colorRole: 'relativity', isInteractive: true },
  ],
  labels: [{ id: 'tensor-title', text: 'Tensor field visualization: components depend on basis, geometry does not', x: 90, y: 55 }],
  equations: [{ id: 'tensor-transform', latex: "T^{\\mu'}{}_{\\nu'}=\\frac{\\partial x^{\\mu'}}{\\partial x^\\alpha}\\frac{\\partial x^\\beta}{\\partial x^{\\nu'}}T^\\alpha{}_\\beta", description: 'Mixed tensor transformation law' }],
  steps: [
    { id: 't1', title: 'Separate object from components', explanation: 'A tensor is geometric. Its components change when the coordinate basis changes.', highlightObjectIds: ['tensor-grid', 'basis-vector-1', 'basis-vector-2'] },
    { id: 't2', title: 'Interpret curvature region', explanation: 'Curvature can be represented by how neighboring basis vectors change across the field.', highlightObjectIds: ['curvature-region'] },
  ],
  interactions: [{ id: 'tensor-component-q', type: 'interpret_tensor_component', prompt: 'Tap the visual element representing the curved region of the tensor field.', correctTargetId: 'curvature-region', feedback: { correct: 'Correct. This marks the region where geometry is changing.', incorrect: 'Look for the highlighted local region, not the basis arrows.' } }],
};
