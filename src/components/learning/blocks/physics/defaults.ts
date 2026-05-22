import type { PhysicsTemplate, PhysicsVisual } from './types';

export const freeBodyDiagramVisual: PhysicsVisual = {
  id: 'physics-free-body-block',
  subject: 'physics',
  visualType: 'diagram',
  template: 'free_body',
  renderMode: 'svg',
  canvas: { width: 800, height: 500, background: 'plain' },
  objects: [
    { id: 'surface', type: 'surface', x: 130, y: 320, width: 540, height: 12, label: 'Surface', style: { fill: '#e2e8f0', stroke: '#64748b', strokeWidth: 2 } },
    { id: 'block', type: 'rectangle', x: 340, y: 230, width: 120, height: 90, label: 'Block', style: { fill: '#f8fafc', stroke: '#0f172a', strokeWidth: 2 }, physics: { bodyType: 'block' } },
  ],
  arrows: [
    { id: 'normal', type: 'force', from: { x: 400, y: 230 }, to: { x: 400, y: 135 }, label: 'N', colorRole: 'normal', isInteractive: true },
    { id: 'weight', type: 'force', from: { x: 400, y: 320 }, to: { x: 400, y: 430 }, label: 'W = mg', colorRole: 'weight', isInteractive: true },
    { id: 'friction', type: 'force', from: { x: 340, y: 275 }, to: { x: 235, y: 275 }, label: 'Friction', colorRole: 'friction', isInteractive: true },
    { id: 'applied', type: 'force', from: { x: 460, y: 275 }, to: { x: 575, y: 275 }, label: 'Applied force', colorRole: 'force', isInteractive: true },
  ],
  labels: [{ id: 'centre-label', text: 'Forces acting on the block', x: 280, y: 70 }],
  hotspots: [{ id: 'weight-hotspot', targetId: 'weight', x: 370, y: 330, width: 65, height: 115, label: 'Weight' }],
  steps: [
    { id: 'step-1', title: 'Identify the object', explanation: 'Start by choosing the body whose forces you want to analyse.', highlightObjectIds: ['block'] },
    { id: 'step-2', title: 'Find the weight', explanation: 'Weight acts vertically downward because gravity pulls the block toward Earth.', highlightObjectIds: ['block', 'weight'], equation: 'W = mg' },
    { id: 'step-3', title: 'Add the contact force', explanation: 'The normal reaction is perpendicular to the surface.', highlightObjectIds: ['normal', 'surface'] },
  ],
  interactions: [{ id: 'select-weight', type: 'select_arrow', prompt: 'Which arrow shows the weight of the block?', correctTargetId: 'weight', feedback: { correct: 'Correct. Weight acts vertically downward.', incorrect: 'Not quite. Weight points downward, not sideways or upward.' } }],
};

export const pulleySystemVisual: PhysicsVisual = {
  id: 'physics-pulley-system',
  subject: 'physics',
  visualType: 'diagram',
  template: 'pulley',
  renderMode: 'svg',
  canvas: { width: 900, height: 550, background: 'plain' },
  objects: [
    { id: 'support', type: 'surface', x: 305, y: 50, width: 290, height: 14, label: 'Support', style: { fill: '#cbd5e1', stroke: '#475569', strokeWidth: 2 } },
    { id: 'pulley', type: 'pulley', x: 450, y: 130, radius: 55, label: 'Pulley', style: { fill: '#f8fafc', stroke: '#0f172a', strokeWidth: 3 } },
    { id: 'rope-left', type: 'rope', x: 295, y: 185, width: 310, height: 160, label: 'Rope', style: { stroke: '#334155', strokeWidth: 4 } },
    { id: 'mass-a', type: 'mass', x: 250, y: 330, width: 90, height: 90, label: '5 kg', style: { fill: '#ecfeff', stroke: '#0e7490', strokeWidth: 2 }, physics: { massKg: 5 } },
    { id: 'mass-b', type: 'mass', x: 560, y: 330, width: 90, height: 90, label: '3 kg', style: { fill: '#fef3c7', stroke: '#b45309', strokeWidth: 2 }, physics: { massKg: 3 } },
  ],
  arrows: [
    { id: 'weight-a', type: 'force', from: { x: 295, y: 420 }, to: { x: 295, y: 510 }, label: 'W₁', colorRole: 'weight', isInteractive: true },
    { id: 'weight-b', type: 'force', from: { x: 605, y: 420 }, to: { x: 605, y: 500 }, label: 'W₂', colorRole: 'weight', isInteractive: true },
    { id: 'tension-a', type: 'force', from: { x: 295, y: 330 }, to: { x: 295, y: 230 }, label: 'T', colorRole: 'tension', isInteractive: true },
    { id: 'tension-b', type: 'force', from: { x: 605, y: 330 }, to: { x: 605, y: 230 }, label: 'T', colorRole: 'tension', isInteractive: true },
  ],
  labels: [{ id: 'pulley-title', text: 'Two-mass pulley system', x: 330, y: 35 }],
  steps: [
    { id: 's1', title: 'Compare the masses', explanation: 'The 5 kg mass is heavier, so the system accelerates toward that side.', highlightObjectIds: ['mass-a', 'mass-b'] },
    { id: 's2', title: 'Find both weights', explanation: 'Calculate each weight using W = mg before finding the resultant force.', highlightObjectIds: ['weight-a', 'weight-b'], equation: 'W = mg' },
    { id: 's3', title: 'Find resultant force', explanation: 'The driving force is the difference between the two weights.', highlightObjectIds: ['weight-a', 'weight-b'] },
  ],
  interactions: [{ id: 'pulley-driving-force', type: 'select_arrow', prompt: 'Which weight creates the larger driving force?', correctTargetId: 'weight-a', feedback: { correct: 'Correct. The 5 kg mass has the larger weight.', incorrect: 'Check the masses first. The heavier mass has the larger weight.' } }],
};

