'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PlusCircle, FlaskConical } from 'lucide-react';
import { getResearchOpportunities } from '@/lib/api';
import type { ResearchOpportunity } from '@/lib/api/types';
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
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function EmployerResearchPage() {
  const [opportunities, setOpportunities] = useState<ResearchOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadResearch() {
      try {
        const nextOpportunities = await getResearchOpportunities();
        if (!isMounted) return;
        setOpportunities(nextOpportunities);
        setError(null);
      } catch (err) {
        console.error('Failed to load employer research postings', err);
        if (isMounted) {
          setOpportunities([]);
          setError('Research postings are unavailable. Please refresh and try again.');
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Research Postings</h1>
          <p className="text-muted-foreground">
            Collaborate with UnivAI faculty and students on applied research.
          </p>
        </div>
        <Button asChild>
          <Link href="/employer/research/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Post Research
          </Link>
        </Button>
      </div>

      {loading ? <PageLoading message="Loading research postings..." /> : null}
      {error ? <PageError message={error} actionHref="/employer/dashboard" actionLabel="Back to Dashboard" /> : null}

      {!loading && !error && opportunities.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No research postings are available yet.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opp) => (
          <Card key={opp.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{opp.title}</CardTitle>
              <CardDescription>{opp.company}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-sm text-muted-foreground">
              <Badge variant="secondary">{opp.field}</Badge>
              <p className="line-clamp-3">{opp.description}</p>
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                Applicants appear after the posting receives interest.
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/employer/research/${opp.id}`}>Manage Posting</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
