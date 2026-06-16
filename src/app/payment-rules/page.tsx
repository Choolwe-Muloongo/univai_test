import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  ['1. Invoice payments', 'UnivAI payments are linked to invoices. A payment is complete when the invoice is verified and marked paid.'],
  ['2. Delayed confirmation', 'If money is deducted but access does not unlock, users should use Check payment status or contact support with the invoice number and payment reference. UnivAI should check the first payment before asking the user to pay again.'],
  ['3. Access activation', 'Course, certificate, bundle, or affiliate access activates after the related invoice is verified as paid and the unlock process runs.'],
  ['4. Payment review', 'Payments may need review if the amount, currency, reference, invoice, or provider status does not match.'],
  ['5. Support details', 'Users should provide screenshots, invoice ID, transaction reference, and account email when raising payment issues.'],
];

export default function PaymentRulesPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">UnivAI Payments</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Payment Rules</h1>
        <p className="mt-3 text-sm text-muted-foreground">Version payments-2026-06-16-v1. This page explains invoice payment, confirmation, access activation, and payment review.</p>
      </section>
      {sections.map(([title, body]) => (
        <Card key={title} className="rounded-3xl">
          <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">{body}</CardContent>
        </Card>
      ))}
    </main>
  );
}
