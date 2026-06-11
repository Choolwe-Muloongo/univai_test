import Link from 'next/link';
import type { ReactNode } from 'react';

const tabs = [
  { href: '/admin/short-courses', label: 'Overview' },
  { href: '/admin/short-courses/catalogue', label: 'Catalogue' },
  { href: '/admin/short-courses/builder', label: 'AI Builder' },
  { href: '/admin/short-courses/manual', label: 'Manual Builder' },
  { href: '/admin/short-courses/json-builder', label: 'JSON Builder' },
  { href: '/admin/short-courses/card-images', label: 'Card Images' },
  { href: '/admin/short-courses/question-bank', label: 'Question Bank' },
  { href: '/admin/short-courses/review', label: 'Review & Publish' },
  { href: '/admin/short-courses/enrolments', label: 'Enrolments' },
  { href: '/admin/short-courses/learners', label: 'Learners' },
  { href: '/admin/short-courses/pricing', label: 'Pricing' },
];

export function ShortCourseShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="short-course-admin-shell w-full max-w-full space-y-4 overflow-x-hidden sm:space-y-6">
      <section className="w-full max-w-full space-y-3 overflow-x-hidden">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-normal text-primary sm:text-sm">Short Courses</p>
          <h1 className="break-words text-2xl font-bold leading-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
        </div>
        <div className="short-course-admin-tabs flex w-full max-w-full gap-2 overflow-x-auto rounded-xl border bg-card/60 p-2">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground sm:text-sm"
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </section>
      <div className="w-full max-w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
