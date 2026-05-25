'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/payments/invoices');
  }, [router]);

  return (
    <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
      Redirecting to the secure invoice checkout...
    </div>
  );
}
