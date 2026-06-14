'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, GraduationCap, Loader2, ShieldCheck, Sparkles } from 'lucide-react';

import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError } from '@/components/ui/page-feedback';
import { getPrograms, getSchools, registerAccount, submitApplication, uploadAdmissionDocument } from '@/lib/api';
import type { Program, School } from '@/lib/api/types';

type Choice = 'short-course' | 'formal-programme' | null;

function cleanReferralCode(value: string | null | undefined) {
  return (value ?? '').replace(/[^A-Za-z0-9]+/g, '').toUpperCase().slice(0, 32);
}

export default function RegisterPage() {
  const router = useRouter();
  const [choice, setChoice] = useState<Choice>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [programId, setProgramId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getSchools(), getPrograms()])
      .then(([schoolData, programData]) => {
        setSchools(schoolData);
        setPrograms(programData.filter((program) => !program.launchStatus || program.launchStatus === 'published'));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = new URLSearchParams(window.location.search);
    const code = cleanReferralCode(search.get('ref') || search.get('affiliateCode') || search.get('referralCode'));
    if (code) setReferralCode(code);
  }, []);

  const filteredPrograms = useMemo(
    () => programs.filter((program) => program.schoolId === schoolId),
    [programs, schoolId]
  );

  const shortCourseHref = referralCode
    ? `/register/short-courses?ref=${encodeURIComponent(referralCode)}`
    : '/register/short-courses';

  async function submitFormalApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (!schoolId || !programId) {
        setError('Choose a school and programme before submitting.');
        return;
      }

      const cleanCode = cleanReferralCode(referralCode);
      await registerAccount({
        name: fullName,
        email,
        password,
        ...(cleanCode ? { affiliateCode: cleanCode, referralCode: cleanCode } : {}),
      });
      await submitApplication({
        fullName,
        email,
        schoolId,
        programId,
        deliveryMode: 'hybrid',
        learningStyle: 'traditional',
        studyPace: 'standard',
        country: 'Zambia',
        subjectPoints: {},
      });

      const formData = new FormData(event.currentTarget);
      const nationalId = formData.get('nationalId') as File | null;
      const certificate = formData.get('certificate') as File | null;
      const certifiedResults = formData.get('certifiedResults') as File | null;
      const uploads: Promise<unknown>[] = [];

      if (nationalId && nationalId.size > 0) uploads.push(uploadAdmissionDocument('national_id', nationalId));
      if (certificate && certificate.size > 0) uploads.push(uploadAdmissionDocument('certificate', certificate));
      if (certifiedResults && certifiedResults.size > 0) uploads.push(uploadAdmissionDocument('certified_results', certifiedResults));
      if (uploads.length) await Promise.all(uploads);

      router.push('/admissions/status');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to complete registration.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold text-primary">
            <Logo className="size-8" />
            <span>UnivAI</span>
          </Link>
          <Button asChild variant="outline"><Link href="/login">Already have an account?</Link></Button>
        </div>

        {referralCode ? (
          <section className="rounded-3xl border border-primary/30 bg-primary/5 p-5 shadow-sm sm:p-6">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary"><ShieldCheck className="size-4" /> Referral code applied</p>
            <h2 className="mt-1 text-2xl font-bold">Code: {referralCode}</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">You can use this code to save 10% on your first short-course access payment.</p>
          </section>
        ) : null}

        {!choice ? (
          <section className="space-y-6 py-8">
            <div className="max-w-3xl space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary"><Sparkles className="size-4" /> Choose your registration path</p>
              <h1 className="text-4xl font-bold tracking-tight">What do you want to study?</h1>
              <p className="text-muted-foreground">Short courses do not need formal admission documents. Formal programmes are for diploma, degree, or university pathway applications.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl"><BookOpen className="size-6 text-primary" /> Short Course</CardTitle>
                  <CardDescription>For quick skills, certificates, practice lessons, and self-paced learning.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    <li>No admission documents required</li>
                    <li>Create a simple learner account</li>
                    <li>Browse and enroll in published short courses</li>
                    <li>Referral codes can give a first-access discount</li>
                  </ul>
                  <Button asChild className="w-full"><Link href={shortCourseHref}>Register for short courses</Link></Button>
                  <Button asChild variant="outline" className="w-full"><Link href="/short-courses">Browse short courses first</Link></Button>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl"><GraduationCap className="size-6 text-primary" /> Formal Programme</CardTitle>
                  <CardDescription>For full academic programmes that require admissions review.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    <li>Submit school/programme choice</li>
                    <li>Upload admission documents</li>
                    <li>Wait for offer and enrollment confirmation</li>
                  </ul>
                  <Button className="w-full" variant="secondary" onClick={() => setChoice('formal-programme')}>Apply for a formal programme</Button>
                </CardContent>
              </Card>
            </div>
          </section>
        ) : null}

        {choice === 'formal-programme' ? (
          <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="rounded-3xl border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>Formal programme application</CardTitle>
                <CardDescription>This path is for students applying to a UnivAI academic programme.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>You will create an applicant account, choose a school and programme, upload documents, and wait for admissions review.</p>
                <Button variant="outline" onClick={() => setChoice(null)}>Back to registration choices</Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Applicant details</CardTitle>
                <CardDescription>Complete the form below to submit your formal programme application.</CardDescription>
              </CardHeader>
              <CardContent>
                {error ? <PageError message={error} /> : null}
                <form onSubmit={submitFormalApplication} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label>Full name</Label><Input value={fullName} onChange={(event) => setFullName(event.target.value)} required /></div>
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
                    <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
                    <div className="space-y-2"><Label>Country</Label><Input value="Zambia" readOnly /></div>
                  </div>

                  <div className="space-y-2">
                    <Label>Referral code</Label>
                    <Input value={referralCode} onChange={(event) => setReferralCode(cleanReferralCode(event.target.value))} placeholder="Optional referral code" />
                    <p className="text-xs text-muted-foreground">Optional.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>School</Label>
                      <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={schoolId} onChange={(event) => { setSchoolId(event.target.value); setProgramId(''); }} required>
                        <option value="">Choose a school</option>
                        {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Programme</Label>
                      <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={programId} onChange={(event) => setProgramId(event.target.value)} required disabled={!schoolId}>
                        <option value="">{schoolId ? 'Choose a programme' : 'Choose a school first'}</option>
                        {filteredPrograms.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2"><Label>National ID</Label><Input name="nationalId" type="file" required /></div>
                    <div className="space-y-2"><Label>High school certificate</Label><Input name="certificate" type="file" required /></div>
                    <div className="space-y-2"><Label>Certified results</Label><Input name="certifiedResults" type="file" required /></div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>{loading ? <><Loader2 className="mr-2 size-4 animate-spin" /> Submitting...</> : 'Submit formal programme application'}</Button>
                </form>
              </CardContent>
            </Card>
          </section>
        ) : null}
      </div>
    </main>
  );
}