export const collisionVisual: PhysicsVisual = {
  id: 'physics-collision-1d',
  subject: 'physics',
  visualType: 'simulation',
  template: 'collision',
  renderMode: 'canvas',
  canvas: { width: 900, height: 420, background: 'plain' },
  objects: [
    { id: 'cart-a-before', type: 'collision_object', x: 160, y: 195, width: 120, height: 70, label: 'Cart A', style: { fill: '#dbeafe', stroke: '#1d4ed8', strokeWidth: 2 }, physics: { massKg: 2, initialVelocity: 6, finalVelocity: 2 } },
    { id: 'cart-b-before', type: 'collision_object', x: 500, y: 195, width: 120, height: 70, label: 'Cart B', style: { fill: '#dcfce7', stroke: '#15803d', strokeWidth: 2 }, physics: { massKg: 3, initialVelocity: 0, finalVelocity: 2.67 } },
  ],
  arrows: [],
  labels: [{ id: 'collision-title', text: 'One-dimensional collision: compare momentum before and after', x: 135, y: 60 }],
  steps: [
    { id: 'c1', title: 'Calculate initial momentum', explanation: 'Use p = mv for each cart. Cart B is stationary, so its initial momentum is zero.', highlightObjectIds: ['cart-a-before', 'cart-b-before'], equation: 'p = mv' },
    { id: 'c2', title: 'Compare kinetic energy', explanation: 'Momentum is conserved in a closed system. Kinetic energy is only conserved in an elastic collision.', highlightObjectIds: ['cart-a-before', 'cart-b-before'], equation: 'KE = \\frac{1}{2}mv^2' },
  ],
  interactions: [{ id: 'initial-momentum', type: 'enter_numeric_answer', prompt: 'Calculate the total momentum before collision.', correctAnswer: 12, unit: 'kg m/s', tolerance: 0.1, feedback: { correct: 'Correct. 2 kg × 6 m/s = 12 kg m/s.', incorrect: 'Momentum is mass times velocity. Do not add velocities directly.' } }],
  metadata: { collisionType: 'inelastic', showMomentum: true, showKineticEnergy: true, showBeforeDuringAfter: true },
};

