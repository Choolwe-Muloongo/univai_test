'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createLecturerApplication, getAdmissionsSettings, getPrograms } from '@/lib/api';
import type { Program } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function LecturerApplyPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programInterest, setProgramInterest] = useState('');
  const [loading, setLoading] = useState(true);
  const [programError, setProgramError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [applicationsOpen, setApplicationsOpen] = useState(false);
  const [applicationsMessage, setApplicationsMessage] = useState('Lecturer applications are currently closed.');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPortal() {
      setLoading(true);
      setProgramError(null);
      setSettingsError(null);

      const settingsResult = await getAdmissionsSettings()
        .then((settings) => ({ ok: true as const, settings }))
        .catch((error) => ({ ok: false as const, error }));

      const programsResult = await getPrograms()
        .then((items) => ({ ok: true as const, items }))
        .catch((error) => ({ ok: false as const, error }));

      if (!isMounted) return;

      if (settingsResult.ok) {
        setApplicationsOpen(Boolean(settingsResult.settings.lecturerApplicationsOpen));
        setApplicationsMessage(
          typeof settingsResult.settings.lecturerApplicationsMessage === 'string'
            ? settingsResult.settings.lecturerApplicationsMessage
            : 'Lecturer applications are currently closed.'
        );
      } else if ('error' in settingsResult) {
        console.error('Failed to load lecturer application settings', settingsResult.error);
        setApplicationsOpen(false);
        setSettingsError('Unable to load lecturer application settings. Please try again later.');
      }

      if (programsResult.ok) {
        setPrograms(programsResult.items);
        setProgramInterest(programsResult.items[0]?.id ?? '');
      } else if ('error' in programsResult) {
        console.error('Failed to load programmes for lecturer application', programsResult.error);
        setPrograms([]);
        setProgramInterest('');
        setProgramError('Programmes are unavailable. You can still submit your application without a programme preference.');
      }

      setLoading(false);
    }

    loadPortal();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!applicationsOpen) return;

    setStatus('submitting');
    setSubmitError(null);

    const formData = new FormData(event.currentTarget);

    try {
      await createLecturerApplication({
        fullName: String(formData.get('fullName') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        department: String(formData.get('department') || '').trim(),
        specialization: String(formData.get('specialization') || '').trim(),
        highestQualification: String(formData.get('highestQualification') || '').trim(),
        yearsExperience: Number(formData.get('yearsExperience') || 0),
        programInterest: programInterest || null,
        documents: {
          cv: String(formData.get('cvLink') || '').trim(),
          certificates: String(formData.get('certLink') || '').trim(),
          bio: String(formData.get('bio') || '').trim(),
        },
      });
      setStatus('success');
      event.currentTarget.reset();
      setProgramInterest(programs[0]?.id ?? '');
    } catch (err) {
      console.error('Failed to submit lecturer application', err);
      setStatus('error');
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit your lecturer application. Please try again.');
    }
  }

  const isSubmitting = status === 'submitting';
  const formDisabled = isSubmitting || !applicationsOpen || loading || Boolean(settingsError);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>Lecturer Applications Portal</CardTitle>
          <CardDescription>
            Apply to join UnivAI as a lecturer. Our academic team will review your profile and contact you after review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <PageLoading message="Loading lecturer application portal..." /> : null}
          {settingsError ? <PageError message={settingsError} /> : null}
          {programError ? <PageError message={programError} /> : null}
          {!loading && !settingsError && !applicationsOpen ? (
            <PageError message={applicationsMessage || 'Lecturer applications are currently closed. Please check back after admin opens applications.'} />
          ) : null}
          {!loading && applicationsOpen ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Lecturer applications are open. Complete the form below to submit your profile.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" required disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" required disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" required disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input id="specialization" name="specialization" required disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="highestQualification">Highest qualification</Label>
                <Input id="highestQualification" name="highestQualification" required disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years of experience</Label>
                <Input id="yearsExperience" name="yearsExperience" type="number" min="0" required disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="programInterest">Programme interest</Label>
                <Select value={programInterest} onValueChange={setProgramInterest} disabled={formDisabled}>
                  <SelectTrigger id="programInterest">
                    <SelectValue placeholder="Select a programme" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvLink">CV link</Label>
              <Input id="cvLink" name="cvLink" type="url" disabled={formDisabled} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certLink">Certificates link</Label>
              <Input id="certLink" name="certLink" type="url" disabled={formDisabled} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Professional bio</Label>
              <Textarea id="bio" name="bio" rows={5} required disabled={formDisabled} />
            </div>

            {submitError ? <PageError message={submitError} /> : null}

            <CardFooter className="px-0">
              <Button type="submit" disabled={formDisabled}>
                {isSubmitting ? 'Submitting...' : 'Submit application'}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/">Return to UnivAI</Link>
      </div>
    </div>
  );
}
