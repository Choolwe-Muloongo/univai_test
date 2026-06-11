'use client';

import { Suspense, useMemo } from 'react';
import { usePathname } from 'next/navigation';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AiTutorWidget } from '@/components/layout/ai-tutor-widget';
import { useSession } from '@/components/providers/session-provider';
import { isStudentRole } from '@/lib/auth/roles';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

type AppShellProps = {
  children: React.ReactNode;
  role?: string;
  showAiTutor?: boolean;
};

function isFocusedLessonPath(pathname?: string | null) {
  return Boolean(pathname?.startsWith('/student/courses/') && pathname.includes('/lessons/'));
}

export function AppShell({ children, role, showAiTutor }: AppShellProps) {
  const { session } = useSession();
  const pathname = usePathname();
  const resolvedRole = useMemo(() => role ?? session?.user?.role ?? null, [role, session]);
  const isStudent = isStudentRole(resolvedRole);
  const fullWidthWorkspace = pathname?.startsWith('/admin/short-courses/manual') ?? false;
  const focusedLesson = isFocusedLessonPath(pathname);
  const shouldShowAiTutor = showAiTutor ?? Boolean(isStudent && !focusedLesson);

  return (
    <SidebarProvider>
      <div className="flex min-h-svh bg-transparent text-foreground">
        {!fullWidthWorkspace && !focusedLesson ? (
          <Sidebar>
            <AppSidebar />
          </Sidebar>
        ) : null}
        <SidebarInset>
          <div className={`${fullWidthWorkspace ? 'w-full px-3 sm:px-4 lg:px-5' : focusedLesson ? 'flex min-h-svh w-full flex-col overflow-hidden px-0 py-0' : 'page-shell'} flex h-full flex-col ${focusedLesson ? 'gap-0' : 'gap-4 py-3 sm:gap-6 sm:py-4'}`}>
            {!focusedLesson ? <AppHeader role={resolvedRole ?? undefined} hideSidebarTrigger={fullWidthWorkspace} /> : null}
            <main className={`${fullWidthWorkspace ? 'flex-1 overflow-y-auto rounded-2xl border bg-background/70 p-3 shadow-sm sm:p-4 lg:p-5' : focusedLesson ? 'univai-lesson-render-safe min-h-0 flex-1 overflow-y-auto bg-background' : 'section-shell flex-1 overflow-y-auto'}`}>{children}</main>
            {shouldShowAiTutor ? (
              <Suspense fallback={null}>
                <AiTutorWidget />
              </Suspense>
            ) : null}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
