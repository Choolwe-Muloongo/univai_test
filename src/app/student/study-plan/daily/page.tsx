import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function StudyPlanDailyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Plan</h1>
        <p className="text-muted-foreground">Your AI-curated plan for today.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Schedule</CardTitle>
          <CardDescription>Focus on these learning blocks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No daily plan available yet. Generate a study plan to populate this view.
          </div>
          <Button variant="outline" asChild>
            <Link href="/student/study-plan">Generate Study Plan</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Daily Completion</CardTitle>
          <CardDescription>Keep your streak alive.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          No tasks completed yet
        </CardContent>
      </Card>
    </div>
  );
}
