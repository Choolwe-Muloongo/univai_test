import { BadgeCheck, Bot, Briefcase, Smartphone, Trophy, Users } from 'lucide-react';

import { Reveal } from '@/components/marketing/reveal';

const cards = [
  {
    icon: Bot,
    title: 'Learn with AI',
    description: '24/7 AI tutors and study assistants that adapt to how you learn.',
  },
  {
    icon: Trophy,
    title: 'Earn Recognized Credentials',
    description: 'Certificates, diplomas, and degree programs employers trust.',
  },
  {
    icon: Smartphone,
    title: 'Learn Anywhere',
    description: 'Mobile-first learning designed for Africa, on or offline.',
  },
  {
    icon: Briefcase,
    title: 'Career Focused',
    description: 'Programs aligned to real industry demand and hiring needs.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Credentials',
    description: 'Blockchain-secured certificates and transcripts you can prove.',
  },
  {
    icon: Users,
    title: 'Community & Networking',
    description: 'Connect with learners, mentors, employers, and innovators.',
  },
];

export function WhyUnivAI() {
  return (
    <section id="why-univai" className="bg-brand-surface py-20 dark:bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Why UnivAI</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-ink dark:text-foreground sm:text-4xl">
            One platform for the entire journey
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <Reveal key={card.title} delayMs={index * 60}>
              <div className="h-full rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple">
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-brand-ink dark:text-foreground">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-brand-mutedink dark:text-muted-foreground">{card.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
