import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getResearchById } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResearchApplyForm } from '@/components/research/research-apply-form';

export default async function ResearchApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await getResearchById(id);
  if (!opportunity) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply: {opportunity.title}</h1>
          <p className="text-muted-foreground">{opportunity.company}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/lecturer/research/${opportunity.id}`}>Back to Opportunity</Link>
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
