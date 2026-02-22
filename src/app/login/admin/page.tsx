// src/app/login/admin/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import Link from 'next/link';
import { login } from '@/lib/api';
import { useSession } from '@/components/providers/session-provider';

export default function AdminLoginPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [email, setEmail] = useState('admin@univai.edu');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password, role: 'admin' });
      await refresh();
      router.push('/admin/dashboard');
    } catch (err) {
      console.error(err);
      setError('Login failed. Please check your credentials and try again.');
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
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Access the administrative dashboard.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@univai.edu"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button className="w-full" type="submit">
                Login as Admin
              </Button>
              <div className="w-full rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Demo credentials</p>
                <p>admin@univai.edu / password123</p>
              </div>
               <p className="text-sm text-muted-foreground">
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        Are you a student?
                    </Link>
                </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
