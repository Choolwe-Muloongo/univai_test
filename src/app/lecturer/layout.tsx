'use client';

import { usePathname } from 'next/navigation';

import { RoleGuard } from '@/components/auth/role-guard';
import { AppShell } from '@/components/layout/app-shell';
import { LECTURER_ROLES, ROLE } from '@/lib/auth/roles';

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/lecturer/apply') {
    return <>{children}</>;
  }

  return (
    <RoleGuard
      allowedRoles={LECTURER_ROLES}
      contextLabel="Lecturer portal"
      pendingTitle="Lecturer access pending"
      pendingDescription="Your lecturer access is not active yet. Submit your application and wait for approval to continue."
      requireActiveLecturer
      pendingActions={[
        { label: 'Apply as Lecturer', href: '/lecturer/apply' },
        { label: 'Go to Lecturer Login', href: '/login/lecturer', variant: 'outline' },
      ]}
    >
      <AppShell role={ROLE.LECTURER}>{children}</AppShell>
    </RoleGuard>
  );
}
