'use client';

import { useMemo } from 'react';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AiTutorWidget } from '@/components/layout/ai-tutor-widget';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useSession } from '@/components/providers/session-provider';

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
      <div className="flex min-h-svh bg-background text-foreground">
        <Sidebar>
          <AppSidebar role={resolvedRole ?? undefined} />
        </Sidebar>
        <SidebarInset>
          <div className="flex h-full flex-col">
            <AppHeader role={resolvedRole ?? undefined} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
            {shouldShowAiTutor && <AiTutorWidget />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
