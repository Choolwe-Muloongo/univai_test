'use client';

import type { ReactNode } from 'react';

import { RoleGuard } from '@/components/auth/role-guard';
import { AppShell } from '@/components/layout/app-shell';
import {
  ADMIN_ROLES,
  EMPLOYER_ROLES,
  INSTRUCTOR_ROLES,
  LECTURER_ROLES,
  STUDENT_ROLES,
} from '@/lib/auth/roles';

// The portal shows a signed-in researcher their own score, wallet and records, so it
// requires a session. Public browsing lives on /research-overview, which needs no account.
const RESEARCH_PORTAL_ROLES = [
  ...STUDENT_ROLES,
  ...LECTURER_ROLES,
  ...EMPLOYER_ROLES,
  ...INSTRUCTOR_ROLES,
  ...ADMIN_ROLES,
];

export default function ResearchLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={RESEARCH_PORTAL_ROLES}
      contextLabel="Research portal"
      pendingTitle="Research access pending approval"
      pendingDescription="Your account is still awaiting approval. Once it is active you can open the research portal."
      pendingActions={[
        { label: 'Browse research', href: '/research-overview' },
        { label: 'Switch account', href: '/login', variant: 'outline' },
      ]}
    >
      <AppShell>{children}</AppShell>
    </RoleGuard>
  );
}
