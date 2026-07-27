'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createResearcherApplication } from '@/lib/api';

export default function ResearcherApplyPage() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus('submitting');
    setSubmitError(null);

    const formData = new FormData(event.currentTarget);

    try {
      await createResearcherApplication({
        fullName: String(formData.get('fullName') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        institutionAffiliation: String(formData.get('institutionAffiliation') || '').trim(),
        researchArea: String(formData.get('researchArea') || '').trim(),
        highestQualification: String(formData.get('highestQualification') || '').trim(),
        yearsExperience: Number(formData.get('yearsExperience') || 0),
        orcidId: String(formData.get('orcidId') || '').trim(),
        documents: {
          cv: String(formData.get('cvLink') || '').trim(),
          publications: String(formData.get('publicationsLink') || '').trim(),
          bio: String(formData.get('bio') || '').trim(),
        },
      });
      setStatus('success');
      event.currentTarget.reset();
    } catch (err) {
      console.error('Failed to submit researcher application', err);
      setStatus('error');
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit your researcher application. Please try again.');
    }
  }

  const isSubmitting = status === 'submitting';
  const formDisabled = isSubmitting || status === 'success';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>Research Portal Application</CardTitle>
          <CardDescription>
            Apply to join UnivAI as a researcher. Our academic team will review your profile and contact you after review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" disabled={formDisabled} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" disabled={formDisabled} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institutionAffiliation">Institution / Affiliation</Label>
                <Input id="institutionAffiliation" name="institutionAffiliation" placeholder="University or organization" disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="researchArea">Research Area</Label>
                <Input id="researchArea" name="researchArea" placeholder="Machine Learning, Public Health, ..." disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="highestQualification">Highest Qualification</Label>
                <Input id="highestQualification" name="highestQualification" placeholder="MSc / PhD" disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years of Research Experience</Label>
                <Input id="yearsExperience" name="yearsExperience" type="number" min="0" defaultValue="0" disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orcidId">ORCID iD</Label>
                <Input id="orcidId" name="orcidId" placeholder="0000-0000-0000-0000" disabled={formDisabled} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Research Summary</Label>
              <Textarea id="bio" name="bio" placeholder="Your research background and focus." disabled={formDisabled} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cvLink">CV Link</Label>
                <Input id="cvLink" name="cvLink" placeholder="https://..." disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publicationsLink">Publications Link</Label>
                <Input id="publicationsLink" name="publicationsLink" placeholder="https://..." disabled={formDisabled} />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={formDisabled}>
              {isSubmitting ? 'Submitting...' : 'Submit Researcher Application'}
            </Button>
            {status === 'success' ? (
              <p className="text-sm text-emerald-600">Application submitted. The academic team will review your profile.</p>
            ) : null}
            {status === 'error' && submitError ? (
              <p className="text-sm text-destructive">{submitError}</p>
            ) : null}
          </form>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>Already approved?</span>
          <Button variant="outline" asChild>
            <Link href="/login/researcher">Researcher Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
