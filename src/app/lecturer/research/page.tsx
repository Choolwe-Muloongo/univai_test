'use client';

import { ArrowRight, FlaskConical, Building } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getResearchOpportunities } from '@/lib/api';
import type { ResearchOpportunity } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function ResearchPage() {
  const [researchOpportunities, setResearchOpportunities] = useState<ResearchOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadResearch() {
      try {
        const opportunities = await getResearchOpportunities();
        if (!isMounted) return;
        setResearchOpportunities(opportunities);
        setError(null);
      } catch (err) {
        console.error('Failed to load lecturer research opportunities', err);
        if (isMounted) {
          setResearchOpportunities([]);
          setError('Research opportunities are unavailable. Please refresh and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadResearch();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Research Hub</h1>
        <p className="text-muted-foreground">
          Explore cutting-edge research opportunities from our industry partners.
        </p>
      </div>

      {loading ? <PageLoading message="Loading research opportunities..." /> : null}
      {error ? <PageError message={error} actionHref="/lecturer/dashboard" actionLabel="Back to Dashboard" /> : null}

      {!loading && !error && researchOpportunities.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No research opportunities are available yet.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {researchOpportunities.map((opp) => (
          <Card key={opp.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FlaskConical className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{opp.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 pt-1">
                    <Building className="h-4 w-4" />
                    {opp.company}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <Badge variant="secondary">{opp.field}</Badge>
              <p className="text-muted-foreground">{opp.description}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/lecturer/research/${opp.id}`}>
                  Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
