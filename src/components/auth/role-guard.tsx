'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getRoleLabel,
  hasAccess,
  isKnownUserRole,
  PENDING_APPROVAL_ROLES,
  ROLE,
  type UserRole,
} from '@/lib/auth/roles';

type GuardAction = {
  label: string;
  href: string;
  variant?: 'default' | 'outline';
};

type RoleGuardProps = {
  children: React.ReactNode;
  allowedRoles: readonly UserRole[];
  contextLabel: string;
  pendingTitle: string;
  pendingDescription: string;
  pendingActions: readonly GuardAction[];
};

const rolePortalMap: Partial<Record<UserRole, GuardAction>> = {
  [ROLE.ADMIN]: { label: 'Go to Admin Portal', href: '/admin/dashboard' },
  [ROLE.LECTURER]: { label: 'Go to Lecturer Portal', href: '/lecturer/dashboard' },
  [ROLE.INSTRUCTOR]: { label: 'Go to Instructor Portal', href: '/instructor/dashboard' },
  [ROLE.EMPLOYER]: { label: 'Go to Employer Portal', href: '/employer/dashboard' },
  [ROLE.STUDENT]: { label: 'Go to Student Portal', href: '/student/dashboard' },
  [ROLE.PREMIUM_STUDENT]: { label: 'Go to Student Portal', href: '/student/dashboard' },
  [ROLE.FREEMIUM_STUDENT]: { label: 'Go to Student Portal', href: '/student/dashboard' },
  [ROLE.ENROLLED]: { label: 'Go to Student Portal', href: '/student/dashboard' },
  [ROLE.APPLICANT]: { label: 'Open Admissions Status', href: '/admissions/status' },
};

function GuardFrame({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-background p-6">{children}</div>;
}

function AccessSkeleton({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-muted" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl border bg-muted/40" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl border bg-muted/30" />
        <p className="text-sm text-muted-foreground">Verifying {label.toLowerCase()} access...</p>
      </div>
    </div>
  );
}

export function RoleGuard({
  children,
  allowedRoles,
  contextLabel,
  pendingTitle,
  pendingDescription,
  pendingActions,
}: RoleGuardProps) {
  const router = useRouter();
  const { session, loading } = useSession();
  const user = session?.user;
  const role = user?.role;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  if (loading) {
    return <AccessSkeleton label={contextLabel} />;
  }

  if (!user) {
    return (
      <GuardFrame>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Redirecting to login</CardTitle>
            <CardDescription>You must sign in before opening the {contextLabel.toLowerCase()}.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </GuardFrame>
    );
  }

  if (!isKnownUserRole(role)) {
    return (
      <GuardFrame>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Account role missing</CardTitle>
            <CardDescription>Your account does not have a recognized role for this portal.</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/login">Sign in again</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </GuardFrame>
    );
  }

  if (allowedRoles.some((allowedRole) => hasAccess(user, allowedRole))) {
    return <>{children}</>;
  }

  if (PENDING_APPROVAL_ROLES.includes(role)) {
    const actions = pendingActions.length > 0 ? pendingActions : [{ label: 'Go to Login', href: '/login' }];

    return (
      <GuardFrame>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>{pendingTitle}</CardTitle>
            <CardDescription>{pendingDescription}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Current role: <span className="font-medium text-foreground">{getRoleLabel(role)}</span>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <Button key={`${action.href}-${index}`} variant={action.variant ?? (index === 0 ? 'default' : 'outline')} asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
          </CardFooter>
        </Card>
      </GuardFrame>
    );
  }

  const suggestedPortal = rolePortalMap[role];

  return (
    <GuardFrame>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Wrong portal for your account</CardTitle>
          <CardDescription>
            Your account is assigned as <strong>{getRoleLabel(role)}</strong>, so you cannot access the {contextLabel.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-2">
          {suggestedPortal ? (
            <Button asChild>
              <Link href={suggestedPortal.href}>{suggestedPortal.label}</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/login">Switch account</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/login">Use another account</Link>
          </Button>
        </CardFooter>
      </Card>
    </GuardFrame>
  );
}
