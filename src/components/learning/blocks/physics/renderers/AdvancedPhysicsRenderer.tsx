import type { SvgDiagramRendererProps } from './SvgDiagramRenderer';
import { SvgDiagramRenderer } from './SvgDiagramRenderer';

const domainCopy: Record<string, string> = {
  angle_vector_resolution: 'Advanced mechanics: resolve vectors, angles, and components with exam-style interaction.',
  hydraulic_press: 'Fluid mechanics: pressure transmission, Pascal principle, pistons, and force multiplication.',
  fluid_pressure: 'Fluid statics: pressure, density, depth, and hydrostatic force.',
  bernoulli_flow: 'Fluid dynamics: pressure, velocity, height, and energy conservation along a streamline.',
  buoyancy: 'Fluids: Archimedes principle, upthrust, density, and floating equilibrium.',
  thermodynamic_cycle: 'Thermodynamics: state diagrams, heat flow, work, entropy, and cycles.',
  electric_field: 'Electromagnetism: field direction, test charges, inverse-square fields, and potentials.',
  magnetic_field: 'Electromagnetism: magnetic field lines, Lorentz force, coils, and flux.',
  maxwell_equations: 'Electromagnetism: field relationships, divergence, curl, and wave propagation.',
  quantum_wavefunction: 'Quantum physics: wavefunctions, probability density, boundary conditions, and energy levels.',
  potential_well: 'Quantum physics: bound states, barriers, tunneling, and eigenmodes.',
  spacetime_diagram: 'Relativity: light cones, worldlines, events, and invariant intervals.',
  nuclear_decay: 'Nuclear physics: decay chains, half-life, emissions, and conservation laws.',
  particle_interaction: 'Particle physics: interaction vertices, tracks, conservation laws, and detector-style diagrams.',
  tensor_field: 'Mathematical physics: tensor components, basis vectors, curvature, and field geometry.',
};

export function AdvancedPhysicsRenderer(props: SvgDiagramRendererProps) {
  const { visual } = props;
  const description = domainCopy[visual.template] ?? 'Advanced physics renderer: domain-specific visual reasoning with structured objects and interactions.';
  return (
    <div className="space-y-3 rounded-2xl border bg-muted/10 p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Advanced physics domain pack</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {visual.physicsLevel ? <p className="mt-1 text-xs text-muted-foreground">Level: {visual.physicsLevel.replace(/_/g, ' ')} · Domain: {visual.physicsDomain?.replace(/_/g, ' ') ?? 'physics'}</p> : null}
      </div>
      <SvgDiagramRenderer {...props} />
    </div>
  );
}
