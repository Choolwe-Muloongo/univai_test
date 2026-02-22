'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
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
import { LifeBuoy, MessageCircle, FileWarning } from "lucide-react";
import { createSupportTicket, getSupportTickets } from "@/lib/api";
import type { SupportTicket } from "@/lib/api/types";
import { useToast } from "@/hooks/use-toast";

export default function SupportPage() {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = async () => {
    const data = await getSupportTickets();
    setTickets(data);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const ticket = await createSupportTicket({ subject: subject.trim(), description: description.trim() });
      setSubject('');
      setDescription('');
      setTickets((prev) => [ticket, ...prev]);
      toast({ title: 'Ticket submitted', description: 'Support will respond shortly.' });
    } catch (error: any) {
      toast({
        title: 'Failed to submit ticket',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

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
            <Input placeholder="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
            <Textarea
              placeholder="Describe your issue"
              className="min-h-[140px]"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button onClick={handleSubmit} disabled={submitting || !subject.trim() || !description.trim()}>
                Submit Ticket
              </Button>
              <Button variant="outline" disabled>
                Attach File
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Attachments will be supported once secure storage is enabled.
            </p>
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
          {tickets.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No tickets found. New requests will appear here once submitted.
            </div>
          ) : (
            tickets.map((ticket) => (
              <Link key={ticket.id} href={`/student/support/tickets/${ticket.id}`} className="block rounded-lg border p-4 hover:bg-muted/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">{ticket.status}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{ticket.createdAt?.slice(0, 10)}</span>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

