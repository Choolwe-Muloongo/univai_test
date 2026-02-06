import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock3 } from 'lucide-react';

const revisions = [
  {
    id: 'rev-01',
    date: 'Feb 1, 2026',
    reason: 'Adjusted for quiz performance drop',
    status: 'Applied',
  },
  {
    id: 'rev-02',
    date: 'Jan 24, 2026',
    reason: 'New module added by registrar',
    status: 'Applied',
  },
  {
    id: 'rev-03',
    date: 'Jan 10, 2026',
    reason: 'Student requested slower pace',
    status: 'Archived',
  },
];

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
          {revisions.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-1 h-4 w-4 text-primary" />
                <div>
                  <p className="font-semibold">{item.reason}</p>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
              </div>
              <Badge variant={item.status === 'Applied' ? 'secondary' : 'outline'}>
                {item.status}
              </Badge>
            </div>
          ))}
          <Button variant="outline" className="w-full">
            Request New Revision
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
