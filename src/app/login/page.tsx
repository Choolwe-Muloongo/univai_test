// src/app/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import Link from 'next/link';
import { login } from '@/lib/api';
import { ApiError } from '@/lib/api/client';
import { useSession } from '@/components/providers/session-provider';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStudentLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      const session = await login({ email, password });
      await refresh();
      const role = session?.user?.role;
      if (role === 'applicant') {
        router.push('/admissions/status');
      } else {
        router.push('/student/dashboard');
      }
    } catch (err) {
      console.error(err);
      const message =
        err instanceof ApiError
          ? (err.details as { message?: string } | null)?.message || err.message
          : 'Login failed. Please check your credentials and try again.';
      setError(message);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute left-4 top-4 md:left-8 md:top-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Logo className="size-8" />
          <span>UnivAI</span>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Student Login</CardTitle>
            <CardDescription>
              Welcome back! Please log in to your account.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleStudentLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            <div className="space-y-2">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-password">Password</Label>
              <Input
                id="student-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button className="w-full" type="submit">
                Login as Student
              </Button>
              <div className="w-full rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Demo credentials</p>
                <p>student.premium@univai.edu / password123</p>
              </div>
              <div className="text-center text-xs text-muted-foreground">
                Other portals:{' '}
                <Link href="/login/lecturer" className="font-semibold text-primary hover:underline">
                  Lecturer
                </Link>
                {' | '}
                <Link href="/login/employer" className="font-semibold text-primary hover:underline">
                  Employer
                </Link>
                {' | '}
                <Link href="/login/admin" className="font-semibold text-primary hover:underline">
                  Admin
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                New student?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-primary hover:underline"
                >
                  Create an account
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Forgot your password?{' '}
                <Link href="/login/reset" className="font-semibold text-primary hover:underline">
                  Reset it here
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
