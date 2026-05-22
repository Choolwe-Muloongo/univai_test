import type { PhysicsInteraction } from '../types';

export type PhysicsFeedbackState = { correct: boolean; message: string } | null;

export function evaluatePhysicsInteraction(interaction: PhysicsInteraction, targetId: string): PhysicsFeedbackState {
  const correct = interaction.correctTargetId ? targetId === interaction.correctTargetId : false;
  return {
    correct,
    message: correct
      ? interaction.feedback?.correct || 'Correct. You selected the right part of the diagram.'
      : interaction.feedback?.incorrect || mistakeSpecificFeedback(interaction, targetId),
  };
}

export function evaluateNumericPhysicsAnswer(interaction: PhysicsInteraction, value: string): PhysicsFeedbackState {
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

export function mistakeSpecificFeedback(interaction: PhysicsInteraction, submitted: string) {
  const prompt = `${interaction.type} ${interaction.prompt} ${submitted}`.toLowerCase();
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