export const waveVisual: PhysicsVisual = {
  id: 'physics-wave-diagram',
  subject: 'physics',
  visualType: 'diagram',
  template: 'wave',
  renderMode: 'svg',
  canvas: { width: 900, height: 420, background: 'grid' },
  objects: [
    { id: 'main-wave', type: 'wave', x: 120, y: 100, width: 620, height: 180, label: 'Transverse wave', interactive: true, style: { stroke: '#2563eb', strokeWidth: 4 }, physics: { amplitude: 55, cycles: 3 } },
  ],
  arrows: [
    { id: 'amplitude-arrow', type: 'displacement', from: { x: 225, y: 190 }, to: { x: 225, y: 135 }, label: 'Amplitude', colorRole: 'velocity', isInteractive: true },
    { id: 'wavelength-arrow', type: 'displacement', from: { x: 120, y: 330 }, to: { x: 326, y: 330 }, label: 'Wavelength λ', colorRole: 'momentum', isInteractive: true },
  ],
  labels: [{ id: 'wave-title', text: 'Identify amplitude and wavelength', x: 220, y: 55 }],
  steps: [
    { id: 'w1', title: 'Find the rest position', explanation: 'The dashed line is the rest position.', highlightObjectIds: ['main-wave'] },
    { id: 'w2', title: 'Find amplitude', explanation: 'Amplitude is measured from the rest position to a crest or trough.', highlightObjectIds: ['amplitude-arrow'] },
    { id: 'w3', title: 'Find wavelength', explanation: 'Wavelength is measured between matching points, such as crest to crest.', highlightObjectIds: ['wavelength-arrow'], equation: 'v = f\\lambda' },
  ],
  interactions: [{ id: 'wave-amplitude-question', type: 'select_arrow', prompt: 'Which arrow shows the amplitude of the wave?', correctTargetId: 'amplitude-arrow', feedback: { correct: 'Correct. Amplitude is vertical displacement from the rest line.', incorrect: 'Amplitude is vertical. Wavelength is the horizontal distance between matching points.' } }],
};

export const kinematicsGraphVisual: PhysicsVisual = {
  id: 'physics-velocity-time-graph',
  subject: 'physics',
  visualType: 'graph',
  template: 'kinematics_graph',
  renderMode: 'svg',
  canvas: { width: 900, height: 520, background: 'graph_paper' },
  objects: [
    { id: 'graph-area', type: 'rectangle', x: 130, y: 90, width: 580, height: 300, label: 'Velocity-time graph', style: { fill: '#ffffff00', stroke: '#334155', strokeWidth: 3 }, interactive: true },
  ],
  arrows: [
    { id: 'time-axis', type: 'displacement', from: { x: 130, y: 390 }, to: { x: 740, y: 390 }, label: 'time / s', colorRole: 'force' },
    { id: 'velocity-axis', type: 'velocity', from: { x: 130, y: 390 }, to: { x: 130, y: 70 }, label: 'velocity / m/s', colorRole: 'velocity' },
    { id: 'gradient-triangle', type: 'displacement', from: { x: 210, y: 330 }, to: { x: 330, y: 210 }, label: 'gradient', colorRole: 'momentum', dashed: true, isInteractive: true },
  ],
  labels: [
    { id: 'vt-title', text: 'Velocity-time graph: gradient and area', x: 170, y: 50 },
    { id: 'area-label', text: 'Area under graph = displacement', x: 290, y: 440 },
  ],
  steps: [
    { id: 'g1', title: 'Read the axes', explanation: 'The vertical axis shows velocity. The horizontal axis shows time.', highlightObjectIds: ['time-axis', 'velocity-axis'] },
    { id: 'g2', title: 'Use gradient', explanation: 'Gradient on a velocity-time graph gives acceleration.', highlightObjectIds: ['gradient-triangle'], equation: 'a = \\frac{\\Delta v}{\\Delta t}' },
  ],
  interactions: [{ id: 'gradient-question', type: 'select_arrow', prompt: 'Tap the marked feature used to find acceleration.', correctTargetId: 'gradient-triangle', feedback: { correct: 'Correct. Acceleration is the gradient of a velocity-time graph.', incorrect: 'For acceleration, look for gradient, not area.' } }],
};

