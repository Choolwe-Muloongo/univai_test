import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function AdminPayoutsPage() {
  return (
    <AdminSectionPage
      title="Payouts"
      description="Review and process instructor payout requests from approved marketplace earnings."
      items={['Instructor', 'Amount', 'Method', 'Requested date', 'Paid date', 'Reference']}
    />
  );
}
