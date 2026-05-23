import type { BlockAutoMarkResult, LearningBlockPayload } from '../schemas';
import {
  cylinderExtensionSpeed,
  darcyWeisbachPressureDrop,
  hydraulicForce,
  hydrostaticPressure,
  pipeCrossSectionArea,
  pressure,
  reynoldsNumber,
} from './math/physicsMath';
import type { PhysicsInteraction, PhysicsVisual } from './types';

type NumericCheck = {
  expected: number;
  submitted: number;
  tolerance: number;
  unit?: string;
};

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

function withinTolerance({ expected, submitted, tolerance }: NumericCheck) {
  if (!Number.isFinite(expected) || !Number.isFinite(submitted)) return false;
  const allowed = Math.max(Math.abs(expected) * tolerance, tolerance);
  return Math.abs(expected - submitted) <= allowed;
}

function numericResult(check: NumericCheck, label: string): BlockAutoMarkResult {
  const correct = withinTolerance(check);
  return {
    correct,
    score: correct ? 1 : 0,
    feedback: correct
      ? `Correct. ${label} is approximately ${formatNumber(check.expected)}${check.unit ? ` ${check.unit}` : ''}.`
      : `Not quite. ${label} should be approximately ${formatNumber(check.expected)}${check.unit ? ` ${check.unit}` : ''}.`,
  };
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '∞';
  if (Math.abs(value) >= 100_000) return value.toExponential(2);
  if (Math.abs(value) >= 1000) return Math.round(value).toLocaleString();
  return value.toFixed(3).replace(/\.000$/, '');
}

function findInteraction(visual: PhysicsVisual, answer: unknown): PhysicsInteraction | undefined {
  const interactions = visual.interactions ?? [];
  if (!interactions.length) return undefined;
  if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
    const candidate = answer as Record<string, unknown>;
    const interactionId = String(candidate.interactionId ?? candidate.id ?? '');
    if (interactionId) return interactions.find((interaction) => interaction.id === interactionId) ?? interactions[0];
  }
  return interactions[0];
}

function extractSubmittedValue(answer: unknown) {
  if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
    const candidate = answer as Record<string, unknown>;
    return candidate.answer ?? candidate.value ?? candidate.selected ?? candidate.response ?? answer;
  }
  return answer;
}

function expectedFlowPath(visual: PhysicsVisual) {
  const valveState = normalize(visual.metadata?.valveState ?? 'open');
  const faultMode = normalize(visual.metadata?.faultMode ?? 'none');

  if (faultMode === 'blocked filter') return 'tank pump blocked filter';
  if (faultMode === 'relief open' || valveState === 'relief') return 'tank pump relief valve tank';
  if (valveState === 'closed' || valveState === 'neutral') return 'pump valve blocked return tank';
  if (valveState === 'retract') return 'tank pump directional valve rod side cylinder return tank';
  return 'tank pump filter directional valve cylinder return tank';
}

function containsPathTerms(submitted: string, expected: string) {
  const words = expected.split(' ').filter(Boolean);
  const hits = words.filter((word) => submitted.includes(word));
  return hits.length >= Math.ceil(words.length * 0.65);
}

function visualFromPayload(payload: LearningBlockPayload): PhysicsVisual | null {
  const visual = payload.visual;
  if (!visual || typeof visual !== 'object' || Array.isArray(visual)) return null;
  return visual as PhysicsVisual;
}

