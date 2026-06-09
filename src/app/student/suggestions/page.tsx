'use client';

import { useState } from 'react';
import { Bug, Lightbulb, MessageSquare, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/student/page-header';

const requestTypes = [
  { value: 'feature', label: 'Feature request', icon: Lightbulb, helper: 'Suggest a new tool, page, card, or learning experience.' },
  { value: 'bug', label: 'Report an error', icon: Bug, helper: 'Tell us what broke, where it happened, and what you expected.' },
  { value: 'general', label: 'General feedback', icon: MessageSquare, helper: 'Share anything that can make UnivAI clearer or better.' },
];

export default function StudentSuggestionsPage() {
  const [type, setType] = useState('feature');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Frontend capture for now. Wire this to the backend feedback API when the endpoint is ready.
    console.info('Student suggestion submitted', { type, title, details });
    setSubmitted(true);
    setTitle('');
    setDetails('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suggestions & Reports"
        description="Ask for new features, report errors, or tell us what feels confusing. Your feedback helps improve UnivAI for everyone."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {requestTypes.map((item) => {
          const Icon = item.icon;
          const active = type === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setType(item.value)}
              className={`rounded-2xl border p-4 text-left transition hover:bg-muted ${active ? 'border-primary bg-primary/5' : 'bg-card'}`}
            >
              <Icon className="mb-3 h-5 w-5 text-primary" />
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.helper}</p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send feedback</CardTitle>
          <CardDescription>Be specific so the team can understand and act on it quickly.</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
              Thank you. Your feedback has been captured on this page. Backend storage can be connected next.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="suggestion-title" className="text-sm font-medium">Title</label>
              <input
                id="suggestion-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                minLength={3}
                placeholder="Example: Add more practice questions to MA110"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="suggestion-details" className="text-sm font-medium">Details</label>
              <textarea
                id="suggestion-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                required
                minLength={10}
                rows={7}
                placeholder="Explain what happened, what you want added, or what confused you."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <Button type="submit">
              <Send className="mr-2 h-4 w-4" />
              Submit feedback
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
