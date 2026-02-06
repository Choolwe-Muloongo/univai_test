import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const performance = [
  { program: 'BSc Software Development', completion: 72 },
  { program: 'Diploma in Nursing', completion: 64 },
  { program: 'MBA', completion: 59 },
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
          <CardTitle>Completion Trends</CardTitle>
          <CardDescription>Average completion rate by program.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {performance.map((item) => (
            <div key={item.program} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{item.program}</p>
                <p className="text-sm text-muted-foreground">{item.completion}%</p>
              </div>
              <Progress value={item.completion} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
