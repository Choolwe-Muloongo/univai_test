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
  const workspaceMode = fullWidthWorkspace || focusedLesson;

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full max-w-full overflow-x-hidden bg-transparent text-foreground">
        {!workspaceMode ? (
          <Sidebar>
            <AppSidebar />
          </Sidebar>
        ) : null}
        <SidebarInset className={workspaceMode ? 'w-full max-w-full overflow-x-hidden' : undefined}>
          <div
            className={
              fullWidthWorkspace
                ? 'flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-background px-2 py-2 sm:px-4'
                : focusedLesson
                  ? 'flex min-h-svh w-full max-w-full flex-col overflow-hidden px-0 py-0'
                  : 'page-shell flex h-full flex-col gap-4 py-3 sm:gap-6 sm:py-4'
            }
          >
            {!workspaceMode ? <AppHeader role={resolvedRole ?? undefined} /> : null}
            <main
              className={
                fullWidthWorkspace
                  ? 'min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-background'
                  : focusedLesson
                    ? 'univai-lesson-render-safe min-h-0 flex-1 overflow-y-auto bg-background'
                    : 'section-shell flex-1 overflow-y-auto'
              }
            >
              {children}
            </main>
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
