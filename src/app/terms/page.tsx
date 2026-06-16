import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  ['1. Use of UnivAI', 'Users must use UnivAI for learning, teaching, administration, payments, and approved platform activities only. Accounts may be limited where activity is harmful, misleading, abusive, or unsafe.'],
  ['2. Account responsibility', 'Users are responsible for keeping login details safe and for activity performed under their account. UnivAI may request verification before restoring access or changing sensitive account details.'],
  ['3. Course access', 'Course access depends on enrollment, payment status, programme rules, and admin settings. Access may be delayed where payment confirmation, verification, or admin review is required.'],
  ['4. Payments', 'Payments are processed through approved providers such as Lenco or through admin-approved methods. A payment is treated as complete only after UnivAI verifies it and updates the invoice status.'],
  ['5. Platform changes', 'UnivAI may update features, course structures, prices, access rules, affiliate rules, or policies. Where important, users may be asked to accept updated rules before continuing.'],
  ['6. User content', 'Users must not upload or submit content that is illegal, harmful, false, infringing, or abusive. UnivAI may remove content or restrict access where needed to protect the platform.'],
  ['7. Service availability', 'UnivAI may experience downtime, maintenance, payment delays, or provider outages. The platform will try to restore service and preserve user records where possible.'],
  ['8. Admin actions', 'Admins may review, correct, suspend, approve, reject, or reverse records where required for academic integrity, payment safety, fraud prevention, or operational reasons.'],
  ['9. Contact and disputes', 'Users should contact UnivAI support with account, payment, access, or course disputes. Users should provide invoice references, screenshots, and clear details where possible.'],
];

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">UnivAI Terms</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Platform Terms and Conditions</h1>
        <p className="mt-3 text-sm text-muted-foreground">Version platform-2026-06-16-v1. These terms apply to students, admins, lecturers, affiliates, and other users of UnivAI.</p>
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
