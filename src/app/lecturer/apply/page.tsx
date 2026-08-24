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

      let settingsResult: Awaited<ReturnType<typeof getAdmissionsSettings>> | null = null;
      let settingsErrorValue: unknown = null;

      try {
        settingsResult = await getAdmissionsSettings();
      } catch (error) {
        settingsErrorValue = error;
      }

      let programsResult: Awaited<ReturnType<typeof getPrograms>> | null = null;
      let programsErrorValue: unknown = null;

      try {
        programsResult = await getPrograms();
      } catch (error) {
        programsErrorValue = error;
      }

      if (!isMounted) return;

      if (settingsResult) {
        setApplicationsOpen(Boolean(settingsResult.lecturerApplicationsOpen));
        setApplicationsMessage(
          typeof settingsResult.lecturerApplicationsMessage === 'string'
            ? settingsResult.lecturerApplicationsMessage
            : 'Lecturer applications are currently closed.'
        );
      } else {
        console.error('Failed to load lecturer application settings', settingsErrorValue);
        setApplicationsOpen(false);
        setSettingsError('Unable to load lecturer application settings. Please try again later.');
      }

      if (programsResult) {
        setPrograms(programsResult);
        setProgramInterest(programsResult[0]?.id ?? '');
      } else {
        console.error('Failed to load programmes for lecturer application', programsErrorValue);
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
    } catch (error) {
      console.error('Failed to submit lecturer application', error);
      setStatus('error');
      setSubmitError('Unable to submit your application. Please try again later.');
    }
  }

  if (loading) {
    return <PageLoading message="Loading lecturer applications..." />;
  }

  if (settingsError) {
    return <PageError title="Unable to load applications" message={settingsError} />;
  }

  if (!applicationsOpen) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Lecturer Applications</CardTitle>
            <CardDescription>{applicationsMessage}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/">Return home</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Apply as a Lecturer</CardTitle>
          <CardDescription>Complete the form below to submit your lecturer application.</CardDescription>
        </CardHeader>
        <CardContent>
          {programError && (
            <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              {programError}
            </div>
          )}

          {status === 'success' ? (
            <div className="space-y-4">
              <p className="text-sm text-green-700">Your lecturer application has been submitted successfully.</p>
              <Button asChild>
                <Link href="/">Return home</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" name="fullName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" name="department" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input id="specialization" name="specialization" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highestQualification">Highest qualification</Label>
                  <Input id="highestQualification" name="highestQualification" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years of experience</Label>
                  <Input id="yearsExperience" name="yearsExperience" type="number" min="0" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="programInterest">Programme of interest</Label>
                  <Select value={programInterest} onValueChange={setProgramInterest}>
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cvLink">CV link</Label>
                  <Input id="cvLink" name="cvLink" type="url" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certLink">Certificates link</Label>
                  <Input id="certLink" name="certLink" type="url" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short bio</Label>
                <Textarea id="bio" name="bio" rows={5} />
              </div>

              {submitError && <p className="text-sm text-destructive">{submitError}</p>}

              <Button type="submit" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Submitting...' : 'Submit application'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
