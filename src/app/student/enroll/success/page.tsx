import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EnrollmentSuccessPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Enrollment Complete</CardTitle>
          <CardDescription>Your student account is now active.</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          You can now access your dashboard, AI tools, and semester modules.
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/student/dashboard">Go to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
