import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

import { Reveal } from '@/components/marketing/reveal';

const before = [
  'No clear career path',
  'Expensive education',
  'Limited access to experts',
  'Skills mismatch',
  'Few opportunities',
];

const after = [
  'Industry-ready skills',
  'Professional portfolio',
  'AI productivity mastery',
  'Career opportunities',
  'Entrepreneurship pathways',
];

export function Transformation() {
  return (
    <section className="bg-white py-20 dark:bg-card">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">The Transformation</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-ink dark:text-foreground sm:text-4xl">
            From uncertain to unstoppable
          </h2>
        </Reveal>

        <div className="mt-12 grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <Reveal>
            <div className="h-full rounded-3xl border border-red-100 bg-red-50/60 p-8 dark:border-red-500/20 dark:bg-red-500/5">
              <p className="text-sm font-bold uppercase tracking-wide text-red-500">Before UnivAI</p>
              <ul className="mt-6 space-y-4">
                {before.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-brand-ink dark:text-foreground">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delayMs={120} className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-lg lg:h-16 lg:w-16">
              <ArrowRight className="h-6 w-6 lg:rotate-0 -rotate-90" />
            </div>
          </Reveal>

          <Reveal delayMs={180}>
            <div className="h-full rounded-3xl border border-emerald-100 bg-emerald-50/60 p-8 dark:border-brand-green/20 dark:bg-brand-green/5">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-green">After UnivAI</p>
              <ul className="mt-6 space-y-4">
                {after.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-brand-ink dark:text-foreground">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
