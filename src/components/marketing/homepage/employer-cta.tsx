import Link from 'next/link';
import { ArrowRight, Briefcase, Globe2, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/marketing/reveal';

export function EmployerCta() {
  return (
    <section id="employers" className="bg-brand-surface py-20 dark:bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue to-brand-purple p-10 text-white sm:p-14 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/70">For Employers</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Hire Skilled Talent</h2>
              <p className="mt-4 max-w-lg text-white/80">
                Access graduates, professionals, researchers, and consultants from across Africa.
              </p>
              <Button asChild size="lg" className="mt-8 bg-white text-brand-blue hover:bg-white/90">
                <Link href="/for-employers">
                  Find Talent <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={Users} label="Verified graduates" value="Ready to hire" />
              <StatCard icon={Briefcase} label="Consultants" value="Project-ready" />
              <StatCard icon={Globe2} label="Reach" value="Across Africa" />
              <StatCard icon={ArrowRight} label="Onboarding" value="Fast & simple" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
      <Icon className="h-5 w-5 text-brand-green" />
      <p className="mt-3 text-sm font-semibold text-white">{value}</p>
      <p className="text-xs text-white/70">{label}</p>
    </div>
  );
}
