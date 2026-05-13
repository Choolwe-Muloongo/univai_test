import Link from 'next/link';
import { BookOpenCheck, CircleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const programSummaries = [
  { name: 'Computer Science', completion: 74, status: 'healthy', action: 'Maintain current pacing' },
  { name: 'Business Administration', completion: 69, status: 'watch', action: 'Review assessments in Year 1 modules' },
  { name: 'Public Health', completion: 63, status: 'risk', action: 'Assign retention intervention plan' },
];

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
          <CardTitle className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-primary" />
            Completion Trends
          </CardTitle>
          <CardDescription>Freshness: updated 23 minutes ago from gradebook + attendance feed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {programSummaries.map((program) => (
            <div key={program.name} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{program.name}</p>
                <Badge variant={program.status === 'risk' ? 'destructive' : program.status === 'watch' ? 'secondary' : 'default'}>
                  {program.status}
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Completion rate</span>
                <span>{program.completion}%</span>
              </div>
              <Progress value={program.completion} className="mt-2" />
              <p className="mt-3 text-sm text-muted-foreground">Next action: {program.action}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleAlert className="h-5 w-5 text-destructive" />
            Intervention Recommendations
          </CardTitle>
          <CardDescription>Use these shortcuts to reduce academic risk quickly.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/assignments">Review lecturer assignment coverage</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/curriculum">Adjust module prerequisites</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/policies">Tune progression and repeat policies</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
