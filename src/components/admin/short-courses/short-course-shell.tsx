import Link from 'next/link';
import type { ReactNode } from 'react';

const tabs = [
  { href: '/admin/short-courses', label: 'Overview' },
  { href: '/admin/short-courses/catalogue', label: 'Catalogue' },
  { href: '/admin/short-courses/builder', label: 'AI Builder' },
  { href: '/admin/short-courses/manual', label: 'Manual Builder' },
  { href: '/admin/short-courses/card-images', label: 'Card Images' },
  { href: '/admin/short-courses/question-bank', label: 'Question Bank' },
  { href: '/admin/short-courses/review', label: 'Review & Publish' },
  { href: '/admin/short-courses/enrolments', label: 'Enrolments' },
  { href: '/admin/short-courses/learners', label: 'Learners' },
  { href: '/admin/short-courses/pricing', label: 'Pricing' },
];

export function ShortCourseShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-primary">Short Courses</p>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto rounded-xl border bg-card/60 p-2">
          {tabs.map((tab) => (
            <Link key={tab.href} href={tab.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
              {tab.label}
            </Link>
          ))}
        </div>
      </section>
      {children}
    </div>
  );
}
