import Link from 'next/link';
import { ArrowRight, Cpu, GraduationCap, HeartPulse, Landmark, ShieldHalf, Wrench } from 'lucide-react';

import { Reveal } from '@/components/marketing/reveal';

const schools = [
  { icon: Cpu, name: 'School of Artificial Intelligence', focus: 'AI, Data Science, Machine Learning' },
  { icon: Landmark, name: 'School of Business & Entrepreneurship', focus: 'Business, Leadership, Innovation' },
  { icon: ShieldHalf, name: 'School of ICT', focus: 'Software Development, Cybersecurity, Cloud' },
  { icon: Wrench, name: 'School of Engineering', focus: 'Civil, Electrical, Mechanical' },
  { icon: HeartPulse, name: 'School of Health Sciences', focus: 'Public Health, Nursing, Healthcare' },
  { icon: GraduationCap, name: 'School of Education', focus: 'Teaching, Learning Technologies' },
];

export function Schools() {
  return (
    <section id="schools" className="bg-white py-20 dark:bg-card">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Explore Our Schools</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-ink dark:text-foreground sm:text-4xl">
              Six schools, one career-focused mission
            </h2>
          </div>
          <Link href="/programs" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline">
            View all programs <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((school, index) => (
            <Reveal key={school.name} delayMs={index * 60}>
              <Link
                href="/programs"
                className="group flex h-full flex-col justify-between rounded-2xl border border-black/5 bg-brand-surface p-6 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-background"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-card">
                    <school.icon className="h-6 w-6 text-brand-purple" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-brand-ink dark:text-foreground">{school.name}</h3>
                  <p className="mt-2 text-sm text-brand-mutedink dark:text-muted-foreground">{school.focus}</p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
                  Explore programs
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
