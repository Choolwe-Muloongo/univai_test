'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import { login } from '@/lib/api';
import { ApiError } from '@/lib/api/client';
import { useSession } from '@/components/providers/session-provider';
import { getPostAuthDestination, type RoleKey } from '@/lib/auth-routing';
import { RoleIntentSwitcher } from '@/components/auth/role-intent-switcher';

type DemoCredential = {
  label?: string;
  email: string;
  password: string;
};

type AuthLoginPageProps = {
  currentRole: RoleKey;
  loginRole?: RoleKey;
  title: string;
  description: string;
  submitLabel?: string;
  emailPlaceholder?: string;
  demoCredentials?: DemoCredential[];
  showRegisterLink?: boolean;
  registerHref?: string;
  registerLabel?: string;
  allowPrivilegedFallback?: boolean;
};

export function AuthLoginPage({
  currentRole,
  loginRole,
  title,
  description,
  submitLabel = 'Sign in',
  emailPlaceholder = 'you@example.com',
  demoCredentials = [],
  showRegisterLink = false,
  registerHref = '/register',
  registerLabel = 'Create an account',
  allowPrivilegedFallback = false,
}: AuthLoginPageProps) {
  const router = useRouter();
  const { refresh } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let session;

      try {
        session = await login(loginRole ? { email, password, role: loginRole } : { email, password });
      } catch (roleError) {
        if (!allowPrivilegedFallback) throw roleError;

        const nextSession = await login({ email, password });
        if (nextSession?.user?.role !== 'admin') throw roleError;
        session = nextSession;
      }

      await refresh();
      router.push(getPostAuthDestination(session?.user));
    } catch (err) {
      console.error(err);

      const message =
        err instanceof ApiError
          ? (err.details as { message?: string } | null)?.message || err.message
          : 'Sign in failed. Check your email and password, then try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="glass-nav sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2 text-base font-semibold text-primary sm:text-lg">
            <Logo className="size-9 shrink-0 rounded-lg brand-logo-glow sm:hidden" />
            <Logo className="hidden size-10 shrink-0 rounded-xl brand-logo-glow sm:block" />
            <span className="brand-gradient-text truncate text-xl font-extrabold">UnivAI</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="px-3">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="px-3">
              <Link href="/policies">Policies</Link>
            </Button>
            <Button asChild size="sm" className="sm:h-10 sm:px-4">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.10),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_30%)]" />

        <div className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
          <div className="hidden space-y-6 lg:block">
            <div className="inline-flex rounded-full border bg-card/80 px-4 py-2 text-sm font-medium text-primary shadow-sm backdrop-blur">
              UnivAI secure access
            </div>

            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
                Continue your journey with <span className="brand-gradient-text">UnivAI</span>.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Sign in to access your dashboard, learning tools, progress, courses, and role-based workspace.
              </p>
            </div>

            <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
              {[
                ['Learn', 'Courses and progress'],
                ['Create', 'Teaching tools'],
                ['Connect', 'Opportunities'],
              ].map(([heading, body]) => (
                <div key={heading} className="rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur">
                  <div className="mb-3 h-1.5 w-8 rounded-full bg-primary" />
                  <p className="text-sm font-semibold text-foreground">{heading}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="mb-5 text-center lg:hidden">
              <p className="text-sm font-medium text-primary">UnivAI secure access</p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
                Continue with <span className="brand-gradient-text">UnivAI</span>
              </h1>
            </div>

            <Card className="border bg-card/95 shadow-xl backdrop-blur">
              <CardHeader className="space-y-2 text-center">
                <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
                <CardDescription className="text-sm">{description}</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleLogin} className="space-y-5">
                  {error && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`${currentRole}-email`}>Email address</Label>
                    <Input id={`${currentRole}-email`} type="email" placeholder={emailPlaceholder} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="h-11" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor={`${currentRole}-password`}>Password</Label>
                      <Link href="/login/reset" className="text-xs font-semibold text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative">
                      <Input id={`${currentRole}-password`} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="h-11 pr-16" />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground">
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <Button className="h-11 w-full font-semibold" type="submit" disabled={loading}>
                    {loading ? 'Signing in...' : submitLabel}
                  </Button>

                  {process.env.NODE_ENV === 'development' && demoCredentials.length > 0 ? (
                    <div className="rounded-xl border border-dashed bg-muted/50 p-3 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">Demo credentials</p>
                      {demoCredentials.map((credential) => (
                        <p key={`${credential.email}-${credential.label ?? ''}`}>{credential.label ? `${credential.label}: ` : ''}{credential.email} / {credential.password}</p>
                      ))}
                    </div>
                  ) : null}

                  <div className="border-t pt-5">
                    <RoleIntentSwitcher currentRole={currentRole} compact />
                  </div>

                  {showRegisterLink ? (
                    <p className="text-center text-sm text-muted-foreground">
                      New student?{' '}
                      <Link href={registerHref} className="font-semibold text-primary hover:underline">
                        {registerLabel}
                      </Link>
                    </p>
                  ) : null}

                  <p className="text-center text-xs leading-5 text-muted-foreground">
                    Review UnivAI <Link href="/terms" className="font-semibold text-primary hover:underline">Terms</Link>, <Link href="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>, and <Link href="/policies" className="font-semibold text-primary hover:underline">Policies</Link>.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
