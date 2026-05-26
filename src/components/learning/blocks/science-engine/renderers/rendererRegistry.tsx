'use client';

import type { ComponentType } from 'react';

import type { PhysicsVisual } from '../../physics/types';
import { FieldVisualizationRenderer } from '../../physics/advanced/FieldVisualizationRenderer';
import { FluidFlowRenderer } from '../../physics/advanced/FluidFlowRenderer';
import { HydraulicsRenderer } from '../../physics/advanced/HydraulicsRenderer';
import { PotentialWellRenderer } from '../../physics/advanced/PotentialWellRenderer';
import { QuantumWavefunctionRenderer } from '../../physics/advanced/QuantumWavefunctionRenderer';
import { SpacetimeDiagramRenderer } from '../../physics/advanced/SpacetimeDiagramRenderer';
import { ThermodynamicCycleRenderer } from '../../physics/advanced/ThermodynamicCycleRenderer';
import { CircuitPhysicsRenderer } from '../../physics/renderers/CircuitPhysicsRenderer';
import { CollisionSimulationRenderer } from '../../physics/renderers/CollisionSimulationRenderer';
import { GraphPhysicsRenderer } from '../../physics/renderers/GraphPhysicsRenderer';
import { OpticsPhysicsRenderer } from '../../physics/renderers/OpticsPhysicsRenderer';
import { SvgDiagramRenderer } from '../../physics/renderers/SvgDiagramRenderer';
import { WavePhysicsRenderer } from '../../physics/renderers/WavePhysicsRenderer';

type SvgRendererProps = Parameters<typeof SvgDiagramRenderer>[0];

export type ScientificRendererProps = SvgRendererProps & {
  visual: PhysicsVisual;
};

type ScientificRenderer = ComponentType<ScientificRendererProps>;

function visualOnly(Renderer: ComponentType<{ visual: PhysicsVisual }>): ScientificRenderer {
  return function VisualOnlyRenderer({ visual }: ScientificRendererProps) {
    return <Renderer visual={visual} />;
  };
}

function svgFallback(props: ScientificRendererProps) {
  return <SvgDiagramRenderer {...props} />;
}

function EngineeringSvgRenderer(props: ScientificRendererProps) {
  const { visual } = props;
  const discipline = String(visual.metadata?.discipline ?? visual.metadata?.engineeringDiscipline ?? 'engineering');
  return (
    <div className="min-w-0 space-y-2">
      <div className="rounded-2xl border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Engineering visual · {discipline.replace(/_/g, ' ')} · {visual.template.replace(/_/g, ' ')}. This template uses the shared scientific SVG renderer until a specialist simulation is attached.
      </div>
      <SvgDiagramRenderer {...props} />
    </div>
  );
}

const hydraulicsRenderer = visualOnly(HydraulicsRenderer);

export const rendererRegistry: Record<string, ScientificRenderer> = {
  free_body: svgFallback,
  pulley: svgFallback,
  projectile: svgFallback,
  inclined_plane: svgFallback,
  moments: svgFallback,
  spring: svgFallback,
  angle_vector_resolution: svgFallback,

  collision: visualOnly(CollisionSimulationRenderer),
  kinematics_graph: GraphPhysicsRenderer,
  coordinate_graph: GraphPhysicsRenderer,
  linear_graph: GraphPhysicsRenderer,
  line_graph: GraphPhysicsRenderer,
  graph: GraphPhysicsRenderer,
  circuit: CircuitPhysicsRenderer,
  ray_diagram: OpticsPhysicsRenderer,
  wave: WavePhysicsRenderer,

  hydraulic_press: hydraulicsRenderer,
  fluid_pressure: hydraulicsRenderer,
  pascal_principle: hydraulicsRenderer,
  bernoulli_flow: hydraulicsRenderer,
  continuity_equation: hydraulicsRenderer,
  buoyancy: hydraulicsRenderer,
  pipe_flow: hydraulicsRenderer,
  manometer: hydraulicsRenderer,
  hydraulic_cylinder: hydraulicsRenderer,
  hydraulic_brake: hydraulicsRenderer,
  brake_hydraulics: hydraulicsRenderer,
  pump_valve_circuit: hydraulicsRenderer,

  fluid_flow: visualOnly(FluidFlowRenderer),

  thermodynamic_cycle: visualOnly(ThermodynamicCycleRenderer),
  heat_engine: visualOnly(ThermodynamicCycleRenderer),

  electric_field: visualOnly(FieldVisualizationRenderer),
  magnetic_field: visualOnly(FieldVisualizationRenderer),
  maxwell_equations: visualOnly(FieldVisualizationRenderer),

  quantum_wavefunction: visualOnly(QuantumWavefunctionRenderer),
  potential_well: visualOnly(PotentialWellRenderer),
  quantum_tunneling: visualOnly(PotentialWellRenderer),
  spacetime_diagram: visualOnly(SpacetimeDiagramRenderer),

  nuclear_decay: svgFallback,
  particle_interaction: svgFallback,
  tensor_field: svgFallback,

  beam_load: EngineeringSvgRenderer,
  shear_force: EngineeringSvgRenderer,
  bending_moment: EngineeringSvgRenderer,
  truss_analysis: EngineeringSvgRenderer,
  gear_train: EngineeringSvgRenderer,
  shaft_torque: EngineeringSvgRenderer,
  stress_strain: EngineeringSvgRenderer,
  process_flow: EngineeringSvgRenderer,
  reactor: EngineeringSvgRenderer,
  distillation_column: EngineeringSvgRenderer,
  heat_exchanger: EngineeringSvgRenderer,
  airfoil: EngineeringSvgRenderer,
  robot_arm: EngineeringSvgRenderer,
  pid_control: EngineeringSvgRenderer,
  rock_stress: EngineeringSvgRenderer,
  ventilation_flow: EngineeringSvgRenderer,
  water_treatment: EngineeringSvgRenderer,
};

export function getScientificRenderer(template: string): ScientificRenderer {
  return rendererRegistry[template] ?? svgFallback;
}

export function listRegisteredScientificTemplates() {
  return Object.keys(rendererRegistry).sort();
}
