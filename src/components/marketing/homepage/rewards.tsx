import { Award, Gift, Handshake, Network, Trophy } from 'lucide-react';

import { Reveal } from '@/components/marketing/reveal';

const benefits = [
  { icon: Trophy, title: 'Scholarships', description: 'Merit and need-based scholarships across programs.' },
  { icon: Award, title: 'Achievement Rewards', description: 'Milestones and streaks that translate into real rewards.' },
  { icon: Gift, title: 'Referral Incentives', description: 'Earn when you bring other learners into the community.' },
  { icon: Handshake, title: 'Career Opportunities', description: 'Direct pathways into jobs, internships, and consulting.' },
  { icon: Network, title: 'Alumni Network', description: 'A growing network of graduates across Africa and beyond.' },
];

export function Rewards() {
  return (
    <section id="opportunities" className="bg-brand-surface py-20 dark:bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Rewards & Opportunities</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-ink dark:text-foreground sm:text-4xl">
            Learn today. Benefit tomorrow.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {benefits.map((benefit, index) => (
            <Reveal key={benefit.title} delayMs={index * 60}>
              <div className="h-full rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/15">
                  <benefit.icon className="h-5 w-5 text-brand-green" />
                </div>
                <h3 className="mt-4 font-bold text-brand-ink dark:text-foreground">{benefit.title}</h3>
                <p className="mt-2 text-sm text-brand-mutedink dark:text-muted-foreground">{benefit.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
