import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getJobApplications, getJobById } from '@/lib/api';
import { JobApplicantActions } from './job-applicant-actions';

export default async function EmployerJobApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) {
    notFound();
  }
  const applications = await getJobApplications(id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applicants</h1>
          <p className="text-muted-foreground">{job.title}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/employer/jobs/${job.id}`}>Back to Listing</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Pipeline</CardTitle>
          <CardDescription>Review and move applicants through each stage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {applications.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No applicants yet. Candidate profiles will appear here once applications arrive.
            </div>
          ) : (
            applications.map((application) => (
              <div key={application.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold">{application.fullName}</p>
                    <p className="text-xs text-muted-foreground">{application.email}</p>
                    {application.portfolio && (
                      <a className="text-xs text-primary underline" href={application.portfolio}>
                        Portfolio
                      </a>
                    )}
                  </div>
                  <Badge variant="outline">{application.status}</Badge>
                </div>
                {application.coverLetter && (
                  <p className="mt-3 text-sm text-muted-foreground">{application.coverLetter}</p>
                )}
                <div className="mt-4">
                  <JobApplicantActions
                    jobId={job.id}
                    applicationId={application.id}
                    currentStatus={application.status}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
