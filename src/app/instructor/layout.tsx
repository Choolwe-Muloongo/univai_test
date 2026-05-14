'use client';

import type { ReactNode } from 'react';

import { RoleGuard } from '@/components/auth/role-guard';
import { AppShell } from '@/components/layout/app-shell';
import { INSTRUCTOR_ROLES, ROLE } from '@/lib/auth/roles';

export default function InstructorLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={INSTRUCTOR_ROLES}
      contextLabel="Instructor portal"
      pendingTitle="Instructor access pending"
      pendingDescription="Your instructor access is not active yet. Submit your instructor application and wait for approval to continue."
      pendingActions={[
        { label: 'Apply as Instructor', href: '/apply/instructor' },
        { label: 'Go to Instructor Login', href: '/login/instructor', variant: 'outline' },
      ]}
    >
      <AppShell role={ROLE.INSTRUCTOR}>{children}</AppShell>
    </RoleGuard>
  );
}
