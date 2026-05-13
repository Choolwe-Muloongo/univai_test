'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { applyJob } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type JobApplyFormProps = {
  jobId: string;
};

export function JobApplyForm({ jobId }: JobApplyFormProps) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    portfolio: '',
    coverLetter: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    setError(null);

    try {
      await applyJob(jobId, {
        fullName: form.fullName,
        email: form.email,
        portfolio: form.portfolio || undefined,
        coverLetter: form.coverLetter || undefined,
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError('Unable to submit your application. Please try again.');
    }
  };

  const isSubmitting = status === 'submitting';

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="Your name"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            disabled={isSubmitting}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@univai.edu"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            disabled={isSubmitting}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="portfolio">Portfolio / LinkedIn</Label>
        <Input
          id="portfolio"
          placeholder="https://..."
          value={form.portfolio}
          onChange={(event) => setForm((prev) => ({ ...prev, portfolio: event.target.value }))}
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cover">Cover Letter</Label>
        <Textarea
          id="cover"
          className="min-h-32"
          placeholder="Tell us why you're a strong fit."
          value={form.coverLetter}
          onChange={(event) => setForm((prev) => ({ ...prev, coverLetter: event.target.value }))}
          disabled={isSubmitting}
        />
      </div>
      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Application'}
      </Button>
      {status === 'success' && (
        <p className="text-sm text-emerald-600">Application submitted. We'll follow up shortly.</p>
      )}
      {status === 'error' && error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </form>
  );
}
