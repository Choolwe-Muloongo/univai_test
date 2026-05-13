'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { AppShell } from '@/components/layout/app-shell';
import { ROLE, STUDENT_ROLES } from '@/lib/auth/roles';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={STUDENT_ROLES}
      contextLabel="Student portal"
      pendingTitle="Access pending approval"
      pendingDescription="Your application is still under review. Complete admissions requirements to unlock the student portal."
      pendingActions={[
        { label: 'View Admissions Status', href: '/admissions/status' },
        { label: 'Applicant Portal', href: '/admissions/portal', variant: 'outline' },
        { label: 'Pay Admission Fee', href: '/admissions/fee', variant: 'outline' },
      ]}
    >
      <AppShell role={ROLE.STUDENT} showAiTutor>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
