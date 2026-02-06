import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const slots = [
  { time: 'Mon · 9:00 AM', seats: 4 },
  { time: 'Wed · 1:00 PM', seats: 6 },
  { time: 'Fri · 3:00 PM', seats: 2 },
];

export default function VirtualLabBookingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lab Booking</h1>
        <p className="text-muted-foreground">Reserve time in the virtual lab.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Slots</CardTitle>
          <CardDescription>Select a slot to book your lab time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {slots.map((slot) => (
            <div key={slot.time} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{slot.time}</p>
                <p className="text-sm text-muted-foreground">
                  {slot.seats} seats remaining
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Open</Badge>
                <Button variant="outline" size="sm">
                  Book
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
