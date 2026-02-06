import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarCheck } from 'lucide-react';

const sessions = [
  {
    id: 'lab-01',
    title: 'Python Debugging Lab',
    date: 'Feb 4, 2026 · 10:00 AM',
    status: 'Upcoming',
  },
  {
    id: 'lab-02',
    title: 'Database Query Practice',
    date: 'Feb 6, 2026 · 2:00 PM',
    status: 'Upcoming',
  },
];

export default function VirtualLabSessionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lab Sessions</h1>
        <p className="text-muted-foreground">Upcoming guided virtual lab sessions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>Join live labs or reschedule.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <CalendarCheck className="mt-1 h-4 w-4 text-primary" />
                <div>
                  <p className="font-semibold">{session.title}</p>
                  <p className="text-sm text-muted-foreground">{session.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{session.status}</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/student/virtual-lab">Join</Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
