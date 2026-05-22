'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { ChemistryInteraction, ChemistryParticle, ChemistrySpecies, ChemistryTeachingStep, ChemistryVisual } from './types';

type ChemistryRendererMode = 'student' | 'preview' | 'editor';

type Props = {
  visual: ChemistryVisual;
  mode: ChemistryRendererMode;
};

export function ChemistryVisualRenderer({ visual, mode }: Props) {
  return (
    <div className="space-y-4 rounded-2xl border bg-background p-4 shadow-sm">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Chemistry Engine · {visual.visualType.replace(/_/g, ' ')}
        </p>
        {visual.title ? <h3 className="text-lg font-semibold">{visual.title}</h3> : null}
        {visual.body ? <p className="text-sm leading-6 text-muted-foreground">{visual.body}</p> : null}
      </header>

      {visual.equation ? <ChemicalEquationView visual={visual} /> : null}
      {visual.visualType === 'molecule_builder' ? <MoleculeBuilderView visual={visual} /> : null}
      {visual.visualType === 'atom_structure' ? <AtomStructureView visual={visual} /> : null}
      {visual.visualType === 'periodic_table' ? <PeriodicTableMiniView visual={visual} /> : null}
      {visual.visualType === 'stoichiometry' ? <StoichiometryView visual={visual} /> : null}
      {visual.visualType === 'lab_observation' ? <LabObservationView visual={visual} /> : null}
      {visual.tables?.length && visual.visualType !== 'lab_observation' ? <DataTablesView visual={visual} /> : null}
      {visual.steps?.length ? <TeachingSteps steps={visual.steps} /> : null}
      {visual.interactions?.length ? <InteractionPanel interactions={visual.interactions} species={allSpecies(visual)} particles={visual.particles ?? []} mode={mode} /> : null}
    </div>
  );
}

function ChemicalEquationView({ visual }: { visual: ChemistryVisual }) {
  const equation = visual.equation;
  if (!equation) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border bg-muted/20 p-4">
      <div className="flex min-w-max items-center gap-3 text-lg font-semibold">
        <EquationSide species={equation.reactants} />
        <span aria-label={equation.reversible ? 'reversible reaction' : 'yields'}>{equation.reversible ? '⇌' : '→'}</span>
        <EquationSide species={equation.products} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {equation.balanced ? <span className="rounded-full border bg-background px-2 py-1">balanced</span> : null}
        {equation.ionic ? <span className="rounded-full border bg-background px-2 py-1">ionic</span> : null}
        {equation.netIonic ? <span className="rounded-full border bg-background px-2 py-1">net ionic</span> : null}
        {equation.conditions?.length ? <span className="rounded-full border bg-background px-2 py-1">{equation.conditions.join(', ')}</span> : null}
      </div>
    </div>
  );
}

function EquationSide({ species }: { species: ChemistrySpecies[] }) {
  return (
    <div className="flex items-center gap-2">
      {species.map((item, index) => (
        <span key={item.id} className="inline-flex items-center gap-2">
          {index > 0 ? <span>+</span> : null}
          <span className="rounded-xl border bg-background px-3 py-2">
            {item.coefficient && item.coefficient !== 1 ? item.coefficient : ''}
            <Formula text={item.formula} />
            {item.charge ? <sup>{item.charge}</sup> : null}
            {item.state ? <sub>({item.state})</sub> : null}
          </span>
        </span>
      ))}
    </div>
  );
}

function Formula({ text }: { text: string }) {
  const parts = text.split(/(\d+)/g).filter(Boolean);
  return <span>{parts.map((part, index) => /^\d+$/.test(part) ? <sub key={`${part}-${index}`}>{part}</sub> : <span key={`${part}-${index}`}>{part}</span>)}</span>;
}

