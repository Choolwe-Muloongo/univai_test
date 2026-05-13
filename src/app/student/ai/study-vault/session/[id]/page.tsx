import { PlatformPage } from '@/components/platform/platform-page';

export default function StudyVaultSessionPage() {
  return (
    <PlatformPage
      eyebrow="Study Session"
      title="AI-generated study pack"
      description="A saved study session can hold summaries, key definitions, likely questions, flashcards, practice quizzes and timetable output."
      items={['Summary notes', 'Key concepts', 'Likely questions', 'Flashcards', 'Practice quiz', 'Study timetable']}
    />
  );
}
