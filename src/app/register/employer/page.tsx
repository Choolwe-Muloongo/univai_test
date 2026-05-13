'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BriefcaseBusiness, Loader2 } from 'lucide-react';

import { Logo } from '@/components/icons/logo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { registerAccount } from '@/lib/api';

export default function EmployerRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('organizationName') || '').trim();
    const contactName = String(formData.get('contactName') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    try {
      await registerAccount({
        name: contactName ? `${name} - ${contactName}` : name,
        email,
        password,
        role: 'employer',
      });
      router.push('/employer/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to register employer account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <Link href="/" className="absolute left-4 top-4 flex items-center gap-2 text-lg font-semibold text-primary md:left-8 md:top-8">
        <Logo className="size-8" />
        <span>UnivAI</span>
      </Link>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
            Employer Registration
          </CardTitle>
          <CardDescription>
            Register an employer account to post jobs, research opportunities and partnerships for UnivAI learners.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Registration failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization name</Label>
                <Input id="organizationName" name="organizationName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact person</Label>
                <Input id="contactName" name="contactName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" minLength={6} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile">Organization profile</Label>
              <Textarea id="profile" name="profile" rows={5} placeholder="Industries, hiring focus, research interests, and partnership goals." />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create employer account
            </Button>
            <p className="text-sm text-muted-foreground">
              Already registered? <Link href="/login/employer" className="text-primary hover:underline">Employer login</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
