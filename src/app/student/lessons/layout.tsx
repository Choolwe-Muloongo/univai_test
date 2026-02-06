import { SectionNav } from '@/components/layout/section-nav';

const links = [
  { href: '/student/lessons', label: 'All Lessons' },
  { href: '/student/lessons/library', label: 'Library' },
];

export default function LessonsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionNav links={links} />
      {children}
    </div>
  );
}
