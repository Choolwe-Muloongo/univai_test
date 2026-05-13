import { PlatformPage } from '@/components/platform/platform-page';

export default function LessonViewPage() {
  return (
    <PlatformPage
      eyebrow="Lesson View"
      title="Official lesson workspace"
      description="Lesson View keeps official UnivAI materials view-only by default while allowing AI summaries, flashcards and practice questions when the learner has access."
      items={['Text, video and diagram content', 'No default download action', 'Watermark-ready official notes', 'AI summary controls', 'Quiz and assignment hooks', 'Access logging foundation']}
    />
  );
}
