import Link from 'next/link';
import { ArrowRight, Cpu, Leaf, LineChart, Sprout, Wallet, Workflow } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/marketing/reveal';

const focusAreas = [
  { icon: Cpu, label: 'Artificial Intelligence' },
  { icon: Wallet, label: 'Fintech' },
  { icon: Sprout, label: 'Agriculture' },
  { icon: LineChart, label: 'Energy' },
  { icon: Leaf, label: 'Climate Innovation' },
  { icon: Workflow, label: 'Digital Transformation' },
];

export function ResearchHub() {
  return (
    <section id="research" className="bg-white py-20 dark:bg-card">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Research & Innovation Hub</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-ink dark:text-foreground sm:text-4xl">
              Research that solves Africa&apos;s challenges
            </h2>
          </div>
          <Button asChild size="lg" className="bg-brand-purple text-white hover:bg-brand-purple/90">
            <Link href="/register/researcher">
              Join Research Projects <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {focusAreas.map((area, index) => (
            <Reveal key={area.label} delayMs={index * 60}>
              <div className="flex items-center gap-4 rounded-2xl border border-black/5 bg-brand-surface p-5 dark:border-white/10 dark:bg-background">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green to-brand-blue">
                  <area.icon className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold text-brand-ink dark:text-foreground">{area.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
