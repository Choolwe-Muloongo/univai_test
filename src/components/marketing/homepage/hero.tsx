'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Bot, Compass, Globe2, Smartphone, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

const badges = [
  { icon: Bot, label: 'AI-Powered Learning' },
  { icon: BadgeCheck, label: 'Blockchain Verified' },
  { icon: Smartphone, label: 'Mobile First' },
  { icon: Globe2, label: 'Learn Anywhere' },
];

export function Hero() {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-brand-dark text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-blue/40 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-brand-purple/35 blur-[130px]" />
        <div className="absolute bottom-[-6rem] left-1/3 h-80 w-80 rounded-full bg-brand-green/25 blur-[110px]" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur">
            <Sparkles className="h-4 w-4 text-brand-green" />
            Learn. Earn. Advance.
          </p>

          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Africa&apos;s AI-Powered University for{' '}
            <span className="bg-gradient-to-r from-brand-green via-sky-300 to-brand-purple bg-clip-text text-transparent">
              Career Growth, Skills, and Opportunity
            </span>
          </h1>

          <p className="max-w-xl text-lg leading-8 text-white/75">
            Learn with AI. Earn recognized credentials. Access career opportunities. Build the future.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-brand-green text-brand-dark hover:bg-brand-green/90">
              <Link href="/register">
                Start Learning <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link href="/programs">Explore Programs</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link href="/#opportunities">
                Find Opportunities <Compass className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
            {badges.map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-sm text-white/70">
                <badge.icon className="h-4 w-4 text-brand-green" />
                {badge.label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden lg:block">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm" />

      <FloatingCard className="left-0 top-0" icon={Bot} title="Nova AI Tutor" subtitle="Guiding you 24/7" accent="text-brand-green" />
      <FloatingCard className="right-0 top-0" icon={BadgeCheck} title="Verified Certificate" subtitle="Blockchain-secured" accent="text-sky-300" />
      <FloatingCard className="bottom-0 left-0" icon={Globe2} title="Global Network" subtitle="40+ countries" accent="text-brand-purple" />
      <FloatingCard className="bottom-0 right-0" icon={Smartphone} title="Mobile Ready" subtitle="Learn on any device" accent="text-brand-green" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue via-brand-purple to-brand-green shadow-2xl shadow-brand-purple/30">
          <Sparkles className="h-12 w-12 text-white" />
        </div>
      </div>
    </div>
  );
}

function FloatingCard({
  className,
  icon: Icon,
  title,
  subtitle,
  accent,
}: {
  className: string;
  icon: typeof Bot;
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <div
      className={`absolute w-44 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur-md ${className}`}
    >
      <Icon className={`h-5 w-5 ${accent}`} />
      <p className="mt-2 text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-white/60">{subtitle}</p>
    </div>
  );
}
