import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoleIntentSwitcher } from '@/components/auth/role-intent-switcher';
import { getAllOnboardingChecklists, getGuidedRecommendationsByGoal } from '@/lib/auth-routing';

export default function StartPage() {
  const checklists = getAllOnboardingChecklists();
  const recommendations = getGuidedRecommendationsByGoal();

  return (
    <div className="relative min-h-screen bg-background p-4 md:p-8">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold text-primary">
          <Logo className="size-8" />
          <span>UnivAI</span>
        </Link>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Choose your role and intent</CardTitle>
            <CardDescription>
              One gateway for current and future personas. Pick your best-fit portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoleIntentSwitcher />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>I don’t know where to start</CardTitle>
            <CardDescription>Use these goal-based recommendations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((item) => (
              <div key={item.role} className="rounded-md border p-3">
                <p className="text-sm font-medium">{item.role}</p>
                <p className="text-xs text-muted-foreground">{item.goal}</p>
                <Button asChild variant="link" className="h-auto px-0 text-xs">
                  <Link href={item.href}>Go to {item.role} login</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-5xl gap-4 sm:grid-cols-2">
        {checklists.map((checklist) => (
          <Card key={checklist.role}>
            <CardHeader>
              <CardTitle className="text-base">{checklist.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                {checklist.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
