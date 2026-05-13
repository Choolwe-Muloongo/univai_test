import { PlatformPage } from '@/components/platform/platform-page';

export default function StudyVaultUploadPage() {
  return (
    <PlatformPage
      eyebrow="Study Upload"
      title="Upload learner-owned material"
      description="Accept PDFs, slides, images of notes, assignment briefs and past papers as student-owned sources for AI-powered learning support."
      items={['PDF and document upload', 'Source type tagging', 'Extracted text pipeline', 'Course linking', 'Private learner storage']}
    />
  );
}
