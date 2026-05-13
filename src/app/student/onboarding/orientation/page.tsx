import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OnboardingOrientationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orientation</h1>
        <p className="text-muted-foreground">Learn how UnivAI works before your first week.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome Session</CardTitle>
          <CardDescription>5 minute overview of your dashboard, AI tools, and course flow.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video rounded-lg bg-muted" />
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/student/onboarding">Back</Link>
          </Button>
          <Button asChild>
            <Link href="/student/dashboard">Finish Orientation</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
