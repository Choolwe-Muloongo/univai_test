import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function AdmissionsReportsPage() {
  return (
    <AdminSectionPage
      title="Admissions Reports"
      description="Report on applications, documents, offers, intakes, route changes and admissions conversion."
      items={['Applications', 'Missing documents', 'Offers', 'Accepted offers', 'Intakes', 'Route changes']}
    />
  );
}
