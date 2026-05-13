import { AdminSectionPage } from '@/components/admin/admin-section-page';

export default function OfficialContentPage() {
  return (
    <AdminSectionPage
      title="Protected Official Content"
      description="Control learner visibility, download protection, AI readability and human review for official UnivAI materials."
      items={['Private storage', 'Signed URL ready', 'Download disabled by default', 'AI-readable when permitted', 'Watermark-ready', 'Access logs foundation']}
    />
  );
}