export const circuitVisual: PhysicsVisual = {
  id: 'physics-ohms-law-circuit',
  subject: 'physics',
  visualType: 'diagram',
  template: 'circuit',
  renderMode: 'svg',
  canvas: { width: 900, height: 480, background: 'plain' },
  objects: [
    { id: 'battery', type: 'circuit_component', componentType: 'battery', x: 120, y: 200, width: 110, height: 80, label: '6 V', interactive: true },
    { id: 'resistor', type: 'circuit_component', componentType: 'resistor', x: 430, y: 205, width: 120, height: 70, label: '3 Ω', interactive: true },
    { id: 'ammeter', type: 'circle', x: 300, y: 240, radius: 34, label: 'A', style: { fill: '#f8fafc', stroke: '#0f172a', strokeWidth: 3 }, interactive: true },
    { id: 'voltmeter', type: 'circle', x: 490, y: 120, radius: 34, label: 'V', style: { fill: '#f8fafc', stroke: '#0f172a', strokeWidth: 3 }, interactive: true },
  ],
  arrows: [
    { id: 'current-arrow', type: 'field', from: { x: 220, y: 325 }, to: { x: 620, y: 325 }, label: 'current', colorRole: 'velocity', isInteractive: true },
  ],
  labels: [{ id: 'circuit-title', text: 'Ammeter in series, voltmeter in parallel', x: 210, y: 55 }],
  steps: [
    { id: 'e1', title: 'Current is measured in series', explanation: 'The ammeter must be placed in series so the same current flows through it.', highlightObjectIds: ['ammeter'], equation: 'I = \\frac{V}{R}' },
    { id: 'e2', title: 'Voltage is measured in parallel', explanation: 'The voltmeter is connected across the component whose voltage is measured.', highlightObjectIds: ['voltmeter', 'resistor'] },
  ],
  interactions: [{ id: 'ammeter-question', type: 'click_hotspot', prompt: 'Tap the component that measures current.', correctTargetId: 'ammeter', feedback: { correct: 'Correct. The ammeter measures current.', incorrect: 'Not quite. The voltmeter measures potential difference; the ammeter measures current.' } }],
};

export const opticsVisual: PhysicsVisual = {
  id: 'physics-convex-lens-rays',
  subject: 'physics',
  visualType: 'diagram',
  template: 'ray_diagram',
  renderMode: 'svg',
  canvas: { width: 900, height: 460, background: 'plain' },
  objects: [
    { id: 'principal-axis', type: 'surface', x: 80, y: 230, width: 740, height: 2, label: 'Principal axis', style: { fill: '#94a3b8', stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'lens', type: 'lens', x: 430, y: 105, width: 54, height: 250, label: 'Convex lens', style: { fill: '#e0f2fe', stroke: '#0369a1', strokeWidth: 3 }, interactive: true },
    { id: 'object', type: 'surface', x: 210, y: 135, width: 10, height: 95, label: 'Object', style: { fill: '#0f172a', stroke: '#0f172a', strokeWidth: 2 } },
    { id: 'ray-1', type: 'ray', x: 220, y: 145, width: 210, height: 0, label: 'Parallel ray', style: { stroke: '#ca8a04', strokeWidth: 3 }, interactive: true },
    { id: 'ray-2', type: 'ray', x: 484, y: 145, width: 220, height: 85, label: 'Through focus', style: { stroke: '#ca8a04', strokeWidth: 3 }, interactive: true },
  ],
  arrows: [],
  labels: [{ id: 'f-label', text: 'F', x: 585, y: 252 }, { id: 'optics-title', text: 'Convex lens ray diagram', x: 250, y: 60 }],
  steps: [
    { id: 'o1', title: 'Draw a parallel ray', explanation: 'A ray parallel to the principal axis refracts through the focal point.', highlightObjectIds: ['ray-1', 'ray-2'], equation: '\\frac{1}{f}=\\frac{1}{u}+\\frac{1}{v}' },
    { id: 'o2', title: 'Locate the image', explanation: 'The image forms where refracted rays meet.', highlightObjectIds: ['ray-2'] },
  ],
  interactions: [{ id: 'ray-question', type: 'select_arrow', prompt: 'Tap the ray that refracts through the focal point.', correctTargetId: 'ray-2', feedback: { correct: 'Correct. A parallel incident ray passes through the focal point after refraction.', incorrect: 'Look for the ray after it passes through the lens toward F.' } }],
};

export const physicsTemplateVisuals = {
  free_body: freeBodyDiagramVisual,
  pulley: pulleySystemVisual,
  collision: collisionVisual,
  wave: waveVisual,
  kinematics_graph: kinematicsGraphVisual,
  circuit: circuitVisual,
  ray_diagram: opticsVisual,
} as const;

export type PhysicsTemplateKey = keyof typeof physicsTemplateVisuals;

export function clonePhysicsVisual(template: PhysicsTemplateKey | PhysicsTemplate = 'free_body') {
  const key = template in physicsTemplateVisuals ? template as PhysicsTemplateKey : 'free_body';
  return JSON.parse(JSON.stringify(physicsTemplateVisuals[key])) as PhysicsVisual;
}
