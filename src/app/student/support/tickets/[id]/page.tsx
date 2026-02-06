import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const updates = [
  {
    author: "Support Agent",
    message: "We are reviewing your request and will update you shortly.",
    time: "2 hours ago",
  },
  {
    author: "You",
    message: "Attached the payment receipt as requested.",
    time: "1 hour ago",
  },
];

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ticket {id}</h1>
        <p className="text-muted-foreground">
          Support case timeline and updates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Case Summary</CardTitle>
          <CardDescription>Payment confirmation not received</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">In Progress</Badge>
            <span className="text-sm text-muted-foreground">Last updated 1 hour ago</span>
          </div>
          <p className="text-sm text-muted-foreground">
            We are verifying your payment with the finance office. Please keep your receipt ready.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {updates.map((update, index) => (
            <div key={`${update.author}-${index}`} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{update.author}</p>
                <span className="text-xs text-muted-foreground">{update.time}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{update.message}</p>
            </div>
          ))}
          <div className="space-y-3 rounded-lg border p-4">
            <p className="font-semibold">Add a reply</p>
            <Textarea placeholder="Write your message" className="min-h-[120px]" />
            <Button>Send Reply</Button>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" asChild>
        <Link href="/student/support">Back to Support</Link>
      </Button>
    </div>
  );
}
