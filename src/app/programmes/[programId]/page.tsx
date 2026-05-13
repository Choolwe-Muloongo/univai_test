'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ElementType } from 'react';
import { useParams } from 'next/navigation';
import { BadgeCheck, BookOpen, GraduationCap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getPrograms } from '@/lib/api';
import type { Program } from '@/lib/api/types';

export default function PublicProgrammePage() {
  const params = useParams<{ programId: string }>();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getPrograms()
      .then((items) => {
        if (mounted) setPrograms(items);
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Programme is unavailable.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const program = useMemo(
    () => programs.find((item) => item.id === params.programId),
    [params.programId, programs]
  );

  if (loading) return <main className="mx-auto max-w-5xl px-4 py-8"><PageLoading message="Loading programme..." /></main>;
  if (error) return <main className="mx-auto max-w-5xl px-4 py-8"><PageError message={error} actionHref="/" actionLabel="Back home" /></main>;
  if (!program) return <main className="mx-auto max-w-5xl px-4 py-8"><PageError title="Programme not found" message="This programme is not currently available." actionHref="/" actionLabel="Back home" /></main>;

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl space-y-5 px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-normal text-primary-foreground/70">{program.schoolName || program.departmentName || 'UnivAI programme'}</p>
          <h1 className="text-4xl font-bold tracking-normal">{program.title}</h1>
          <p className="max-w-3xl text-primary-foreground/85">{program.description}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <Link href={`/register?programId=${encodeURIComponent(program.id)}`}>Apply for this programme</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/">Back to catalogue</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.5fr_0.8fr] lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Admission Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-line text-muted-foreground">
              {program.admissionRequirements || 'Admin has not published specific requirements for this programme yet.'}
            </p>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              Registration should use these programme-specific requirements instead of a single generic rule.
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <InfoCard icon={GraduationCap} label="Award" value={program.qualificationLevel?.name || program.qualificationLevelName || 'Programme'} />
          <InfoCard icon={BookOpen} label="Credits" value={String(program.credits || program.totalCredits || 'Pending')} />
          <InfoCard icon={BadgeCheck} label="Delivery" value={(program.supportedDeliveryModes || program.deliveryModes || ['online']).join(', ')} />
        </div>
      </div>
    </main>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="size-5 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
