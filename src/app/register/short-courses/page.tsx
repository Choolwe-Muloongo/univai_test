'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Gift, ShieldCheck } from 'lucide-react';

import { WhatsAppChannelRequirement } from '@/components/auth/whatsapp-channel-requirement';
import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { registerAccount } from '@/lib/api';

export default function ShortCourseRegisterPage() {
  return (
    <Suspense fallback={<PageLoading message="Loading registration..." />}>
      <ShortCourseRegisterContent />
    </Suspense>
  );
}

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/short-courses';
  }
  return value;
}

function cleanReferralCode(value: string | null | undefined) {
  return (value ?? '').replace(/[^A-Za-z0-9]+/g, '').toUpperCase().slice(0, 32);
}

function ShortCourseRegisterContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const initialReferralCode = cleanReferralCode(params.get('ref') || params.get('affiliateCode') || params.get('referralCode'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('Zambia');
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [joinedChannel, setJoinedChannel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const referralBenefit = useMemo(() => {
    if (!referralCode) return null;
    return { code: referralCode, discount: '10% off your first access payment' };
  }, [referralCode]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (!joinedChannel) {
        setError('Join the UnivAI WhatsApp channel before creating an account.');
        return;
      }
      const cleanCode = cleanReferralCode(referralCode);
      await registerAccount({
        name,
        email,
        password,
        role: 'free-student',
        acceptedWhatsappChannel: joinedChannel,
        ...(cleanCode ? { affiliateCode: cleanCode, referralCode: cleanCode } : {}),
      } as any);
      router.replace(next);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create your short-course account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold text-primary">
            <Logo className="size-8" />
            <span>UnivAI</span>
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href="/short-courses">Browse short courses</Link></Button>
            <Button asChild variant="ghost"><Link href="/policies">Policies</Link></Button>
            <Button asChild variant="ghost"><Link href="/login">Log in</Link></Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-3xl border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-3xl">Short-course account</CardTitle>
              <CardDescription>Use this path if you only want short courses. No admission documents or formal programme application is required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>You can browse courses, enrol, learn with card-based lessons, practise with quizzes, and earn certificates after passing assessments.</p>
              <div className="rounded-2xl border bg-background p-4">
                <p className="flex items-center gap-2 font-medium text-foreground"><Gift className="size-4 text-primary" /> Referral code benefit</p>
                <p className="mt-1">Have a referral code? Add it to save <strong>10% on your first access payment</strong>.</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="font-medium text-foreground">Already browsing?</p>
                <p className="mt-1">You can go back to the short-course catalogue anytime. Creating an account only unlocks enrolment and progress tracking.</p>
                <Button asChild variant="outline" className="mt-3"><Link href="/short-courses">Go to short courses</Link></Button>
              </div>
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
              {referralBenefit ? (
                <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-primary"><ShieldCheck className="size-4" /> Referral code applied: {referralBenefit.code}</p>
                  <p className="mt-1 text-muted-foreground">{referralBenefit.discount}</p>
                </div>
              ) : null}
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2"><Label>Full name</Label><Input value={name} onChange={(event) => setName(event.target.value)} required /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
                <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
                <div className="space-y-2"><Label>Country</Label><Input value={country} onChange={(event) => setCountry(event.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Referral code</Label>
                  <Input value={referralCode} onChange={(event) => setReferralCode(cleanReferralCode(event.target.value))} placeholder="Optional referral code" />
                  <p className="text-xs text-muted-foreground">Optional. A valid code gives a first-access discount.</p>
                </div>
                <WhatsAppChannelRequirement checked={joinedChannel} onCheckedChange={setJoinedChannel} />
                <p className="rounded-2xl border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
                  Before creating an account, review the <Link href="/terms" className="font-semibold text-primary hover:underline">Terms</Link>, <Link href="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>, and <Link href="/payment-rules" className="font-semibold text-primary hover:underline">Payment Rules</Link>.
                </p>
                <Button type="submit" className="w-full" disabled={loading || !joinedChannel}>{loading ? 'Creating account...' : 'Create account and continue'}</Button>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">Already have an account? <Link className="text-primary" href={`/login?next=${encodeURIComponent(next)}`}>Log in and continue</Link></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
