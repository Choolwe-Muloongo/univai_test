import { useState } from 'react';
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';

import { MathText } from '@/components/learning/math-text';
import { Button } from '@/components/ui/button';
import type { PhysicsInteraction, PhysicsVisual } from '../types';
import { evaluateNumericPhysicsAnswer, evaluateTextPhysicsAnswer, type PhysicsFeedbackState } from './physicsRuntime';

type Props = {
  interaction: PhysicsInteraction | null;
  feedback: PhysicsFeedbackState;
  onFeedback: (feedback: PhysicsFeedbackState) => void;
  visual?: PhysicsVisual;
};

const TEXT_INTERACTION_TYPES = new Set([
  'identify_valve_state',
  'trace_hydraulic_flow_path',
  'identify_fluid_principle',
  'identify_collision_type',
  'identify_field_direction',
  'interpret_wavefunction',
]);

export function PhysicsInteractionPanel({ interaction, feedback, onFeedback, visual }: Props) {
  if (!interaction) return feedback ? <PhysicsFeedback feedback={feedback} /> : null;
  const isTextInteraction = TEXT_INTERACTION_TYPES.has(interaction.type);
  const isNumericInteraction = interaction.type === 'enter_numeric_answer' || interaction.type.startsWith('calculate_') || interaction.type === 'read_force_time_graph' || interaction.type === 'read_manometer';

  return (
    <>
      <div className="rounded-2xl border p-4">
        <div className="flex items-start gap-2">
          <HelpCircle className="mt-0.5 size-4 text-primary" />
          <div className="w-full">
            <p className="text-sm font-semibold">Checkpoint</p>
            <p className="mt-1 text-sm text-muted-foreground"><MathText text={interaction.prompt} /></p>
            {isNumericInteraction ? (
              <NumericInteraction interaction={interaction} visual={visual} onFeedback={onFeedback} />
            ) : isTextInteraction ? (
              <TextInteraction interaction={interaction} visual={visual} onFeedback={onFeedback} />
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Tap the correct object, arrow, or hotspot in the diagram.</p>
            )}
          </div>
        </div>
      </div>
      {feedback ? <PhysicsFeedback feedback={feedback} /> : null}
    </>
  );
}

function NumericInteraction({ interaction, visual, onFeedback }: { interaction: PhysicsInteraction; visual?: PhysicsVisual; onFeedback: (state: PhysicsFeedbackState) => void }) {
  const [value, setValue] = useState('');
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input value={value} onChange={(event) => setValue(event.target.value)} inputMode="decimal" className="h-10 rounded-xl border bg-background px-3 text-sm" placeholder={`Answer${interaction.unit ? ` in ${interaction.unit}` : ''}`} />
      <Button type="button" size="sm" onClick={() => onFeedback(evaluateNumericPhysicsAnswer(interaction, value, visual))}>Check</Button>
    </div>
  );
}

function TextInteraction({ interaction, visual, onFeedback }: { interaction: PhysicsInteraction; visual?: PhysicsVisual; onFeedback: (state: PhysicsFeedbackState) => void }) {
  const [value, setValue] = useState('');
  return (
    <div className="mt-3 flex flex-col gap-2">
      <textarea value={value} onChange={(event) => setValue(event.target.value)} className="min-h-20 rounded-xl border bg-background px-3 py-2 text-sm" placeholder="Type your answer or trace the flow path in words..." />
      <div><Button type="button" size="sm" onClick={() => onFeedback(evaluateTextPhysicsAnswer(interaction, value, visual))}>Check</Button></div>
    </div>
  );
}

function PhysicsFeedback({ feedback }: { feedback: Exclude<PhysicsFeedbackState, null> }) {
  return (
    <div className={`rounded-2xl border p-4 text-sm ${feedback.correct ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
      <div className="mb-1 flex items-center gap-2 font-semibold">
        {feedback.correct ? <CheckCircle2 className="size-4 text-primary" /> : <XCircle className="size-4 text-destructive" />}
        {feedback.correct ? 'Correct' : 'Not quite'}
      </div>
      <p className="text-muted-foreground"><MathText text={feedback.message} /></p>
    </div>
  );
}
