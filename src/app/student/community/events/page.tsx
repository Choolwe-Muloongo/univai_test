import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const events = [
  { title: 'AI Study Jam', date: 'Feb 8, 2026 · 4:00 PM', status: 'Registered' },
  { title: 'Career Prep Workshop', date: 'Feb 12, 2026 · 6:00 PM', status: 'Register' },
  { title: 'Hackathon Sprint', date: 'Feb 20, 2026 · 10:00 AM', status: 'Register' },
];

export default function CommunityEventsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground">Upcoming community events and meetups.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Grow your network and skills.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.map((event) => (
            <div key={event.title} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{event.title}</p>
                <p className="text-sm text-muted-foreground">{event.date}</p>
              </div>
              {event.status === 'Registered' ? (
                <Badge variant="secondary">Registered</Badge>
              ) : (
                <Button variant="outline" size="sm">Register</Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
