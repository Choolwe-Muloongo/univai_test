import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function NotificationsPage() {
  return (
    <AdminSectionPage
      title="Notifications"
      description="Coordinate operational notifications for admissions, finance, course activity and content review."
      items={['Audience segment', 'Channel', 'Subject', 'Status', 'Scheduled date', 'Delivery result']}
    />
  );
}
