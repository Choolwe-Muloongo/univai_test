import type { ReactNode } from 'react';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function InstructorLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar role="instructor" />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger />
          <span className="font-semibold text-primary">UnivAI Instructor</span>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
