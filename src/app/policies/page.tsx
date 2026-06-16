import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const items = [
  { href: '/terms', title: 'Platform Terms' },
  { href: '/privacy', title: 'Privacy Policy' },
  { href: '/payment-refund-policy', title: 'Payment and Refund Policy' },
  { href: '/affiliate-terms', title: 'Affiliate Program Terms' },
];

export default function PoliciesPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">UnivAI Policies</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Terms, Privacy, Payments, and Affiliates</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Important rules for using UnivAI, paying invoices, joining courses, and applying for affiliate access.</p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full rounded-3xl transition hover:border-primary/40 hover:bg-primary/5">
              <CardHeader><CardTitle>{item.title}</CardTitle></CardHeader>
              <CardContent className="text-sm font-medium text-primary">Open</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
