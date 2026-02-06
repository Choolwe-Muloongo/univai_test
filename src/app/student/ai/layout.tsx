import { SectionNav } from '@/components/layout/section-nav';

const links = [
  { href: '/student/ai', label: 'AI Hub' },
  { href: '/student/ai/tutor', label: 'AI Tutor' },
  { href: '/student/ai/lesson-companion', label: 'Lesson Companion' },
  { href: '/student/ai/exam-prep', label: 'Exam Prep' },
  { href: '/student/ai/career', label: 'Career' },
  { href: '/student/ai/notes', label: 'AI Notes' },
];

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionNav links={links} />
      {children}
    </div>
  );
}
