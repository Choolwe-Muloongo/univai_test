'use client';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AiTutorWidget } from '@/components/layout/ai-tutor-widget';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, []);

  const isStudent = userRole === 'premium-student' || userRole === 'freemium-student';

  return (
    <SidebarProvider>
      <div className="flex min-h-svh bg-background text-foreground">
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <div className="flex h-full flex-col">
            <AppHeader />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
            {isStudent && <AiTutorWidget />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
