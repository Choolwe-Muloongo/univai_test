'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, UserCheck } from 'lucide-react';

import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { Button } from '@/components/ui/button';
import { Ecosystem } from '@/components/marketing/homepage/ecosystem';
import { EmployerCta } from '@/components/marketing/homepage/employer-cta';
import { Hero } from '@/components/marketing/homepage/hero';
import { Partners } from '@/components/marketing/homepage/partners';
import { ResearchHub } from '@/components/marketing/homepage/research-hub';
import { Rewards } from '@/components/marketing/homepage/rewards';
import { Schools } from '@/components/marketing/homepage/schools';
import { Stats } from '@/components/marketing/homepage/stats';
import { Transformation } from '@/components/marketing/homepage/transformation';
import { WhyUnivAI } from '@/components/marketing/homepage/why-univai';
import { getAdmissionsSettings } from '@/lib/api';

type LecturerApplicationNotice = { open: boolean; message: string };

export default function HomePage() {
  const [lecturerApplications, setLecturerApplications] = useState<LecturerApplicationNotice>({ open: false, message: '' });

  useEffect(() => {
    let mounted = true;

    getAdmissionsSettings()
      .then((settings) => {
        if (!mounted) return;
        setLecturerApplications({
          open: Boolean(settings.lecturerApplicationsOpen),
          message: typeof settings.lecturerApplicationsMessage === 'string' ? settings.lecturerApplicationsMessage : '',
        });
      })
      .catch((cause) => {
        console.error('Failed to load admissions settings', cause);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Hero />

        {lecturerApplications.open ? (
          <section className="border-b bg-brand-surface px-4 py-6 dark:bg-background sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-2xl border border-brand-blue/20 bg-white p-6 dark:bg-card md:flex-row md:items-center md:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-white">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Lecturer recruitment is open</p>
                  <h2 className="mt-1 text-xl font-bold text-brand-ink dark:text-foreground">Apply to teach with UnivAI</h2>
                  <p className="mt-2 max-w-2xl text-sm text-brand-mutedink dark:text-muted-foreground">
                    {lecturerApplications.message || 'UnivAI is accepting lecturer applications. Submit your teaching profile for academic review.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Button asChild>
                  <Link href="/register/lecturer">
                    Apply as Lecturer <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/login/lecturer">Lecturer Login</Link>
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        <WhyUnivAI />
        <Transformation />
        <Ecosystem />
        <Stats />
        <Schools />
        <EmployerCta />
        <ResearchHub />
        <Rewards />
        <Partners />
      </main>
      <SiteFooter />
    </div>
  );
}
