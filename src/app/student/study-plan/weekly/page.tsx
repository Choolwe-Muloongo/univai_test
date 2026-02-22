import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StudyPlanWeeklyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weekly Plan</h1>
        <p className="text-muted-foreground">Your learning roadmap for the week.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Week Overview</CardTitle>
          <CardDescription>Aligned with your program pacing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No weekly plan available yet. Generate a study plan to populate this view.
          </div>
          <Button variant="outline" asChild>
            <Link href="/student/study-plan">Generate Study Plan</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
