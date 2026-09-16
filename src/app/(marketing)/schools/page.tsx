'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { getPrograms, getSchools } from '@/lib/api';
import { countLabel, describeSchool, schoolsWithPrograms, type SchoolWithPrograms } from '@/lib/schools';

export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolWithPrograms[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getSchools(), getPrograms()])
      .then(([schoolList, programList]) => {
        if (mounted) setSchools(schoolsWithPrograms(schoolList, programList));
      })
      .catch(() => {
        if (mounted) setSchools([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <main>
        <section className="bg-slate-950 py-24 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="font-semibold text-blue-400">OUR SCHOOLS</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-extrabold sm:text-6xl">Find the field where your future begins.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Explore disciplines built for Africa&apos;s changing economy, from artificial intelligence to healthcare and entrepreneurship.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-64 animate-pulse rounded-[2rem] border bg-white shadow-sm" />
              ))}
            </div>
          ) : schools.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {schools.map((school) => {
                const Icon = school.icon;
                return (
                  <Link
                    key={school.id}
                    href={`/schools/${school.id}`}
                    className="group flex flex-col rounded-[2rem] border bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <Icon />
                    </div>
                    <h2 className="mt-7 text-2xl font-bold">{school.name}</h2>
                    <p className="mt-3 flex-1 leading-7 text-slate-600">{describeSchool(school)}</p>
                    <span className="mt-7 inline-flex items-center gap-2 font-semibold text-blue-700">
                      {countLabel(school.programs.length, 'programme')}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[2rem] border bg-white p-10 text-slate-600">
              Schools are being prepared.{' '}
              <Link href="/register" className="font-semibold text-blue-700">
                Join UnivAI
              </Link>{' '}
              to be notified.
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
