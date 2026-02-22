import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Booking slots will appear once the virtual lab schedule is published.
          </div>
          <Button variant="outline" asChild>
            <Link href="/student/support">Contact Lab Support</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
