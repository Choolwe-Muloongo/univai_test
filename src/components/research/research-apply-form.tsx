'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { applyResearch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ResearchApplyFormProps = {
  opportunityId: string;
};

export function ResearchApplyForm({ opportunityId }: ResearchApplyFormProps) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    experience: '',
    availability: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    setError(null);

    try {
      await applyResearch(opportunityId, {
        fullName: form.fullName,
        email: form.email,
        experience: form.experience || undefined,
        availability: form.availability || undefined,
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
        <Label htmlFor="experience">Relevant Experience</Label>
        <Textarea
          id="experience"
          className="min-h-32"
          placeholder="Summarize relevant projects or research."
          value={form.experience}
          onChange={(event) => setForm((prev) => ({ ...prev, experience: event.target.value }))}
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="availability">Availability</Label>
        <Input
          id="availability"
          placeholder="e.g., 6-8 hours per week"
          value={form.availability}
          onChange={(event) => setForm((prev) => ({ ...prev, availability: event.target.value }))}
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
