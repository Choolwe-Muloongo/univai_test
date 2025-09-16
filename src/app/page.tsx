// src/app/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons/logo';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the login page
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
      <Logo className="mb-4 h-16 w-16 text-primary" />
      <h1 className="mb-2 text-4xl font-bold">UnivAI</h1>
      <p className="text-muted-foreground">Redirecting to login...</p>
    </div>
  );
}
