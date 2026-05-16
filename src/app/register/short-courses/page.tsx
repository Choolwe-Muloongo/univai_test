'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError } from '@/components/ui/page-feedback';
import { registerAccount } from '@/lib/api';

export default function ShortCourseRegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/short-courses';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('Zambia');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      await registerAccount({ name, email, password, role: 'free-student' });
      router.push(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create your short-course account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-5xl space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold text-primary">
          <Logo className="size-8" />
          <span>UnivAI</span>
        </Link>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-3xl border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-3xl">Short-course account</CardTitle>
              <CardDescription>Use this path if you only want short courses. No admission documents or formal programme application is required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>You can browse courses, enrol, learn with card-based lessons, practise with quizzes, and earn certificates after passing assessments.</p>
              <div className="rounded-2xl border bg-background p-4">
                <p className="font-medium text-foreground">Need a degree or diploma?</p>
                <p className="mt-1">Use formal programme registration when admissions are open.</p>
                <Button asChild variant="outline" className="mt-3"><Link href="/register">Formal programme registration</Link></Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>Start with a simple learner account for short courses.</CardDescription>
            </CardHeader>
            <CardContent>
              {error ? <PageError message={error} /> : null}
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2"><Label>Full name</Label><Input value={name} onChange={(event) => setName(event.target.value)} required /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
                <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
                <div className="space-y-2"><Label>Country</Label><Input value={country} onChange={(event) => setCountry(event.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create short-course account'}</Button>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">Already have an account? <Link className="text-primary" href="/login">Log in</Link></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
