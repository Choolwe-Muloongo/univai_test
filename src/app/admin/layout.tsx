'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { AppShell } from '@/components/layout/app-shell';
import { ADMIN_ROLES } from '@/lib/auth/roles';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={ADMIN_ROLES}
      contextLabel="Admin portal"
      pendingTitle="Administrative access pending"
      pendingDescription="Your account does not yet have active admin approval. Contact the system owner to complete provisioning."
      pendingActions={[
        { label: 'Go to Admin Login', href: '/login/admin' },
        { label: 'Switch account', href: '/login', variant: 'outline' },
      ]}
    >
      <AppShell>{children}</AppShell>
    </RoleGuard>
  );
}
