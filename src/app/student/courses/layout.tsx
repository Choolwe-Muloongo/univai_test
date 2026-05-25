import { Suspense } from 'react';

export default function StudentCoursesLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="p-6 text-sm">Loading...</div>}>{children}</Suspense>;
}
