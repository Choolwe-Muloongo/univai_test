import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApplications } from '@/lib/api';

export default async function EnrollmentReportsPage() {
  const applications = await getApplications();
  const submitted = applications.length;
  const offersIssued = applications.filter((app) => ['offer_sent', 'approved'].includes(app.status)).length;
  const accepted = applications.filter((app) => app.status === 'admitted').length;
  const enrolled = accepted;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enrollment Pipeline</h1>
          <p className="text-muted-foreground">Track applicant conversion from submission to enrollment.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/reports">Back to Reports</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Applications Submitted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{submitted}</div>
            <p className="text-xs text-muted-foreground">Total submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Offers Issued</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{offersIssued}</div>
            <p className="text-xs text-muted-foreground">Offers sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{accepted}</div>
            <p className="text-xs text-muted-foreground">Offer acceptances</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{enrolled}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admissions Focus</CardTitle>
          <CardDescription>Areas that need follow-up by admissions staff.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {applications.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4">
              Admissions follow-up items will appear once applications are processed.
            </div>
          ) : (
            applications
              .filter((app) => app.status === 'needs_info')
              .map((app) => (
                <div key={app.id} className="rounded-lg border p-4">
                  <p className="font-semibold">{app.fullName}</p>
                  <p className="text-xs text-muted-foreground">{app.programId}</p>
                  <p className="text-xs text-muted-foreground">Needs additional documents</p>
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
