import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getResearchById } from '@/lib/api';

export default async function EmployerResearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const research = await getResearchById(id);
  if (!research) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{research.title}</h1>
          <p className="text-muted-foreground">{research.company}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit Opportunity</Button>
          <Button>Pause Posting</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Opportunity Overview</CardTitle>
            <CardDescription>Manage how this posting appears to students and lecturers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <Badge variant="secondary">{research.field}</Badge>
            <p>{research.description}</p>
            <Button variant="outline" asChild>
              <Link href="/student/research">View on Student Hub</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
            <CardDescription>Interest from the UnivAI community.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Applications</span>
              <span>14</span>
            </div>
            <div className="flex justify-between">
              <span>Shortlisted</span>
              <span>5</span>
            </div>
            <div className="flex justify-between">
              <span>Active Projects</span>
              <span>2</span>
            </div>
            <Button className="w-full" variant="outline">Review Applications</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
