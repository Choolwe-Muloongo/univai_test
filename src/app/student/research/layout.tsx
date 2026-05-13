import { SectionNav } from '@/components/layout/section-nav';

const links = [
  { href: '/student/research', label: 'Opportunities' },
  { href: '/student/research/my-labs', label: 'My Labs' },
];

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionNav links={links} />
      {children}
    </div>
  );
}
