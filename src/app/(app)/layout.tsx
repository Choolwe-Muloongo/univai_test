'use client';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AiTutorWidget } from '@/components/layout/ai-tutor-widget';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {

  useEffect(() => {
    // Check for a flag/cookie/localStorage to avoid calling the API on every client-side navigation
    // (This is an extra optimization, the API route already prevents duplicate seeding)
    const hasAttemptedSeed = localStorage.getItem('hasAttemptedSeed');
    
    if (!hasAttemptedSeed) {
      const seedDatabase = async () => {
        try {
          // Call the API route created in Step 2
          const response = await fetch('/api/seed', { 
            method: 'POST',
            // Headers are often needed for POST requests in Route Handlers
            headers: {
                'Content-Type': 'application/json',
            },
          });
          
          const data = await response.json();
          
          if (response.ok) {
            console.log(data.message);
            // Mark as attempted, even if it said 'already seeded'
            localStorage.setItem('hasAttemptedSeed', 'true');
          } else {
            // Handle error response from API
            console.error('Seeding failed:', data.message);
          }
        } catch (error) {
          console.error('Network or unhandled error during seeding:', error);
        }
      };

      seedDatabase();
    }
  }, []);

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
