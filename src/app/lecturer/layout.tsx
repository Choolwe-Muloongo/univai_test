'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { AppShell } from '@/components/layout/app-shell';
import { LECTURER_ROLES, ROLE } from '@/lib/auth/roles';

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={LECTURER_ROLES}
      contextLabel="Lecturer portal"
      pendingTitle="Lecturer access pending"
      pendingDescription="Your lecturer access is not active yet. Submit your application and wait for approval to continue."
      pendingActions={[
        { label: 'Apply as Lecturer', href: '/lecturer/apply' },
        { label: 'Go to Lecturer Login', href: '/login/lecturer', variant: 'outline' },
      ]}
    >
      <AppShell role={ROLE.LECTURER}>{children}</AppShell>
    </RoleGuard>
  );
}
