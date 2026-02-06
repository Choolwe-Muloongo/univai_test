import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';

const dueDates = [
  { date: 'Feb 6, 2026', title: 'Digital Literacy Quiz', status: 'Upcoming' },
  { date: 'Feb 10, 2026', title: 'Programming Lab 1', status: 'Upcoming' },
  { date: 'Feb 18, 2026', title: 'Semester 1 Exam', status: 'Upcoming' },
];

export default function AssignmentCalendarPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignment Calendar</h1>
        <p className="text-muted-foreground">Upcoming deadlines and key dates.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>Stay ahead of submissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dueDates.map((item) => (
            <div key={item.title} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-1 h-4 w-4 text-primary" />
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
              </div>
              <Badge variant="secondary">{item.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
