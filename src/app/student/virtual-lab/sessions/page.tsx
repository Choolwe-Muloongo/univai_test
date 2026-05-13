import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No lab sessions are scheduled yet. Your lecturer will publish lab times here.
          </div>
          <Button variant="outline" asChild>
            <Link href="/student/support">Request a Lab Slot</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
