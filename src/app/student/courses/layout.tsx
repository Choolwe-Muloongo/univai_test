import { Suspense } from 'react';
import type { ReactNode } from 'react';

export default function StudentCoursesLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="p-6 text-sm">Loading...</div>}>{children}</Suspense>;
}
