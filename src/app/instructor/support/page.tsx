import { PlatformPage } from '@/components/platform/platform-page';

export default function InstructorSupportPage() {
  return (
    <PlatformPage
      eyebrow="Support"
      title="Instructor support"
      description="Get support for course review, AI package use, learner issues and payout operations."
      items={['Course review help', 'AI builder help', 'Learner support', 'Payout support']}
    />
  );
}
