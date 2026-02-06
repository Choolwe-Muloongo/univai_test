import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function EnrollmentPaymentPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tuition Payment</h1>
        <p className="text-muted-foreground">Review your invoice and complete payment to finalize enrollment.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
          <CardDescription>Semester 1 tuition</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Tuition</span>
            <span className="font-semibold">$1,250.00</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Enrollment Fee</span>
            <span className="font-semibold">$50.00</span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span>Total Due</span>
            <span className="text-lg font-bold">$1,300.00</span>
          </div>
          <Badge variant="secondary">Payment Pending</Badge>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/student/enroll/modules">Back</Link>
          </Button>
          <Button asChild>
            <Link href="/student/enroll/success">Pay & Complete</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
