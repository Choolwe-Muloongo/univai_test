import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock } from 'lucide-react';

const tasks = [
  { time: '08:00', title: 'Watch Lesson: Intro to Python', status: 'Pending' },
  { time: '10:30', title: 'Practice Quiz: Digital Systems', status: 'Pending' },
  { time: '14:00', title: 'Assignment Draft: Programming Lab', status: 'In Progress' },
  { time: '16:00', title: 'AI Tutor Review Session', status: 'Completed' },
];

export default function StudyPlanDailyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Plan</h1>
        <p className="text-muted-foreground">Your AI-curated plan for today.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today’s Schedule</CardTitle>
          <CardDescription>Focus on these learning blocks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tasks.map((task) => (
            <div key={task.title} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-muted-foreground">{task.time}</p>
                </div>
              </div>
              <Badge variant={task.status === 'Completed' ? 'secondary' : 'outline'}>
                {task.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Daily Completion</CardTitle>
          <CardDescription>Keep your streak alive.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          1 of 4 tasks completed
        </CardContent>
      </Card>
    </div>
  );
}
