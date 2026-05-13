import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function InvoicesPage() {
  return (
    <AdminSectionPage
      title="Invoices"
      description="Issue and monitor invoices for learner fees, certificates, short courses and instructor AI packages."
      items={['Invoice number', 'Source type', 'Due date', 'Pending status', 'Paid status', 'User account']}
    />
  );
}
