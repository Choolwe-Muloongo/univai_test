import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock3 } from 'lucide-react';

export default function StudyPlanRevisionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Plan Revisions</h1>
        <p className="text-muted-foreground">
          Track changes made to your study plan over time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revision History</CardTitle>
          <CardDescription>Latest updates from AI and advisors.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <Clock3 className="mt-0.5 h-4 w-4 text-primary" />
            No study plan revisions yet. Adjust your plan to see a history here.
          </div>
          <Button variant="outline" asChild>
            <Link href="/student/study-plan">Update Study Plan</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