function TeachingSteps({ steps }: { steps: ChemistryTeachingStep[] }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Guided explanation</p>
      {steps.map((step, index) => (
        <div key={step.id} className="rounded-2xl border bg-muted/10 p-4">
          <p className="text-sm font-semibold">{index + 1}. {step.title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.explanation}</p>
          {step.equation ? <div className="mt-3 rounded-xl bg-background p-3 font-mono text-sm">{step.equation}</div> : null}
          {step.formula ? <div className="mt-3 rounded-xl bg-background p-3 font-mono text-sm">{step.formula}</div> : null}
          {step.substitution ? <div className="mt-3 rounded-xl bg-background p-3 font-mono text-sm">{step.substitution}</div> : null}
          {step.answer ? <p className="mt-3 text-sm font-semibold">Answer: {step.answer}</p> : null}
          {step.hint ? <p className="mt-2 text-xs text-muted-foreground">Hint: {step.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

function InteractionPanel({ interactions, species, particles, mode }: { interactions: ChemistryInteraction[]; species: ChemistrySpecies[]; particles: ChemistryParticle[]; mode: ChemistryRendererMode }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sequence, setSequence] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const interaction = interactions[0];
  const disabled = mode === 'preview';

  if (!interaction) return null;

  if (interaction.type === 'balance_equation') {
    return (
      <InteractionShell prompt={interaction.prompt} feedback={feedback} hints={interaction.hints}>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {species.map((item) => (
            <label key={item.id} className="text-sm">
              <span className="mb-1 block text-muted-foreground"><Formula text={item.formula} /></span>
              <input className="w-full rounded-xl border bg-background px-3 py-2" inputMode="numeric" disabled={disabled} value={answers[item.id] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))} />
            </label>
          ))}
        </div>
        <CheckButton disabled={disabled} onClick={() => {
          const correct = Object.entries(interaction.correctCoefficients).every(([id, value]) => Number(answers[id]) === value);
          setFeedback(correct ? interaction.feedback?.correct ?? 'Correct.' : interaction.feedback?.incorrect ?? 'Not quite. Count atoms on both sides.');
        }} />
      </InteractionShell>
    );
  }

  if (interaction.type === 'numeric_answer') {
    const answerKey = interaction.id ?? 'numeric-answer';
    return (
      <InteractionShell prompt={interaction.prompt} feedback={feedback} hints={interaction.hints}>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input className="w-full rounded-xl border bg-background px-3 py-2" inputMode="decimal" disabled={disabled} value={answers[answerKey] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [answerKey]: event.target.value }))} />
          {interaction.unit ? <span className="rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground">{interaction.unit}</span> : null}
        </div>
        <CheckButton disabled={disabled} onClick={() => {
          const value = Number(answers[answerKey]);
          const tolerance = interaction.tolerance ?? 0;
          const correct = Number.isFinite(value) && Math.abs(value - interaction.correctAnswer) <= tolerance;
          setFeedback(correct ? interaction.feedback?.correct ?? 'Correct.' : interaction.feedback?.incorrect ?? 'Not quite. Check the calculation and units.');
        }} />
      </InteractionShell>
    );
  }

  if (interaction.type === 'fill_formula') {
    const answerKey = interaction.id ?? 'fill-formula';
    return (
      <InteractionShell prompt={interaction.prompt} feedback={feedback} hints={interaction.hints}>
        <input className="mt-3 w-full rounded-xl border bg-background px-3 py-2 font-mono" disabled={disabled} value={answers[answerKey] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [answerKey]: event.target.value }))} placeholder="Example: H2O or H₂O" />
        <CheckButton disabled={disabled} onClick={() => {
          const correct = normalizeFormula(answers[answerKey]) === normalizeFormula(interaction.correctAnswer);
          setFeedback(correct ? interaction.feedback?.correct ?? 'Correct formula.' : interaction.feedback?.incorrect ?? 'Not quite. Check the symbols, subscripts, and charge.');
        }} />
      </InteractionShell>
    );
  }

  if (interaction.type === 'classify_reaction') {
    const answerKey = interaction.id ?? 'classify-reaction';
    return (
      <InteractionShell prompt={interaction.prompt} feedback={feedback} hints={interaction.hints}>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {interaction.options.map((option) => <button key={option} type="button" disabled={disabled} onClick={() => setAnswers((current) => ({ ...current, [answerKey]: option }))} className={`rounded-xl border bg-background px-3 py-2 text-left text-sm transition ${answers[answerKey] === option ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}>{option}</button>)}
        </div>
        <CheckButton disabled={disabled} onClick={() => {
          const correct = normalizeAnswer(answers[answerKey]) === normalizeAnswer(interaction.correctAnswer);
          setFeedback(correct ? interaction.feedback?.correct ?? 'Correct.' : interaction.feedback?.incorrect ?? 'Not quite. Review the reaction pattern.');
        }} />
      </InteractionShell>
    );
  }

  if (interaction.type === 'sequence_steps') {
    const pool = interaction.correctOrder.filter((id) => !sequence.includes(id));
    return (
      <InteractionShell prompt={interaction.prompt} feedback={feedback} hints={interaction.hints}>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border bg-background p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Available steps</p>
            <div className="space-y-2">{pool.map((id) => <button key={id} type="button" disabled={disabled} onClick={() => setSequence((current) => [...current, id])} className="w-full rounded-xl border px-3 py-2 text-left text-sm hover:border-primary/60">{stepLabel(id)}</button>)}</div>
          </div>
          <div className="rounded-2xl border bg-background p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Your order</p>
            <div className="space-y-2">{sequence.map((id, index) => <button key={`${id}-${index}`} type="button" disabled={disabled} onClick={() => setSequence((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="w-full rounded-xl border px-3 py-2 text-left text-sm">{index + 1}. {stepLabel(id)}</button>)}</div>
          </div>
        </div>
        <CheckButton disabled={disabled || sequence.length !== interaction.correctOrder.length} onClick={() => {
          const correct = sequence.join('|') === interaction.correctOrder.join('|');
          setFeedback(correct ? interaction.feedback?.correct ?? 'Correct order.' : interaction.feedback?.incorrect ?? 'Not quite. Recheck the process order.');
        }} />
      </InteractionShell>
    );
  }

  if (interaction.type === 'classify_particles') {
    const items = particles.length ? particles : Object.keys(interaction.correctMap).map((id) => ({ id, label: id, type: 'atom' as const }));
    return (
      <InteractionShell prompt={interaction.prompt} feedback={feedback} hints={interaction.hints}>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {items.map((particle) => (
            <label key={particle.id} className="rounded-2xl border bg-background p-3 text-sm">
              <span className="mb-2 block font-medium">{particle.label}</span>
              <select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" disabled={disabled} value={answers[particle.id] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [particle.id]: event.target.value }))}>
                <option value="">Choose category</option>
                {interaction.categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
          ))}
        </div>
        <CheckButton disabled={disabled} onClick={() => {
          const correct = Object.entries(interaction.correctMap).every(([id, category]) => normalizeAnswer(answers[id]) === normalizeAnswer(category));
          setFeedback(correct ? interaction.feedback?.correct ?? 'Correct classification.' : interaction.feedback?.incorrect ?? 'Not quite. Check each particle type.');
        }} />
      </InteractionShell>
    );
  }

  return null;
}

function InteractionShell({ prompt, feedback, hints, children }: { prompt: string; feedback: string | null; hints?: string[]; children: ReactNode }) {
  return <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="text-sm font-semibold">{prompt}</p>{children}{feedback ? <p className="mt-3 text-sm text-muted-foreground">{feedback}</p> : null}{hints?.length ? <Hints hints={hints} /> : null}</div>;
}

function CheckButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return <button type="button" className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={disabled} onClick={onClick}>Check</button>;
}

function Hints({ hints }: { hints: string[] }) {
  return <details className="mt-3 rounded-xl border bg-background p-3 text-sm"><summary className="cursor-pointer font-medium">Hints</summary><ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{hints.map((hint) => <li key={hint}>{hint}</li>)}</ul></details>;
}

function MoleculeBuilderView({ visual }: { visual: ChemistryVisual }) {
  const particles = visual.particles ?? [];
  const species = visual.species ?? [];
  return <div className="rounded-2xl border bg-muted/10 p-4"><p className="text-sm font-semibold">Molecule builder</p><div className="mt-3 flex flex-wrap gap-2">{[...species.map((item) => ({ id: item.id, label: item.formula, detail: item.name })), ...particles.map((item) => ({ id: item.id, label: item.label, detail: item.type }))].map((item) => <div key={item.id} className="rounded-2xl border bg-background px-4 py-3 text-sm"><p className="font-mono font-semibold"><Formula text={item.label} /></p>{item.detail ? <p className="text-xs text-muted-foreground">{item.detail}</p> : null}</div>)}</div></div>;
}

function StoichiometryView({ visual }: { visual: ChemistryVisual }) {
  const summary = useMemo(() => visual.steps?.find((step) => step.answer)?.answer ?? 'Use the balanced equation to move from given amount to required amount.', [visual.steps]);
  return <div className="rounded-2xl border bg-muted/10 p-4"><p className="text-sm font-semibold">Stoichiometry pathway</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><div className="rounded-xl border bg-background p-3 text-sm">Given</div><div className="rounded-xl border bg-background p-3 text-sm">Mole ratio</div><div className="rounded-xl border bg-background p-3 text-sm">{summary}</div></div></div>;
}

function AtomStructureView({ visual }: { visual: ChemistryVisual }) {
  const particles = visual.particles ?? [];
  return <div className="rounded-2xl border bg-muted/10 p-4"><p className="text-sm font-semibold">Atom structure</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{particles.map((particle) => <div key={particle.id} className="rounded-xl border bg-background p-3 text-sm"><p className="font-medium">{particle.label}</p><p className="text-muted-foreground">{particle.count ?? 0}</p></div>)}</div></div>;
}

function PeriodicTableMiniView({ visual }: { visual: ChemistryVisual }) {
  const elements = Array.isArray(visual.metadata?.elements) ? visual.metadata.elements as Array<Record<string, unknown>> : [];
  return <div className="rounded-2xl border bg-muted/10 p-4"><p className="text-sm font-semibold">Periodic table activity</p><div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">{(elements.length ? elements : [{ symbol: 'H', name: 'Hydrogen', atomicNumber: 1 }, { symbol: 'C', name: 'Carbon', atomicNumber: 6 }, { symbol: 'N', name: 'Nitrogen', atomicNumber: 7 }, { symbol: 'O', name: 'Oxygen', atomicNumber: 8 }, { symbol: 'Na', name: 'Sodium', atomicNumber: 11 }, { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17 }, { symbol: 'Fe', name: 'Iron', atomicNumber: 26 }, { symbol: 'Cu', name: 'Copper', atomicNumber: 29 }]).map((element) => <div key={String(element.symbol)} className="rounded-xl border bg-background p-2 text-center"><p className="text-xs text-muted-foreground">{String(element.atomicNumber ?? '')}</p><p className="text-lg font-bold">{String(element.symbol ?? '')}</p><p className="truncate text-[10px] text-muted-foreground">{String(element.name ?? '')}</p></div>)}</div></div>;
}

function LabObservationView({ visual }: { visual: ChemistryVisual }) { return <DataTablesView visual={visual} fallbackTitle="Lab observations" />; }

function DataTablesView({ visual, fallbackTitle = 'Data table' }: { visual: ChemistryVisual; fallbackTitle?: string }) {
  const tables = visual.tables ?? [];
  if (!tables.length) return null;
  return <div className="space-y-3">{tables.map((table) => <div key={table.id} className="overflow-x-auto rounded-2xl border bg-muted/10 p-4"><p className="mb-3 text-sm font-semibold">{table.title ?? fallbackTitle}</p><table className="w-full text-sm"><thead><tr>{table.columns.map((column) => <th key={column} className="border-b p-2 text-left">{column}</th>)}</tr></thead><tbody>{table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b p-2">{cell}</td>)}</tr>)}</tbody></table></div>)}</div>;
}

function allSpecies(visual: ChemistryVisual) { return [...(visual.equation?.reactants ?? []), ...(visual.equation?.products ?? []), ...(visual.species ?? [])]; }
function normalizeAnswer(value: unknown) { return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' '); }
function normalizeFormula(value: unknown) { return normalizeAnswer(value).replace(/[₂]/g, '2').replace(/[₃]/g, '3').replace(/[₄]/g, '4').replace(/[₅]/g, '5').replace(/[₆]/g, '6').replace(/[₇]/g, '7').replace(/[₈]/g, '8').replace(/[₉]/g, '9').replace(/[₀]/g, '0').replace(/\s+/g, ''); }
function stepLabel(id: string) { return id.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
