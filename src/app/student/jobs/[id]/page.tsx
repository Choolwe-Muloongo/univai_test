import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Briefcase } from 'lucide-react';
import { getJobById } from '@/lib/api';

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="outline" asChild>
          <Link href="/student/jobs">Back to Jobs</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl">{job.title}</CardTitle>
              <Badge variant={job.type === 'Internship' ? 'secondary' : 'default'}>
                {job.type}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm">
                <Briefcase className="h-4 w-4" /> {job.company}
              </span>
              <span className="flex items-center gap-1 text-sm">
                <MapPin className="h-4 w-4" /> {job.location}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Role Overview</h3>
              <p>{job.description || 'Role details will appear once the employer publishes the full brief.'}</p>
            </section>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Ready to Apply?</CardTitle>
            <CardDescription>Submit your profile and portfolio for review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" asChild>
              <Link href={`/student/jobs/${job.id}/apply`}>Apply Now</Link>
            </Button>
            <Button variant="outline" className="w-full">Save for Later</Button>
            <p className="text-xs text-muted-foreground">
              Hiring teams respond within 5-7 business days.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


