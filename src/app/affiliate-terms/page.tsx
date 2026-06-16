import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    title: '1. Application is not automatic approval',
    body: 'Submitting an affiliate application saves your request. UnivAI may approve, reject, suspend, or terminate affiliate access where necessary to protect learners, payments, and the platform.',
  },
  {
    title: '2. Entry fee and access requirement',
    body: 'Affiliate activation requires at least one paid short-course entry fee and one paid course access package or approved bundle on the applicant account. Legacy applications submitted before this rule was clearly displayed are preserved, but they must still complete the current requirements before activation.',
  },
  {
    title: '3. Valid referrals only',
    body: 'Commissions apply only to valid referrals. Fake accounts, duplicate abuse, self-referrals, misleading promotions, spam, payment manipulation, or suspicious activity may lead to commission reversal, suspension, or removal from the program.',
  },
  {
    title: '4. Payout review',
    body: 'Payouts require correct mobile money details. UnivAI may delay or manually review payouts where activity appears unusual, incomplete, disputed, or risky.',
  },
  {
    title: '5. Changes to the program',
    body: 'UnivAI may update affiliate rates, tiers, eligibility requirements, payout rules, or review rules. Updated terms apply from the date they are published or accepted in the platform.',
  },
];

export default function AffiliateTermsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">UnivAI Affiliate Program</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Affiliate Terms and Conditions</h1>
        <p className="mt-3 text-sm text-muted-foreground">Version affiliate-2026-06-16-v1. These terms explain the minimum rules for applying, activating, earning, and receiving payouts as a UnivAI affiliate.</p>
      </section>

      {sections.map((section) => (
        <Card key={section.title} className="rounded-3xl">
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>Affiliate rule</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {section.body}
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
