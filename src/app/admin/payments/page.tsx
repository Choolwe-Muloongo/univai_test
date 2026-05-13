import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function PaymentsPage() {
  return (
    <AdminSectionPage
      title="Payments"
      description="Track application fees, programme tuition, short-course entry fees, certificate fees, AI package fees and payout-linked transactions."
      items={['Payment type', 'Provider reference', 'Amount and currency', 'Payment status', 'Paid date', 'User account']}
    />
  );
}
