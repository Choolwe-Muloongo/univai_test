'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { AppShell } from '@/components/layout/app-shell';
import { EMPLOYER_ROLES, ROLE } from '@/lib/auth/roles';

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={EMPLOYER_ROLES}
      contextLabel="Employer portal"
      pendingTitle="Employer access pending"
      pendingDescription="Your employer account is awaiting approval. Finish your employer onboarding steps and try again."
      pendingActions={[
        { label: 'Go to Employer Login', href: '/login/employer' },
        { label: 'Return to Home', href: '/', variant: 'outline' },
      ]}
    >
      <AppShell role={ROLE.EMPLOYER}>{children}</AppShell>
    </RoleGuard>
  );
}
