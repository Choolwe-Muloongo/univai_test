import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const pipelines = [
  { label: 'Applications Submitted', value: 640, trend: '+12%' },
  { label: 'Offers Issued', value: 420, trend: '+9%' },
  { label: 'Accepted', value: 310, trend: '+6%' },
  { label: 'Enrolled', value: 275, trend: '+5%' },
];

export default function EnrollmentReportsPage() {
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
        {pipelines.map((stage) => (
          <Card key={stage.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">{stage.value}</div>
              <Badge variant="secondary">{stage.trend}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admissions Focus</CardTitle>
          <CardDescription>Areas that need follow-up by admissions staff.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="rounded-lg border p-4">
            58 applicants are pending document verification.
          </div>
          <div className="rounded-lg border p-4">
            22 accepted offers awaiting tuition payment.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