export function autoMarkHydraulicsInteraction(payload: LearningBlockPayload, rawAnswer: unknown): BlockAutoMarkResult | null {
  const visual = visualFromPayload(payload);
  if (!visual || !HYDRAULICS_TEMPLATES.has(String(visual.template))) return null;

  const interaction = findInteraction(visual, rawAnswer);
  const answer = extractSubmittedValue(rawAnswer);
  const submittedNumber = parseSubmittedNumber(answer);
  const metadata = visual.metadata ?? {};
  const tolerance = n(interaction?.tolerance, 0.03);
  const interactionType = interaction?.type ?? String((rawAnswer as Record<string, unknown> | undefined)?.type ?? '');

  if (interactionType === 'calculate_reynolds_number') {
    if (submittedNumber === null) return { correct: false, score: 0, feedback: 'Enter a numeric Reynolds number.' };
    const expected = reynoldsNumber(
      n(metadata.densityKgM3, 1000),
      n(metadata.velocityMs ?? metadata.velocity1Ms, 3),
      n(metadata.pipeDiameterM ?? metadata.diameterM, 0.08),
      n(metadata.dynamicViscosityPas, 0.001),
    );
    return numericResult({ expected, submitted: submittedNumber, tolerance, unit: '' }, 'Reynolds number');
  }

  if (interactionType === 'calculate_pressure_loss') {
    if (submittedNumber === null) return { correct: false, score: 0, feedback: 'Enter a numeric pressure loss.' };
    const expected = darcyWeisbachPressureDrop(
      n(metadata.frictionFactor, 0.025),
      n(metadata.pipeLengthM, 12),
      n(metadata.pipeDiameterM ?? metadata.diameterM, 0.08),
      n(metadata.densityKgM3, 1000),
      n(metadata.velocityMs, 3),
    );
    return numericResult({ expected, submitted: submittedNumber, tolerance, unit: 'Pa' }, 'Pressure loss');
  }

  if (interactionType === 'read_manometer') {
    if (submittedNumber === null) return { correct: false, score: 0, feedback: 'Enter the pressure difference shown by the manometer.' };
    const expected = hydrostaticPressure(
      n(metadata.manometerFluidDensityKgM3 ?? metadata.densityKgM3, 13_600),
      n(metadata.heightDifferenceM, 0.18),
      n(metadata.gravityMs2, 9.81),
    );
    return numericResult({ expected, submitted: submittedNumber, tolerance, unit: 'Pa' }, 'Manometer pressure difference');
  }

  if (interactionType === 'calculate_cylinder_speed') {
    if (submittedNumber === null) return { correct: false, score: 0, feedback: 'Enter the cylinder extension speed.' };
    const expected = cylinderExtensionSpeed(n(metadata.flowRateM3s, 0.0018), n(metadata.pistonAreaM2, 0.012));
    return numericResult({ expected, submitted: submittedNumber, tolerance, unit: 'm/s' }, 'Cylinder speed');
  }

  if (interactionType === 'calculate_hydraulic_force') {
    if (submittedNumber === null) return { correct: false, score: 0, feedback: 'Enter the hydraulic force.' };
    const expected = metadata.pressurePa !== undefined && metadata.pistonAreaM2 !== undefined
      ? n(metadata.pressurePa, 0) * n(metadata.pistonAreaM2, 0)
      : hydraulicForce(n(metadata.inputForceN ?? metadata.pedalForceN, 150), n(metadata.inputAreaM2 ?? metadata.masterCylinderAreaM2, 0.003), n(metadata.outputAreaM2 ?? metadata.caliperPistonAreaM2, 0.06));
    return numericResult({ expected, submitted: submittedNumber, tolerance, unit: 'N' }, 'Hydraulic force');
  }

  if (interactionType === 'calculate_hydrostatic_pressure') {
    if (submittedNumber === null) return { correct: false, score: 0, feedback: 'Enter the hydrostatic pressure.' };
    const expected = hydrostaticPressure(n(metadata.densityKgM3, 1000), n(metadata.depthM, 4), n(metadata.gravityMs2, 9.81));
    return numericResult({ expected, submitted: submittedNumber, tolerance, unit: 'Pa' }, 'Hydrostatic pressure');
  }

  if (interactionType === 'calculate_pressure') {
    if (submittedNumber === null) return { correct: false, score: 0, feedback: 'Enter the pressure.' };
    const expected = pressure(n(metadata.inputForceN ?? metadata.pedalForceN ?? metadata.forceN, 150), n(metadata.inputAreaM2 ?? metadata.masterCylinderAreaM2 ?? metadata.areaM2, 0.003));
    return numericResult({ expected, submitted: submittedNumber, tolerance, unit: 'Pa' }, 'Pressure');
  }

  if (interactionType === 'calculate_flow_rate') {
    if (submittedNumber === null) return { correct: false, score: 0, feedback: 'Enter the flow rate.' };
    const area = metadata.areaM2 !== undefined ? n(metadata.areaM2, 0.01) : pipeCrossSectionArea(n(metadata.pipeDiameterM ?? metadata.diameterM, 0.08));
    const expected = area * n(metadata.velocityMs ?? metadata.velocity1Ms, 3);
    return numericResult({ expected, submitted: submittedNumber, tolerance, unit: 'm³/s' }, 'Flow rate');
  }

  if (interactionType === 'identify_valve_state') {
    const expected = normalize(metadata.valveState ?? 'open');
    const submitted = normalize(answer);
    const correct = submitted === expected || submitted.includes(expected);
    return { correct, score: correct ? 1 : 0, feedback: correct ? `Correct. The valve state is ${expected}.` : `Not quite. The valve state is ${expected}.` };
  }

  if (interactionType === 'trace_hydraulic_flow_path') {
    const expected = expectedFlowPath(visual);
    const submitted = normalize(answer);
    const correct = containsPathTerms(submitted, expected);
    return { correct, score: correct ? 1 : 0, feedback: correct ? 'Correct. You traced the main hydraulic flow path.' : `Not quite. Expected path: ${expected}.` };
  }

  return null;
}
