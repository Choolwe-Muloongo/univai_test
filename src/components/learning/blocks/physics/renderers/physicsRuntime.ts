import {
  cylinderExtensionSpeed,
  darcyWeisbachPressureDrop,
  hydraulicForce,
  hydrostaticPressure,
  pipeCrossSectionArea,
  pressure,
  reynoldsNumber,
} from '../math/physicsMath';
import type { PhysicsInteraction, PhysicsVisual } from '../types';

export type PhysicsFeedbackState = { correct: boolean; message: string } | null;

const HYDRAULICS_TEMPLATES = new Set([
  'fluid_pressure',
  'hydraulic_press',
  'pascal_principle',
  'bernoulli_flow',
  'continuity_equation',
  'pipe_flow',
  'buoyancy',
  'manometer',
  'hydraulic_cylinder',
  'hydraulic_brake',
  'brake_hydraulics',
  'pump_valve_circuit',
]);

function n(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ');
}

function parseSubmittedNumber(answer: unknown) {
  if (typeof answer === 'number') return Number.isFinite(answer) ? answer : null;
  const match = String(answer ?? '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/i);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '∞';
  if (Math.abs(value) >= 100_000) return value.toExponential(2);
  if (Math.abs(value) >= 1000) return Math.round(value).toLocaleString();
  return value.toFixed(3).replace(/\.000$/, '');
}

function numericHydraulicsResult(expected: number, submitted: unknown, label: string, tolerance: number, unit?: string): PhysicsFeedbackState {
  const actual = parseSubmittedNumber(submitted);
  if (actual === null) return { correct: false, message: `Enter a numeric value for ${label}.` };
  const allowed = Math.max(Math.abs(expected) * tolerance, tolerance);
  const correct = Number.isFinite(expected) && Math.abs(expected - actual) <= allowed;
  return {
    correct,
    message: correct
      ? `Correct. ${label} is approximately ${formatNumber(expected)}${unit ? ` ${unit}` : ''}.`
      : `Not quite. ${label} should be approximately ${formatNumber(expected)}${unit ? ` ${unit}` : ''}.`,
  };
}

function expectedFlowPath(visual: PhysicsVisual) {
  const valveState = normalize(visual.metadata?.valveState ?? 'open');
  const faultMode = normalize(visual.metadata?.faultMode ?? 'none');
  const branchMode = normalize(visual.metadata?.branchMode ?? 'single branch');

  if (faultMode === 'blocked filter') return 'tank pump blocked filter';
  if (faultMode === 'relief open' || valveState === 'relief' || branchMode === 'relief branch') return 'tank pump relief valve tank';
  if (faultMode === 'cylinder stalled') return 'tank pump filter directional valve cylinder stalled return tank';
  if (valveState === 'closed' || valveState === 'neutral') return 'pump valve blocked return tank';
  if (valveState === 'retract') return 'tank pump directional valve rod side cylinder return tank';
  if (branchMode === 'dual branch') return 'tank pump filter directional valve cylinder branch load return tank';
  return 'tank pump filter directional valve cylinder return tank';
}

function containsPathTerms(submitted: string, expected: string) {
  const words = expected.split(' ').filter(Boolean);
  const hits = words.filter((word) => submitted.includes(word));
  return hits.length >= Math.ceil(words.length * 0.65);
}

export function evaluatePhysicsInteraction(interaction: PhysicsInteraction, targetId: string): PhysicsFeedbackState {
  const correct = interaction.correctTargetId ? targetId === interaction.correctTargetId : false;
  return {
    correct,
    message: correct
      ? interaction.feedback?.correct || 'Correct. You selected the right part of the diagram.'
      : interaction.feedback?.incorrect || mistakeSpecificFeedback(interaction, targetId),
  };
}

export function evaluateNumericPhysicsAnswer(interaction: PhysicsInteraction, value: string, visual?: PhysicsVisual): PhysicsFeedbackState {
  const hydraulicsResult = visual ? evaluateHydraulicsAnswerFromVisual(interaction, value, visual) : null;
  if (hydraulicsResult) return hydraulicsResult;

  const expected = Number(interaction.correctAnswer);
  const actual = Number(value);
  const tolerance = interaction.tolerance ?? 0;
  const correct = Number.isFinite(expected) && Number.isFinite(actual) && Math.abs(expected - actual) <= tolerance;
  return {
    correct,
    message: correct
      ? interaction.feedback?.correct || 'Correct. Your calculation matches the diagram.'
      : interaction.feedback?.incorrect || mistakeSpecificFeedback(interaction, value),
  };
}

export function evaluateTextPhysicsAnswer(interaction: PhysicsInteraction, value: string, visual?: PhysicsVisual): PhysicsFeedbackState {
  const hydraulicsResult = visual ? evaluateHydraulicsAnswerFromVisual(interaction, value, visual) : null;
  if (hydraulicsResult) return hydraulicsResult;

  const expected = normalize(interaction.correctAnswer ?? interaction.correctTargetId ?? '');
  const submitted = normalize(value);
  const correct = Boolean(expected) && (submitted === expected || submitted.includes(expected));
  return {
    correct,
    message: correct
      ? interaction.feedback?.correct || 'Correct. Your answer matches the expected response.'
      : interaction.feedback?.incorrect || mistakeSpecificFeedback(interaction, value),
  };
}

export function evaluateHydraulicsAnswerFromVisual(interaction: PhysicsInteraction, submitted: unknown, visual: PhysicsVisual): PhysicsFeedbackState {
  if (!HYDRAULICS_TEMPLATES.has(String(visual.template))) return null;

  const metadata = visual.metadata ?? {};
  const tolerance = n(interaction.tolerance, 0.03);

  if (interaction.type === 'calculate_reynolds_number') {
    const expected = reynoldsNumber(
      n(metadata.densityKgM3, 1000),
      n(metadata.velocityMs ?? metadata.velocity1Ms, 3),
      n(metadata.pipeDiameterM ?? metadata.diameterM, 0.08),
      n(metadata.dynamicViscosityPas, 0.001),
    );
    return numericHydraulicsResult(expected, submitted, 'Reynolds number', tolerance);
  }

  if (interaction.type === 'calculate_pressure_loss') {
    const expected = darcyWeisbachPressureDrop(
      n(metadata.frictionFactor, 0.025),
      n(metadata.pipeLengthM, 12),
      n(metadata.pipeDiameterM ?? metadata.diameterM, 0.08),
      n(metadata.densityKgM3, 1000),
      n(metadata.velocityMs, 3),
    );
    return numericHydraulicsResult(expected, submitted, 'pressure loss', tolerance, 'Pa');
  }

  if (interaction.type === 'read_manometer') {
    const expected = hydrostaticPressure(
      n(metadata.manometerFluidDensityKgM3 ?? metadata.densityKgM3, 13_600),
      n(metadata.heightDifferenceM, 0.18),
      n(metadata.gravityMs2, 9.81),
    );
    return numericHydraulicsResult(expected, submitted, 'manometer pressure difference', tolerance, 'Pa');
  }

  if (interaction.type === 'calculate_cylinder_speed') {
    const expected = cylinderExtensionSpeed(n(metadata.flowRateM3s, 0.0018), n(metadata.pistonAreaM2, 0.012));
    return numericHydraulicsResult(expected, submitted, 'cylinder extension speed', tolerance, 'm/s');
  }

  if (interaction.type === 'calculate_hydraulic_force') {
    const expected = metadata.pressurePa !== undefined && metadata.pistonAreaM2 !== undefined
      ? n(metadata.pressurePa, 0) * n(metadata.pistonAreaM2, 0)
      : hydraulicForce(
        n(metadata.inputForceN ?? metadata.pedalForceN, 150),
        n(metadata.inputAreaM2 ?? metadata.masterCylinderAreaM2, 0.003),
        n(metadata.outputAreaM2 ?? metadata.caliperPistonAreaM2, 0.06),
      );
    return numericHydraulicsResult(expected, submitted, 'hydraulic force', tolerance, 'N');
  }

  if (interaction.type === 'calculate_hydrostatic_pressure') {
    const expected = hydrostaticPressure(n(metadata.densityKgM3, 1000), n(metadata.depthM, 4), n(metadata.gravityMs2, 9.81));
    return numericHydraulicsResult(expected, submitted, 'hydrostatic pressure', tolerance, 'Pa');
  }

  if (interaction.type === 'calculate_pressure') {
    const expected = pressure(
      n(metadata.inputForceN ?? metadata.pedalForceN ?? metadata.forceN, 150),
      n(metadata.inputAreaM2 ?? metadata.masterCylinderAreaM2 ?? metadata.areaM2, 0.003),
    );
    return numericHydraulicsResult(expected, submitted, 'pressure', tolerance, 'Pa');
  }

  if (interaction.type === 'calculate_flow_rate') {
    const area = metadata.areaM2 !== undefined ? n(metadata.areaM2, 0.01) : pipeCrossSectionArea(n(metadata.pipeDiameterM ?? metadata.diameterM, 0.08));
    const expected = area * n(metadata.velocityMs ?? metadata.velocity1Ms, 3);
    return numericHydraulicsResult(expected, submitted, 'flow rate', tolerance, 'm³/s');
  }

  if (interaction.type === 'identify_valve_state') {
    const expected = normalize(metadata.valveState ?? 'open');
    const answer = normalize(submitted);
    const correct = answer === expected || answer.includes(expected);
    return {
      correct,
      message: correct ? `Correct. The valve state is ${expected}.` : `Not quite. The valve state is ${expected}.`,
    };
  }

  if (interaction.type === 'trace_hydraulic_flow_path') {
    const expected = expectedFlowPath(visual);
    const answer = normalize(submitted);
    const correct = containsPathTerms(answer, expected);
    return {
      correct,
      message: correct ? 'Correct. You traced the main hydraulic flow path.' : `Not quite. Expected path: ${expected}.`,
    };
  }

  return null;
}

export function mistakeSpecificFeedback(interaction: PhysicsInteraction, submitted: string) {
  const prompt = `${interaction.type} ${interaction.prompt} ${submitted}`.toLowerCase();
  if (prompt.includes('reynolds')) return 'Reynolds number uses density, velocity, diameter, and dynamic viscosity: Re = ρvD/μ.';
  if (prompt.includes('pressure loss')) return 'For pipe losses, use Darcy-Weisbach: ΔP = f(L/D)(ρv²/2).';
  if (prompt.includes('manometer')) return 'For a U-tube manometer, use the column height difference: ΔP = ρgΔh.';
  if (prompt.includes('valve')) return 'Check the valve state and trace which ports are connected before deciding the flow path.';
  if (prompt.includes('cylinder')) return 'Cylinder speed depends on flow rate and piston area: v = Q/A.';
  if (prompt.includes('hydraulic')) return 'In hydraulics, pressure transmits through the fluid, while force depends on pressure times area.';
  if (prompt.includes('momentum')) return 'Momentum depends on both mass and velocity. Use p = mv, and remember direction/signs.';
  if (prompt.includes('kinetic')) return 'Kinetic energy uses speed squared: KE = 1/2 mv². Do not use momentum as energy.';
  if (prompt.includes('impulse')) return 'Impulse is the area under a force-time graph, or change in momentum.';
  if (prompt.includes('weight')) return 'Weight is a force. Use W = mg and point it vertically downward.';
  if (prompt.includes('wavelength')) return 'Wavelength is the horizontal distance between matching points, such as crest to crest.';
  if (prompt.includes('amplitude')) return 'Amplitude is measured from the rest position to a crest or trough, not crest to trough.';
  if (prompt.includes('voltmeter')) return 'A voltmeter is placed in parallel with the component being measured.';
  if (prompt.includes('ammeter')) return 'An ammeter is placed in series so current flows through it.';
  if (prompt.includes('gradient')) return 'For graph questions, gradient means rise divided by run over the selected interval.';
  if (prompt.includes('area')) return 'For physics graphs, area under the curve often represents a quantity like displacement or impulse.';
  return 'Not quite. Check the diagram carefully, including direction, units, labels, and the relevant formula.';
}

export function kineticEnergy(mass: number, velocity: number) {
  return 0.5 * mass * velocity * velocity;
}

export function momentum(mass: number, velocity: number) {
  return mass * velocity;
}
