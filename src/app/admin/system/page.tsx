import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function SystemPage() {
  return (
    <AdminSectionPage
      title="System"
      description="Central settings for integrations, roles, permissions, audit trails and system health."
      items={['Settings', 'Integrations', 'Roles and permissions', 'Audit logs', 'System health']}
    />
  );
}
