import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const bookings = [
  { id: 'bk-01', title: 'Semester 1 Exam', date: 'Feb 18, 2026 · 9:00 AM', status: 'Booked' },
  { id: 'bk-02', title: 'Database Quiz', date: 'Feb 9, 2026 · 2:00 PM', status: 'Available' },
];

export default function ExamBookingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exam Bookings</h1>
        <p className="text-muted-foreground">Schedule and manage exam sessions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Exams</CardTitle>
          <CardDescription>Book a slot to secure your seat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{booking.title}</p>
                <p className="text-sm text-muted-foreground">{booking.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={booking.status === 'Booked' ? 'secondary' : 'outline'}>
                  {booking.status}
                </Badge>
                <Button variant="outline" size="sm">
                  {booking.status === 'Booked' ? 'Reschedule' : 'Book'}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
