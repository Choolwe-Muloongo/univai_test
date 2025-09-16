// src/app/login/lecturer/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import Link from 'next/link';

export default function LecturerLoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem('userRole', 'lecturer');
    localStorage.removeItem('userSchoolId');
    router.push('/lecturer/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute left-8 top-8 flex items-center gap-2 text-lg font-semibold text-primary">
        <Logo className="size-8" />
        <Link href="/">UnivAI</Link>
      </div>

      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Lecturer Login</CardTitle>
            <CardDescription>
              Access your lecturer dashboard.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="lecturer@univai.edu"
                  defaultValue="lecturer@univai.edu"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  defaultValue="password123"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button className="w-full" type="submit">
                Login as Lecturer
              </Button>
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
