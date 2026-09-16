'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowRight, BookOpen } from 'lucide-react';

import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Button } from '@/components/ui/button';
import { getPrograms, getSchools } from '@/lib/api';
import type { Program, School } from '@/lib/api/types';
import { countLabel, schoolIcon } from '@/lib/schools';

export default function SchoolDetailPage() {
  const params = useParams<{ schoolId: string }>();
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getSchools(), getPrograms()])
      .then(([schoolList, programList]) => {
        if (!mounted) return;
        setSchools(schoolList);
        setPrograms(programList);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const school = useMemo(
    () => schools.find((item) => String(item.id) === params.schoolId),
    [params.schoolId, schools]
  );

  const schoolPrograms = useMemo(
    () => programs.filter((program) => program.schoolId === params.schoolId),
    [params.schoolId, programs]
  );

  const Icon = schoolIcon(params.schoolId);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="h-10 w-72 max-w-full animate-pulse rounded-xl bg-slate-200" />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-56 animate-pulse rounded-3xl bg-white shadow-sm" />
            ))}
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold">School not found</h1>
          <p className="mt-4 text-slate-600">This school is not currently available.</p>
          <Button asChild className="mt-8 rounded-full">
            <Link href="/schools">Back to all schools</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <main>
        <section className="bg-slate-950 py-24 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Link href="/schools" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
              ← All schools
            </Link>
            <div className="mt-6 flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-blue-300">
                <Icon />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold sm:text-5xl">{school.name}</h1>
                <p className="mt-2 text-slate-300">{countLabel(schoolPrograms.length, 'programme')} available.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold">Programmes in this school</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {schoolPrograms.length ? (
              schoolPrograms.map((program) => (
                <Link
                  key={program.id}
                  href={`/programmes/${program.id}`}
                  className="group flex flex-col rounded-3xl bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex justify-between">
                    <BookOpen className="h-7 w-7 text-blue-700" />
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-700" />
                  </div>
                  <h3 className="mt-7 text-xl font-bold">{program.title}</h3>
                  {program.qualificationLevelName ? (
                    <p className="mt-2 text-sm font-medium text-blue-700">{program.qualificationLevelName}</p>
                  ) : null}
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                    {program.description || 'Explore this academic pathway and its learning outcomes.'}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                    View programme <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))
            ) : (
              <div className="rounded-3xl bg-white p-8 text-slate-600 md:col-span-2 lg:col-span-3">
                Programmes for this school are being prepared.{' '}
                <Link href="/register" className="font-semibold text-blue-700">
                  Join UnivAI
                </Link>{' '}
                to be notified.
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
