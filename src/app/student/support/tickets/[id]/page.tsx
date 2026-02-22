'use client';
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addSupportMessage, getSupportTicketById } from "@/lib/api";
import type { SupportMessage, SupportTicket } from "@/lib/api/types";
import { useToast } from "@/hooks/use-toast";

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadTicket = async () => {
    setLoading(true);
    const data = await getSupportTicketById(id);
    if (data) {
      setTicket(data);
      setMessages(data.messages ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) {
      loadTicket();
    }
  }, [id]);

  const handleSend = async () => {
    if (!messageText.trim()) return;
    setSending(true);
    try {
      const newMessage = await addSupportMessage(id, messageText.trim());
      setMessages((prev) => [...prev, newMessage]);
      setMessageText('');
    } catch (error: any) {
      toast({
        title: 'Failed to send',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading ticket...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ticket {ticket?.id ?? id}</h1>
        <p className="text-muted-foreground">
          Support case timeline and updates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Case Summary</CardTitle>
          <CardDescription>{ticket?.subject ?? 'Support request details'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{ticket?.description}</p>
          <p className="text-xs text-muted-foreground">Status: {ticket?.status}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No updates yet. Once support replies, the timeline will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="rounded-lg border p-4 text-sm">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{message.author}</span>
                    <span>{message.createdAt?.slice(0, 19).replace('T', ' ')}</span>
                  </div>
                  <p className="mt-2">{message.message}</p>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3 rounded-lg border p-4">
            <p className="font-semibold">Add a reply</p>
            <Textarea
              placeholder="Write your message"
              className="min-h-[120px]"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
            />
            <Button onClick={handleSend} disabled={sending || !messageText.trim()}>
              Send Reply
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" asChild>
        <Link href="/student/support">Back to Support</Link>
      </Button>
    </div>
  );
}

