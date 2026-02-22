import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Exam booking slots will appear once your faculty publishes the schedule.
          </div>
          <Button variant="outline" asChild>
            <Link href="/student/support">Contact Support</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
