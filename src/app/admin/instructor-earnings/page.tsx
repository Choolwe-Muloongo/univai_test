import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function InstructorEarningsPage() {
  return (
    <AdminSectionPage
      title="Instructor Earnings"
      description="Monitor marketplace gross revenue, UnivAI commission and instructor net earnings."
      items={['Gross amount', 'Commission amount', 'Net amount', 'Course source', 'Payment source', 'Earning status']}
    />
  );
}
