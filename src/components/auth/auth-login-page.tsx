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
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_32%)]" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between px-10 py-8 lg:flex xl:px-16">
          <Link href="/" className="flex w-fit items-center gap-3 rounded-2xl px-1 py-1 transition hover:opacity-90">
            <div className="rounded-2xl bg-white/10 p-2 ring-1 ring-white/15">
              <Logo className="size-9 text-emerald-300" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">UnivAI</p>
              <p className="text-xs text-white/60">Learn smarter. Build your future.</p>
            </div>
          </Link>

          <div className="max-w-2xl space-y-8">
            <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-emerald-100 backdrop-blur">
              AI-powered learning for students, lecturers, instructors, and employers
            </div>

            <div className="space-y-5">
              <h1 className="text-5xl font-bold leading-tight tracking-tight xl:text-6xl">
                Welcome back to your learning command center.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-white/70">
                Continue your courses, manage learning tools, track progress, and move one step closer to mastery.
              </p>
            </div>

            <div className="grid max-w-xl gap-4 sm:grid-cols-3">
              {[
                ['Smart courses', 'Structured learning paths'],
                ['AI support', 'Guided study experience'],
                ['Secure access', 'Role-based dashboards'],
              ].map(([heading, body]) => (
                <div key={heading} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="mb-3 size-2 rounded-full bg-emerald-300" />
                  <p className="text-sm font-semibold">{heading}</p>
                  <p className="mt-1 text-xs text-white/60">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/45">© {new Date().getFullYear()} UnivAI. Built for modern education.</p>
        </section>

        <section className="flex min-h-screen flex-col bg-slate-950 px-4 py-5 sm:px-6 lg:bg-white lg:text-slate-950">
          <div className="mb-6 flex items-center justify-between gap-3 lg:mb-10">
            <Link href="/" className="flex min-w-0 items-center gap-3 rounded-2xl px-1 py-1 text-white transition hover:opacity-90 lg:text-slate-950">
              <div className="shrink-0 rounded-2xl bg-white/10 p-2 ring-1 ring-white/15 lg:bg-emerald-50 lg:ring-emerald-100">
                <Logo className="size-8 text-emerald-300 lg:text-emerald-700" />
              </div>
              <span className="truncate text-lg font-bold">UnivAI</span>
            </Link>

            <Button asChild variant="outline" className="h-9 shrink-0 border-white/20 bg-white/10 text-white hover:bg-white/20 lg:border-slate-200 lg:bg-white lg:text-slate-900 lg:hover:bg-slate-50">
              <Link href="/">Home</Link>
            </Button>
          </div>

          <div className="flex flex-1 items-center justify-center pb-6">
            <div className="w-full max-w-md">
              <Card className="border-white/15 bg-white text-slate-950 shadow-2xl shadow-black/20 lg:border-slate-200">
                <CardHeader className="space-y-2 text-center">
                  <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
                  <CardDescription className="text-sm">{description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor={`${currentRole}-email`}>Email address</Label>
                      <Input
                        id={`${currentRole}-email`}
                        type="email"
                        placeholder={emailPlaceholder}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <Label htmlFor={`${currentRole}-password`}>Password</Label>
                        <Link href="/login/reset" className="text-xs font-semibold text-emerald-700 hover:underline">
                          Forgot password?
                        </Link>
                      </div>

                      <div className="relative">
                        <Input
                          id={`${currentRole}-password`}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          autoComplete="current-password"
                          required
                          className="h-11 pr-16"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-900"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    <Button className="h-11 w-full bg-emerald-600 font-semibold hover:bg-emerald-700" type="submit" disabled={loading}>
                      {loading ? 'Signing in...' : submitLabel}
                    </Button>

                    {process.env.NODE_ENV === 'development' && demoCredentials.length > 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
                        <p className="font-semibold text-slate-900">Demo credentials</p>
                        {demoCredentials.map((credential) => (
                          <p key={`${credential.email}-${credential.label ?? ''}`}>
                            {credential.label ? `${credential.label}: ` : ''}
                            {credential.email} / {credential.password}
                          </p>
                        ))}
                      </div>
                    ) : null}

                    <div className="border-t pt-5">
                      <RoleIntentSwitcher currentRole={currentRole} compact />
                    </div>

                    {showRegisterLink ? (
                      <p className="text-center text-sm text-slate-600">
                        New student?{' '}
                        <Link href={registerHref} className="font-semibold text-emerald-700 hover:underline">
                          {registerLabel}
                        </Link>
                      </p>
                    ) : null}
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
