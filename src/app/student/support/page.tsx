import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LifeBuoy, MessageCircle, FileWarning } from "lucide-react";

const tickets = [
  {
    id: "TCK-3012",
    subject: "Payment confirmation not received",
    status: "Open",
    updated: "Today",
  },
  {
    id: "TCK-2964",
    subject: "Exam booking issue",
    status: "In Progress",
    updated: "Yesterday",
  },
  {
    id: "TCK-2890",
    subject: "Transcript request",
    status: "Resolved",
    updated: "Jan 26",
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support</h1>
        <p className="text-muted-foreground">
          Contact helpdesk, log tickets, and track your requests.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Open a New Ticket</CardTitle>
            <CardDescription>
              Provide clear details so we can resolve your issue quickly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Subject" />
            <Textarea placeholder="Describe your issue" className="min-h-[140px]" />
            <div className="flex items-center gap-2">
              <Button>Submit Ticket</Button>
              <Button variant="outline">Attach File</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Help</CardTitle>
            <CardDescription>Get fast answers or escalation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <LifeBuoy className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Live Support</p>
                <p className="text-sm text-muted-foreground">
                  Mon-Fri, 8am-6pm local time.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <MessageCircle className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Chat with Advisor</p>
                <p className="text-sm text-muted-foreground">
                  Academic guidance and program questions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <FileWarning className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Report an Issue</p>
                <p className="text-sm text-muted-foreground">
                  Integrity or policy concerns are confidential.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>Latest support requests and updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{ticket.subject}</p>
                <p className="text-sm text-muted-foreground">{ticket.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={ticket.status === "Resolved" ? "secondary" : "outline"}
                >
                  {ticket.status}
                </Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/student/support/tickets/${ticket.id.toLowerCase()}`}>
                    View
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
