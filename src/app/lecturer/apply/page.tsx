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
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [programError, setProgramError] = useState<string | null>(null);
  const [applicationsOpen, setApplicationsOpen] = useState(false);
  const [applicationsMessage, setApplicationsMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPrograms() {
      try {
        const [nextPrograms, settings] = await Promise.all([getPrograms(), getAdmissionsSettings()]);
        if (!isMounted) return;
        setPrograms(nextPrograms);
        setProgramInterest(nextPrograms[0]?.id ?? '');
        setApplicationsOpen(settings.lecturerApplicationsOpen ?? false);
        setApplicationsMessage(settings.lecturerApplicationsMessage ?? 'Lecturer applications are currently closed.');
        setProgramError(null);
      } catch (err) {
        console.error('Failed to load programmes for lecturer application', err);
        if (isMounted) {
          setPrograms([]);
          setProgramInterest('');
          setProgramError('Programmes are unavailable. You can still submit your application without a programme preference.');
        }
      } finally {
        if (isMounted) {
          setLoadingPrograms(false);
        }
      }
    }

    loadPrograms();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setSubmitError(null);

    const formData = new FormData(event.currentTarget);

    try {
      await createLecturerApplication({
        fullName: String(formData.get('fullName') || ''),
        email: String(formData.get('email') || ''),
        phone: String(formData.get('phone') || ''),
        department: String(formData.get('department') || ''),
        specialization: String(formData.get('specialization') || ''),
        highestQualification: String(formData.get('highestQualification') || ''),
        yearsExperience: Number(formData.get('yearsExperience') || 0),
        programInterest,
        documents: {
          cv: String(formData.get('cvLink') || ''),
          certificates: String(formData.get('certLink') || ''),
        },
      });
      setStatus('success');
      event.currentTarget.reset();
    } catch (err) {
      console.error('Failed to submit lecturer application', err);
      setStatus('error');
      setSubmitError('Unable to submit your lecturer application. Please try again.');
    }
  }

  const isSubmitting = status === 'submitting';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>Lecturer Application</CardTitle>
          <CardDescription>
            Apply to join UnivAI as a lecturer. Our academic team will review your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingPrograms ? <PageLoading message="Loading programmes..." /> : null}
          {programError ? <PageError message={programError} /> : null}
          {!loadingPrograms && !applicationsOpen ? (
            <PageError message={applicationsMessage || 'Lecturer applications are currently closed. Please check back after admin opens applications.'} />
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" disabled={isSubmitting || !applicationsOpen} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" disabled={isSubmitting || !applicationsOpen} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" disabled={isSubmitting || !applicationsOpen} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" placeholder="School of ICT" disabled={isSubmitting || !applicationsOpen} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input id="specialization" name="specialization" placeholder="Software Engineering" disabled={isSubmitting || !applicationsOpen} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="highestQualification">Highest Qualification</Label>
                <Input id="highestQualification" name="highestQualification" placeholder="MSc / PhD" disabled={isSubmitting || !applicationsOpen} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years Experience</Label>
                <Input id="yearsExperience" name="yearsExperience" type="number" min="0" defaultValue="0" disabled={isSubmitting || !applicationsOpen} />
              </div>
              <div className="space-y-2">
                <Label>Program of Interest</Label>
                <Select value={programInterest} onValueChange={setProgramInterest} disabled={isSubmitting || !applicationsOpen || programs.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
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
              <Textarea id="bio" name="bio" placeholder="Your teaching background and focus." disabled={isSubmitting || !applicationsOpen} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cvLink">CV Link</Label>
                <Input id="cvLink" name="cvLink" placeholder="https://..." disabled={isSubmitting || !applicationsOpen} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certLink">Certificates Link</Label>
                <Input id="certLink" name="certLink" placeholder="https://..." disabled={isSubmitting || !applicationsOpen} />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !applicationsOpen}>
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
