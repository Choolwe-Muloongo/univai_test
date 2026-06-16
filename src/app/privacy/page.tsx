import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  ['1. Information we collect', 'UnivAI may collect names, email addresses, phone numbers, account roles, school or programme data, payment references, course activity, affiliate activity, support messages, uploaded learning content, and technical logs.'],
  ['2. Why we use information', 'Information is used to create accounts, manage learning access, process invoices, verify payments, issue certificates, support users, improve services, detect abuse, and maintain academic and payment records.'],
  ['3. Payment information', 'UnivAI stores invoice and payment reference data needed to verify transactions. Sensitive payment processing is handled by approved payment providers. UnivAI does not need to store full card details.'],
  ['4. Sharing information', 'Information may be shared with service providers, payment processors, school administrators, support staff, or authorities where required for service delivery, safety, compliance, or dispute handling.'],
  ['5. Security', 'UnivAI uses reasonable technical and administrative safeguards to protect user data. Users should also protect their passwords and report suspicious activity quickly.'],
  ['6. Retention', 'UnivAI keeps records as long as needed for learning history, certificates, payments, audits, support, safety, and operational requirements. Some records may be retained after account closure where necessary.'],
  ['7. User requests', 'Users may request correction of inaccurate account data or ask questions about their data through support. Some changes may require identity or account verification.'],
  ['8. Policy updates', 'This policy may be updated as UnivAI features, payment systems, or operational requirements change.'],
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">UnivAI Privacy</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Version privacy-2026-06-16-v1. This policy explains how UnivAI handles personal and platform data.</p>
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
