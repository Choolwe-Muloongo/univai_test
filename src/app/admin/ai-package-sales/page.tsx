import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function AiPackageSalesPage() {
  return (
    <AdminSectionPage
      title="AI Package Sales"
      description="Track paid instructor AI packages, generation credits, payment status and usage against source-material requirements."
      items={['AI Course Starter', 'AI Course Builder', 'AI Course Pro', 'AI Full Course Studio', 'Payment status', 'Generation credits']}
    />
  );
}
