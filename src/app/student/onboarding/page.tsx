import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const tasks = [
  { title: 'Complete Orientation', href: '/student/onboarding/orientation', status: 'Pending' },
  { title: 'Set AI Preferences', href: '/student/onboarding/ai-setup', status: 'Pending' },
  { title: 'Review Study Plan', href: '/student/study-plan', status: 'Pending' },
];

export default function OnboardingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Onboarding</h1>
        <p className="text-muted-foreground">Complete the steps below to get started.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.map((task) => (
            <div key={task.title} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-muted-foreground">Required before first week.</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{task.status}</Badge>
                <Button size="sm" asChild>
                  <Link href={task.href}>Open</Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/student/dashboard">Skip for now</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
