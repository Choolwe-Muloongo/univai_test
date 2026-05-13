import { PlatformPage } from '@/components/platform/platform-page';

export default function ClassViewPage() {
  return (
    <PlatformPage
      eyebrow="Class View"
      title="Protected course learning space"
      description="A mobile-first Class View for formal programmes, short courses and instructor courses with official content, progress, notes and lecturer-supervised AI support."
      items={['Course outline and units', 'Protected lesson viewer', 'AI tutor panel', 'Notes and resources', 'Progress tracking', 'Certificate or transcript pathway']}
    />
  );
}
