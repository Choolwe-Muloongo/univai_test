'use client';

import { useMemo } from 'react';
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

export function AppShell({ children, role, showAiTutor }: AppShellProps) {
  const { session } = useSession();
  const pathname = usePathname();
  const resolvedRole = useMemo(() => role ?? session?.user?.role ?? null, [role, session]);
  const isStudent = isStudentRole(resolvedRole);
  const shouldShowAiTutor = showAiTutor ?? Boolean(isStudent);
  const fullWidthWorkspace = pathname?.startsWith('/admin/short-courses/manual') ?? false;

  return (
    <SidebarProvider>
      <div className="flex min-h-svh bg-transparent text-foreground">
        {!fullWidthWorkspace ? (
          <Sidebar>
            <AppSidebar role={resolvedRole ?? undefined} />
          </Sidebar>
        ) : null}
        <SidebarInset>
          <div className={`${fullWidthWorkspace ? 'w-full px-3 sm:px-4 lg:px-5' : 'page-shell'} flex h-full flex-col gap-4 py-3 sm:gap-6 sm:py-4`}>
            <AppHeader role={resolvedRole ?? undefined} hideSidebarTrigger={fullWidthWorkspace} />
            <main className={`${fullWidthWorkspace ? 'flex-1 overflow-y-auto rounded-2xl border bg-background/70 p-3 shadow-sm sm:p-4 lg:p-5' : 'section-shell flex-1 overflow-y-auto'}`}>{children}</main>
            {shouldShowAiTutor && <AiTutorWidget />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
