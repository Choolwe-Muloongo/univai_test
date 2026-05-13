'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getResearchById } from '@/lib/api';
import type { ResearchOpportunity } from '@/lib/api/types';
import { ResearchApplyForm } from '@/components/research/research-apply-form';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { readRouteParam } from '@/lib/route-params';

export default function ResearchApplyPage() {
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
        console.error('Failed to load research application', err);
        if (isMounted) {
          setOpportunity(null);
          setError('Research application details are unavailable. Please refresh and try again.');
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

  if (loading) {
    return <PageLoading message="Loading research application..." />;
  }

  if (error) {
    return <PageError message={error} actionHref="/student/research" actionLabel="Back to Research Hub" />;
  }

  if (!opportunity) {
    return (
      <PageError
        title="Research opportunity not found"
        message="This opportunity is unavailable or has been removed."
        actionHref="/student/research"
        actionLabel="Back to Research Hub"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply: {opportunity.title}</h1>
          <p className="text-muted-foreground">{opportunity.company}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/student/research/${opportunity.id}`}>Back to Opportunity</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Research Application</CardTitle>
            <CardDescription>Share your interests, experience, and availability.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResearchApplyForm opportunityId={opportunity.id} />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Opportunity Summary</CardTitle>
            <CardDescription>Make sure it aligns with your goals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Field</span>
              <Badge variant="secondary">{opportunity.field}</Badge>
            </div>
            <p>{opportunity.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
