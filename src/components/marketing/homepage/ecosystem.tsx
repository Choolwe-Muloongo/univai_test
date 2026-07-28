import { BookOpen, FlaskConical, Gift, Rocket, Wrench } from 'lucide-react';

import { Reveal } from '@/components/marketing/reveal';

const steps = [
  { icon: BookOpen, title: 'Learn', description: 'Courses and programs across in-demand fields.' },
  { icon: Gift, title: 'Earn', description: 'Scholarships and referral rewards along the way.' },
  { icon: FlaskConical, title: 'Build', description: 'Research and innovation projects with real impact.' },
  { icon: Wrench, title: 'Work', description: 'Jobs, internships, and consulting opportunities.' },
  { icon: Rocket, title: 'Launch', description: 'Startup incubation and entrepreneurship support.' },
];

export function Ecosystem() {
  return (
    <section className="bg-brand-surface py-20 dark:bg-background" id="ecosystem">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">The UnivAI Ecosystem</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-ink dark:text-foreground sm:text-4xl">
            Learn &rarr; Earn &rarr; Build &rarr; Work &rarr; Launch
          </h2>
        </Reveal>

        <div className="relative mt-16">
          <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-brand-blue via-brand-purple to-brand-green lg:left-0 lg:right-0 lg:top-8 lg:h-px lg:w-auto lg:bg-gradient-to-r" />

          <div className="grid gap-10 lg:grid-cols-5 lg:gap-6">
            {steps.map((step, index) => (
              <Reveal key={step.title} delayMs={index * 90} className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center">
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-4 ring-brand-surface dark:bg-card dark:ring-background">
                  <step.icon className="h-7 w-7 text-brand-blue" />
                </div>
                <div className="lg:mt-2">
                  <p className="text-lg font-bold text-brand-ink dark:text-foreground">{step.title}</p>
                  <p className="mt-1 text-sm text-brand-mutedink dark:text-muted-foreground">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
