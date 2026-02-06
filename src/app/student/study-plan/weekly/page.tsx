import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const week = [
  { day: 'Monday', focus: 'Python fundamentals', status: 'Completed' },
  { day: 'Tuesday', focus: 'Database queries', status: 'In Progress' },
  { day: 'Wednesday', focus: 'AI foundations', status: 'Planned' },
  { day: 'Thursday', focus: 'Assignment draft', status: 'Planned' },
  { day: 'Friday', focus: 'Revision + quiz', status: 'Planned' },
];

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
        <CardContent className="space-y-3">
          {week.map((item) => (
            <div key={item.day} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{item.day}</p>
                <p className="text-sm text-muted-foreground">{item.focus}</p>
              </div>
              <Badge variant={item.status === 'Completed' ? 'secondary' : 'outline'}>
                {item.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
