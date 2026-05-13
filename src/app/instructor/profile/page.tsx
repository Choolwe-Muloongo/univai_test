import { PlatformPage } from '@/components/platform/platform-page';

export default function InstructorProfilePage() {
  return (
    <PlatformPage
      eyebrow="Verification"
      title="Instructor profile and credentials"
      description="Maintain instructor expertise, qualifications, documents and marketplace verification status."
      items={['Expertise', 'Bio', 'Qualifications', 'Portfolio', 'Documents', 'Verification status']}
    />
  );
}
