import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function DeliveryGroupsPage() {
  return (
    <AdminSectionPage
      title="Course Delivery Groups"
      description="Split a course offering only where delivery logistics require online, hybrid or physical groups."
      items={['Online group', 'Hybrid practical group', 'Physical session group', 'Capacity', 'Assistant lecturer', 'Schedule notes']}
    />
  );
}
