import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-3xl space-y-6">
            <Badge variant="secondary">Terms of Service</Badge>
            <h1 className="text-4xl font-extrabold tracking-tight">Terms & Conditions</h1>
            <p className="text-muted-foreground">
              By using UnivAI, you agree to maintain academic integrity, comply with institutional policies, and use
              the platform responsibly. These terms outline your rights and responsibilities.
            </p>
            <Separator />

            <div className="space-y-6 text-sm text-muted-foreground">
              <section className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Enrollment & Eligibility</h2>
                <p>
                  Students must provide accurate information during registration and maintain eligibility requirements
                  throughout their program.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Academic Integrity</h2>
                <p>
                  Cheating, plagiarism, or misrepresentation of work can result in disciplinary action, including
                  removal from the program.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Payments & Refunds</h2>
                <p>
                  Tuition and fees are due according to your selected plan. Refunds follow the published UnivAI
                  academic calendar and policy guidelines.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Platform Use</h2>
                <p>
                  You agree not to misuse the platform, disrupt other learners, or attempt unauthorized access to
                  systems or data.
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
