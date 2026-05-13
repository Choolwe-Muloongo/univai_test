import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-3xl space-y-6">
            <Badge variant="secondary">Privacy Policy</Badge>
            <h1 className="text-4xl font-extrabold tracking-tight">Your Data, Protected</h1>
            <p className="text-muted-foreground">
              This policy explains how UnivAI collects, uses, and protects your information. We only collect what is
              required to deliver learning services, maintain academic integrity, and support student success.
            </p>
            <Separator />

            <div className="space-y-6 text-sm text-muted-foreground">
              <section className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Information We Collect</h2>
                <p>
                  Account details, enrollment data, learning progress, and uploaded documents required for admissions
                  and verification. We never sell personal information.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">How We Use Information</h2>
                <p>
                  To deliver courses, personalize learning, issue credentials, and provide academic support. We also
                  use anonymized analytics to improve the platform.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Data Security</h2>
                <p>
                  UnivAI applies encryption at rest and in transit, access controls, and audit logging. Only authorized
                  staff can access sensitive records.
                </p>
              </section>
              <section className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Your Rights</h2>
                <p>
                  You can request a copy of your data, update incorrect information, or request deletion where legally
                  permissible.
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
