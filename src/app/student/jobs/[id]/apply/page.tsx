import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getJobById } from '@/lib/api';
import { JobApplyForm } from '@/components/jobs/job-apply-form';

export default async function JobApplyPage({
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply for {job.title}</h1>
          <p className="text-muted-foreground">
            {job.company} - {job.location}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/student/jobs/${job.id}`}>Back to Job</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>Share your background and portfolio.</CardDescription>
          </CardHeader>
          <CardContent>
            <JobApplyForm jobId={job.id} />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Role Snapshot</CardTitle>
            <CardDescription>Confirm the opportunity details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Type</span>
              <Badge variant={job.type === 'Internship' ? 'secondary' : 'default'}>{job.type}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Location</span>
              <span>{job.location}</span>
            </div>
            <p>Applications reviewed within 5 business days.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
