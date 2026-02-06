'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/components/providers/session-provider';

const allowedRoles = new Set(['student', 'premium-student', 'freemium-student', 'enrolled']);

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(session?.user?.role ?? null);
  }, [session]);

  if (loading || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Loading student access</CardTitle>
            <CardDescription>Checking your enrollment status.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!allowedRoles.has(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Access pending approval</CardTitle>
            <CardDescription>
              Your application is still under review. Complete the admissions steps to unlock the student dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Visit your admissions status page to track payment and review progress.
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/admissions/status">View Admissions Status</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admissions/fee">Pay Admission Fee</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <AppShell showAiTutor>{children}</AppShell>;
}
