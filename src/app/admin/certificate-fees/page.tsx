import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function CertificateFeesPage() {
  return (
    <AdminSectionPage
      title="Certificate Fees"
      description="Configure certificate payment rules and eligibility conditions for short courses and programme credentials."
      items={['Completion certificate', 'Verified certificate', 'Programme certificate', 'Eligibility checks', 'Payment required']}
    />
  );
}
