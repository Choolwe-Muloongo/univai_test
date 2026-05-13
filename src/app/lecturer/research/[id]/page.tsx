'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getResearchById } from '@/lib/api';
import type { ResearchOpportunity } from '@/lib/api/types';
import { FlaskConical, Building } from 'lucide-react';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { readRouteParam } from '@/lib/route-params';

const researchDetails: Record<string, { focus: string[]; expectations: string[] }> = {
  r1: {
    focus: ['Clinical data analysis', 'Model validation workflows', 'Ethical AI in healthcare'],
    expectations: ['Experience with ML basics', 'Comfortable reading research papers', 'Collaborative mindset'],
  },
  r2: {
    focus: ['Adaptive UI patterns', 'Generative design systems', 'User experience testing'],
    expectations: ['Product design or frontend background', 'Interest in AI tooling', 'Portfolio of UI work'],
  },
  r3: {
    focus: ['Financial protocol research', 'Risk modeling', 'Scalability experiments'],
    expectations: ['Knowledge of fintech fundamentals', 'Research writing skills', 'Interest in systems design'],
  },
};

export default function ResearchDetailPage() {
  const params = useParams();
  const id = readRouteParam(params, 'id');
  const [opportunity, setOpportunity] = useState<ResearchOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOpportunity() {
      if (!id) {
        setLoading(false);
        setError('Research route is missing an id.');
        return;
      }

      try {
        const nextOpportunity = await getResearchById(id);
        if (!isMounted) return;
        setOpportunity(nextOpportunity);
        setError(null);
      } catch (err) {
        console.error('Failed to load lecturer research detail', err);
        if (isMounted) {
          setOpportunity(null);
          setError('Research opportunity details are unavailable. Please refresh and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOpportunity();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const detail = useMemo(() => opportunity ? researchDetails[opportunity.id] : undefined, [opportunity]);

  if (loading) {
    return <PageLoading message="Loading research opportunity..." />;
  }

  if (error) {
    return <PageError message={error} actionHref="/lecturer/research" actionLabel="Back to Research Hub" />;
  }

  if (!opportunity) {
    return (
      <PageError
        title="Research opportunity not found"
        message="This opportunity is unavailable or has been removed."
        actionHref="/lecturer/research"
        actionLabel="Back to Research Hub"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="outline" asChild>
          <Link href="/lecturer/research">Back to Research Hub</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-3xl">{opportunity.title}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-sm">
                <Building className="h-4 w-4" /> {opportunity.company}
              </span>
              <Badge variant="secondary">{opportunity.field}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Opportunity Overview</h3>
              <p>{opportunity.description}</p>
            </section>
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Research Focus</h3>
              {detail?.focus.length ? (
                <ul className="list-disc space-y-1 pl-5">
                  {detail.focus.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>Research focus areas will appear once the supervising team publishes the full brief.</p>
              )}
            </section>
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">What We&apos;re Looking For</h3>
              {detail?.expectations.length ? (
                <ul className="list-disc space-y-1 pl-5">
                  {detail.expectations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>Expectations will appear once the research brief is approved.</p>
              )}
            </section>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Apply to Research</CardTitle>
            <CardDescription>Share your interests and past work.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" asChild>
              <Link href={`/lecturer/research/${opportunity.id}/apply`}>Apply Now</Link>
            </Button>
            <Button variant="outline" className="w-full">Save Opportunity</Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FlaskConical className="h-4 w-4" /> Applications reviewed weekly.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
