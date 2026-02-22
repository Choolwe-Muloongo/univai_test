import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function JobApplicationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
        <p className="text-muted-foreground">Track job applications and interviews.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>Latest updates from employers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No job applications yet. Apply to roles to track your progress here.
          </div>
          <Button variant="outline" asChild>
            <Link href="/student/jobs">Browse Jobs</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
