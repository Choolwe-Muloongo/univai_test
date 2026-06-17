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
      } else {
        console.error('Failed to load lecturer application settings', settingsResult.error);
        setApplicationsOpen(false);
        setSettingsError('Unable to load lecturer application settings. Please try again later.');
      }

      if (programsResult.ok) {
        setPrograms(programsResult.items);
        setProgramInterest(programsResult.items[0]?.id ?? '');
      } else {
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
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" placeholder="School of ICT" disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input id="specialization" name="specialization" placeholder="Software Engineering" disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="highestQualification">Highest Qualification</Label>
                <Input id="highestQualification" name="highestQualification" placeholder="MSc / PhD" disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years Experience</Label>
                <Input id="yearsExperience" name="yearsExperience" type="number" min="0" defaultValue="0" disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label>Program of Interest</Label>
                <Select value={programInterest} onValueChange={setProgramInterest} disabled={formDisabled || programs.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={programs.length ? 'Select program' : 'No programme preference'} />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio / Teaching Summary</Label>
              <Textarea id="bio" name="bio" placeholder="Your teaching background and focus." disabled={formDisabled} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cvLink">CV Link</Label>
                <Input id="cvLink" name="cvLink" placeholder="https://..." disabled={formDisabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certLink">Certificates Link</Label>
                <Input id="certLink" name="certLink" placeholder="https://..." disabled={formDisabled} />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={formDisabled}>
              {isSubmitting ? 'Submitting...' : 'Submit Lecturer Application'}
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
            <Link href="/login/lecturer">Lecturer Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
