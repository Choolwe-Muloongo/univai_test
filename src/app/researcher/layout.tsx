'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { AppShell } from '@/components/layout/app-shell';
import { RESEARCHER_ROLES, ROLE } from '@/lib/auth/roles';

export default function ResearcherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={RESEARCHER_ROLES}
      contextLabel="Research portal"
      pendingTitle="Researcher access pending"
      pendingDescription="Your researcher access is not active yet. Submit your application and wait for approval to continue."
      pendingActions={[
        { label: 'Apply as Researcher', href: '/register/researcher' },
        { label: 'Go to Researcher Login', href: '/login/researcher', variant: 'outline' },
      ]}
    >
      <AppShell role={ROLE.RESEARCHER}>{children}</AppShell>
    </RoleGuard>
  );
}
