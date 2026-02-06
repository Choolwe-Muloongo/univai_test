import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const steps = [
  { title: 'Confirm Profile', status: 'Completed' },
  { title: 'Select Semester Modules', status: 'Pending' },
  { title: 'Tuition Payment', status: 'Pending' },
  { title: 'Enrollment Confirmation', status: 'Locked' },
];

export default function EnrollmentPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Enrollment</h1>
        <p className="text-muted-foreground">Complete your enrollment to activate your student account.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Enrollment Checklist</CardTitle>
            <CardDescription>Finish all steps to unlock your program dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step) => (
              <div key={step.title} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">Required for activation</p>
                </div>
                <Badge variant={step.status === 'Completed' ? 'default' : 'secondary'}>{step.status}</Badge>
              </div>
            ))}
          </CardContent>
          <CardFooter className="gap-3">
            <Button asChild>
              <Link href="/student/enroll/modules">Select Modules</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/enroll/payment">Proceed to Payment</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support</CardTitle>
            <CardDescription>Need help with enrollment?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Contact admissions or open a support ticket.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link href="/student/support">Open Support</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
