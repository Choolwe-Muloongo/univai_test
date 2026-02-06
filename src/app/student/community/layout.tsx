import { SectionNav } from '@/components/layout/section-nav';

const links = [
  { href: '/student/community', label: 'Feed' },
  { href: '/student/community/groups', label: 'Groups' },
  { href: '/student/community/events', label: 'Events' },
  { href: '/student/community/new', label: 'New Post' },
];

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <SectionNav links={links} />
      {children}
    </div>
  );
}
