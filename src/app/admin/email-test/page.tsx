'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, MailCheck, Send } from 'lucide-react';

import { AdminSectionPage } from '@/components/admin/admin-section-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { testSmtpEmail } from '@/lib/api';

export default function AdminEmailTestPage() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('UnivAI SMTP test');
  const [message, setMessage] = useState('This confirms UnivAI can send email through the configured SMTP provider.');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; details?: Record<string, unknown> } | null>(null);

  async function sendTestEmail() {
    const recipient = to.trim();
    if (!recipient) {
      setResult({ ok: false, message: 'Enter the email address that should receive the test.' });
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const response = await testSmtpEmail({
        to: recipient,
        subject: subject.trim() || 'UnivAI SMTP test',
        message: message.trim() || 'This confirms UnivAI can send email through the configured SMTP provider.',
      });
      setResult({
        ok: response.ok !== false,
        message: typeof response.message === 'string' ? response.message : 'Test email sent successfully. Check inbox and spam.',
        details: response,
      });
    } catch (error) {
      setResult({
        ok: false,
        message: error instanceof Error ? error.message : 'SMTP test failed. Check backend mail configuration.',
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <AdminSectionPage
      title="Email Test"
      description="Verify UnivAI SMTP delivery before marketing starts. Send a real test email and confirm it reaches the inbox."
      items={['SMTP test', 'Delivery proof', 'Marketing readiness']}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MailCheck className="h-5 w-5 text-primary" />
                  Send SMTP Test Email
                </CardTitle>
                <CardDescription>
                  Use this before telling the CEO to start campaigns. If this succeeds and the inbox receives it, transactional emails are ready.
                </CardDescription>
              </div>
              <Badge variant={result?.ok ? 'default' : 'secondary'} className="w-fit">
                {result?.ok ? 'SMTP working' : 'Needs test'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {result ? (
              <div className={`flex gap-3 rounded-xl border p-4 text-sm ${result.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' : 'border-destructive/30 bg-destructive/5 text-destructive'}`}>
                {result.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
                <div className="space-y-2">
                  <p className="font-medium">{result.ok ? 'Email test passed' : 'Email test failed'}</p>
                  <p>{result.message}</p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="test-to">Recipient email</Label>
                <Input
                  id="test-to"
                  type="email"
                  placeholder="ceo@example.com"
                  value={to}
                  disabled={isSending}
                  onChange={(event) => setTo(event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="test-subject">Subject</Label>
                <Input
                  id="test-subject"
                  value={subject}
                  disabled={isSending}
                  onChange={(event) => setSubject(event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="test-message">Message</Label>
                <Textarea
                  id="test-message"
                  rows={5}
                  value={message}
                  disabled={isSending}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>
            </div>

            <Button onClick={sendTestEmail} disabled={isSending} className="w-full sm:w-auto">
              <Send className="mr-2 h-4 w-4" />
              {isSending ? 'Sending test email...' : 'Send Test Email'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>CEO Marketing Checklist</CardTitle>
            <CardDescription>Use this quick check before campaigns go live.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl border bg-background p-3">
              1. Send test email to your own Gmail and the CEO email.
            </div>
            <div className="rounded-xl border bg-background p-3">
              2. Confirm it arrives in inbox, not only spam.
            </div>
            <div className="rounded-xl border bg-background p-3">
              3. Confirm the sender name/address looks official.
            </div>
            <div className="rounded-xl border bg-background p-3">
              4. Only start marketing after the test passes.
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminSectionPage>
  );
}
