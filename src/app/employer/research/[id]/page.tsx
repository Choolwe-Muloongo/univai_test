import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getResearchApplications, getResearchById } from '@/lib/api';

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
  const applications = await getResearchApplications(id);

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
            {applications.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Engagement metrics will appear once applications are received.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-semibold">{applications.length} applications</p>
                {applications.slice(0, 3).map((app) => (
                  <div key={app.id} className="rounded-lg border p-3 text-xs">
                    <p className="font-semibold">{app.fullName}</p>
                    <p className="text-muted-foreground">{app.email}</p>
                    <p className="text-muted-foreground">Status: {app.status}</p>
                  </div>
                ))}
              </div>
            )}
            <Button className="w-full" variant="outline" asChild>
              <Link href="#applications">Review Applications</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card id="applications">
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>Review candidate interest for this opportunity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {applications.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4">
              No applications yet.
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{app.fullName}</p>
                    <p className="text-xs text-muted-foreground">{app.email}</p>
                  </div>
                  <Badge variant="outline">{app.status}</Badge>
                </div>
                {app.experience && (
                  <p className="mt-2 text-xs text-muted-foreground">Experience: {app.experience}</p>
                )}
                {app.availability && (
                  <p className="text-xs text-muted-foreground">Availability: {app.availability}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
