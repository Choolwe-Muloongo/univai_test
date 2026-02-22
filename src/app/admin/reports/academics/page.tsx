import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function AcademicReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Performance</h1>
          <p className="text-muted-foreground">Track completion, grades, and engagement by program.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/reports">Back to Reports</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completion Trends</CardTitle>
          <CardDescription>Average completion rate by program.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Academic performance data will appear once grades and attendance are published.
          </div>
          <Progress value={0} />
        </CardContent>
      </Card>
    </div>
  );
}
