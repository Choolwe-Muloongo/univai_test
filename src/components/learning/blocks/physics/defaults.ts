import type { PhysicsVisual } from './types';

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
  labels: [
    { id: 'centre-label', text: 'Forces acting on the block', x: 280, y: 70 },
  ],
  hotspots: [
    { id: 'weight-hotspot', targetId: 'weight', x: 370, y: 330, width: 65, height: 115, label: 'Weight' },
  ],
  steps: [
    { id: 'step-1', title: 'Identify the object', explanation: 'Start by choosing the body whose forces you want to analyse.', highlightObjectIds: ['block'] },
    { id: 'step-2', title: 'Find the weight', explanation: 'Weight acts vertically downward because gravity pulls the block toward Earth.', highlightObjectIds: ['block', 'weight'], equation: 'W = mg' },
    { id: 'step-3', title: 'Add the contact force', explanation: 'The normal reaction is perpendicular to the surface.', highlightObjectIds: ['normal', 'surface'] },
  ],
  interactions: [
    { id: 'select-weight', type: 'select_arrow', prompt: 'Which arrow shows the weight of the block?', correctTargetId: 'weight', feedback: { correct: 'Correct. Weight acts vertically downward.', incorrect: 'Not quite. Weight points downward, not sideways or upward.' } },
  ],
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
  interactions: [
    { id: 'pulley-driving-force', type: 'select_arrow', prompt: 'Which weight creates the larger driving force?', correctTargetId: 'weight-a', feedback: { correct: 'Correct. The 5 kg mass has the larger weight.', incorrect: 'Check the masses first. The heavier mass has the larger weight.' } },
  ],
};

export const collisionVisual: PhysicsVisual = {
  id: 'physics-collision-1d',
  subject: 'physics',
  visualType: 'simulation',
  template: 'collision',
  renderMode: 'svg',
  canvas: { width: 900, height: 420, background: 'plain' },
  objects: [
    { id: 'track', type: 'surface', x: 80, y: 265, width: 740, height: 10, label: 'Track', style: { fill: '#cbd5e1', stroke: '#475569', strokeWidth: 2 } },
    { id: 'cart-a-before', type: 'collision_object', x: 160, y: 195, width: 120, height: 70, label: 'Cart A\n2 kg', style: { fill: '#dbeafe', stroke: '#1d4ed8', strokeWidth: 2 }, physics: { massKg: 2, initialVelocity: 6 } },
    { id: 'cart-b-before', type: 'collision_object', x: 500, y: 195, width: 120, height: 70, label: 'Cart B\n3 kg', style: { fill: '#dcfce7', stroke: '#15803d', strokeWidth: 2 }, physics: { massKg: 3, initialVelocity: 0 } },
    { id: 'collision-point', type: 'circle', x: 430, y: 230, radius: 9, label: 'Collision point', style: { fill: '#f97316', stroke: '#c2410c', strokeWidth: 2 } },
  ],
  arrows: [
    { id: 'velocity-a-before', type: 'velocity', from: { x: 285, y: 215 }, to: { x: 405, y: 215 }, label: 'u₁ = 6 m/s', colorRole: 'velocity', isInteractive: true },
    { id: 'momentum-a-before', type: 'momentum', from: { x: 285, y: 245 }, to: { x: 405, y: 245 }, label: 'p₁ = 12 kg m/s', colorRole: 'momentum', isInteractive: true },
  ],
  labels: [
    { id: 'before-label', text: 'Before collision: Cart A moves right, Cart B is stationary.', x: 180, y: 80 },
    { id: 'after-label', text: 'Momentum before = momentum after, but kinetic energy may change.', x: 170, y: 110 },
  ],
  steps: [
    { id: 'c1', title: 'Calculate initial momentum', explanation: 'Use p = mv for each cart. Cart B is stationary, so its initial momentum is zero.', highlightObjectIds: ['cart-a-before', 'cart-b-before', 'velocity-a-before'], equation: 'p = mv' },
    { id: 'c2', title: 'Compare before and after', explanation: 'Total momentum is conserved in the collision. Kinetic energy is only conserved in an elastic collision.', highlightObjectIds: ['momentum-a-before'] },
  ],
  interactions: [
    { id: 'initial-momentum', type: 'enter_numeric_answer', prompt: 'Calculate the total momentum before collision.', correctAnswer: 12, unit: 'kg m/s', tolerance: 0.1, feedback: { correct: 'Correct. 2 kg × 6 m/s = 12 kg m/s.', incorrect: 'Momentum is mass times velocity. Do not add velocities directly.' } },
  ],
  metadata: {
    collisionType: 'inelastic',
    showMomentum: true,
    showKineticEnergy: true,
    showBeforeDuringAfter: true,
  },
};

export const physicsTemplateVisuals = {
  free_body: freeBodyDiagramVisual,
  pulley: pulleySystemVisual,
  collision: collisionVisual,
} as const;

export function clonePhysicsVisual(template: keyof typeof physicsTemplateVisuals = 'free_body') {
  return JSON.parse(JSON.stringify(physicsTemplateVisuals[template])) as PhysicsVisual;
}
