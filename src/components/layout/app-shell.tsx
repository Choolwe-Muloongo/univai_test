'use client';

import { useMemo } from 'react';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AiTutorWidget } from '@/components/layout/ai-tutor-widget';
import { useSession } from '@/components/providers/session-provider';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

type AppShellProps = {
  children: React.ReactNode;
  role?: string;
  showAiTutor?: boolean;
};

export function AppShell({ children, role, showAiTutor }: AppShellProps) {
  const { session } = useSession();
  const resolvedRole = useMemo(() => role ?? session?.user?.role ?? null, [role, session]);
  const isStudent = resolvedRole?.includes('student') || resolvedRole === 'enrolled';
  const shouldShowAiTutor = showAiTutor ?? Boolean(isStudent);

  return (
    <SidebarProvider>
      <div className="flex min-h-svh bg-transparent text-foreground">
        <Sidebar>
          <AppSidebar role={resolvedRole ?? undefined} />
        </Sidebar>
        <SidebarInset>
          <div className="page-shell flex h-full flex-col gap-4 py-3 sm:gap-6 sm:py-4">
            <AppHeader role={resolvedRole ?? undefined} />
            <main className="section-shell flex-1 overflow-y-auto">{children}</main>
            {shouldShowAiTutor && <AiTutorWidget />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
